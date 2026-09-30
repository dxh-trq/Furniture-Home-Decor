/* Morrow — privacy page: privacy choices (saved on this device, honours Global Privacy Control) and the data request form.
   Front end only: save choices to the customer's account and send requests to your privacy inbox or tool. */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const panel = $('.pv-choices__panel');
  if (!panel) return;

  /* ---------- Privacy choices ---------- */
  const KEY = 'morrow-privacy-choices';
  const switches = $$('[data-choice]', panel);
  const gpc = navigator.globalPrivacyControl === true;
  const saved = $('[data-pv-saved]');
  const set = (sw, on) => sw.setAttribute('aria-checked', String(on));
  const get = (k) => $(`[data-choice="${k}"]`, panel);

  let stored = null;
  try { stored = JSON.parse(localStorage.getItem(KEY)); } catch (err) { stored = null; }
  if (stored) switches.forEach((sw) => { if (!sw.disabled && sw.dataset.choice in stored) set(sw, !!stored[sw.dataset.choice]); });
  if (gpc) {
    set(get('ads'), false);
    get('ads').disabled = true;
    $('[data-pv-gpc]').hidden = false;
  }
  if (stored?.savedAt) saved.textContent = `Last saved ${new Date(stored.savedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`;

  switches.forEach((sw) => sw.addEventListener('click', () => {
    if (sw.disabled) return;
    set(sw, sw.getAttribute('aria-checked') !== 'true');
    saved.textContent = 'You have unsaved changes.';
  }));

  const save = (msg) => {
    const data = { savedAt: Date.now() };
    switches.forEach((sw) => { data[sw.dataset.choice] = sw.getAttribute('aria-checked') === 'true'; });
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (err) { /* storage unavailable */ }
    // Replace with a request that saves these choices to the signed-in customer's account.
    saved.textContent = 'Saved. Your choices apply straight away.';
    window.Morrow?.toast(msg);
  };
  $('[data-pv-save]').addEventListener('click', () => save('Your privacy choices are saved'));
  $('[data-pv-reject]').addEventListener('click', () => {
    switches.forEach((sw) => { if (!sw.disabled) set(sw, false); });
    save('All optional uses are turned off');
  });

  /* ---------- Data request ---------- */
  const form = $('[data-pv-form]');
  const done = $('[data-pv-done]');
  const NOTES = {
    copy: 'We’ll email you a file with everything we hold about you.',
    correct: 'Tell us what’s wrong and what it should be.',
    delete: 'We’ll delete your account and personal information, except order records we must keep for 7 years for tax.',
    optout: 'We’ll stop sharing your information with advertising partners on every device linked to this email.',
  };
  const setError = (id, msg) => {
    const input = document.getElementById(id);
    const err = document.getElementById(id + '-err');
    input?.setAttribute('aria-invalid', String(!!msg));
    if (err) { err.textContent = msg; err.hidden = !msg; }
    return !msg;
  };
  const val = (id) => document.getElementById(id).value.trim();
  const type = () => $('input[name="pv-type"]:checked', form)?.value;

  form.addEventListener('change', (e) => {
    if (e.target.name === 'pv-type') {
      setError('pv-type', '');
      const note = $('[data-pv-type-note]');
      note.textContent = NOTES[type()];
      note.hidden = false;
      $('[data-pv-details]').hidden = type() !== 'correct';
    }
  });
  form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true') setError(e.target.id, ''); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const checks = [
      ['pv-type', type() ? '' : 'Choose what you’d like us to do.'],
      ['pv-name', val('pv-name') ? '' : 'Enter your full name.'],
      ['pv-email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('pv-email')) ? '' : 'Enter the email address you use with Morrow.'],
      ['pv-details', type() !== 'correct' || val('pv-details').length >= 5 ? '' : 'Tell us what needs correcting.'],
    ];
    const bad = checks.filter(([id, msg]) => !setError(id, msg));
    if (bad.length) {
      const id = bad[0][0];
      (id === 'pv-type' ? $('input[name="pv-type"]', form) : document.getElementById(id)).focus();
      return;
    }
    // Replace with a POST to your privacy request tool or inbox.
    const ref = 'PR-' + Math.floor(10000 + Math.random() * 90000);
    const agent = $('#pv-agent').checked ? ' As an authorized agent, you’ll also need to send signed permission from the person you’re acting for.' : '';
    $('[data-pv-done-text]').textContent = `We’ve sent a link to ${val('pv-email')} to confirm it’s you. Once you click it, we’ll complete request ${ref} within 45 days and email you when it’s done.${agent}`;
    form.hidden = true;
    done.hidden = false;
    done.focus();
  });
  $('[data-pv-again]').addEventListener('click', () => {
    form.reset();
    $('[data-pv-type-note]').hidden = true;
    $('[data-pv-details]').hidden = true;
    form.hidden = false;
    done.hidden = true;
    $('input[name="pv-type"]', form).focus();
  });
})();
