/* Morrow — accessibility page: display preferences (applied site-wide by main.js) and the feedback form.
   Front end only: send feedback to your help desk in the submit handler. */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const panel = $('.ax-display');
  if (!panel) return;

  /* ---------- Display preferences ---------- */
  const KEY = window.Morrow?.DISPLAY_KEY || 'morrow-display';
  const apply = window.Morrow?.applyDisplay || (() => {});
  const status = $('[data-ax-status]');
  const switches = $$('[data-ax]', panel);
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (err) { return {}; } };

  const show = (d) => {
    const size = $(`input[name="ax-size"][value="${d.size || '100'}"]`, panel);
    if (size) size.checked = true;
    switches.forEach((sw) => sw.setAttribute('aria-checked', String(!!d[sw.dataset.ax])));
  };
  const current = () => {
    const d = { size: $('input[name="ax-size"]:checked', panel).value };
    switches.forEach((sw) => { d[sw.dataset.ax] = sw.getAttribute('aria-checked') === 'true'; });
    return d;
  };
  const save = (msg) => {
    const d = current();
    const isDefault = d.size === '100' && switches.every((sw) => !d[sw.dataset.ax]);
    try {
      if (isDefault) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, JSON.stringify(d));
    } catch (err) { /* storage unavailable: still applies to this page */ }
    apply(d);
    status.textContent = msg;
  };

  show(read());
  switches.forEach((sw) => sw.addEventListener('click', () => {
    const on = sw.getAttribute('aria-checked') !== 'true';
    sw.setAttribute('aria-checked', String(on));
    const label = $(`label[for="${sw.id}"]`).textContent.trim();
    save(`${label} ${on ? 'on' : 'off'}. Saved for every page.`);
  }));
  $$('input[name="ax-size"]', panel).forEach((r) => r.addEventListener('change', () => {
    save(`Text size set to ${r.closest('label').querySelector('small').textContent.toLowerCase()}. Saved for every page.`);
  }));
  $('[data-ax-reset]').addEventListener('click', () => {
    show({});
    save('Back to the default display.');
  });

  /* ---------- Feedback ---------- */
  const form = $('[data-ax-form]');
  const done = $('[data-ax-done]');
  const page = $('#ax-page');
  // prefill with the page the visitor came from, if it was on this site
  try {
    const ref = document.referrer && new URL(document.referrer);
    if (ref && ref.origin === location.origin && ref.pathname !== location.pathname) {
      page.value = ref.pathname.split('/').pop() || 'index.html';
      $('[data-ax-page-hint]').hidden = false;
    }
  } catch (err) { /* no usable referrer */ }

  const setError = (id, msg) => {
    const input = document.getElementById(id);
    const err = document.getElementById(id + '-err');
    input?.setAttribute('aria-invalid', String(!!msg));
    if (err) { err.textContent = msg; err.hidden = !msg; }
    return !msg;
  };
  const val = (id) => document.getElementById(id).value.trim();
  form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true') setError(e.target.id, ''); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const checks = [
      ['ax-what', val('ax-what').length >= 5 ? '' : 'Tell us what happened, in a few words or more.'],
      ['ax-email', !val('ax-email') || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('ax-email')) ? '' : 'Check the email address, or leave it blank.'],
    ];
    const bad = checks.filter(([id, msg]) => !setError(id, msg));
    if (bad.length) { document.getElementById(bad[0][0]).focus(); return; }
    // Replace with a POST to your help desk, tagged as accessibility feedback.
    $('[data-ax-done-text]').textContent = val('ax-email')
      ? `We’ve passed this to our accessibility lead, who will reply to ${val('ax-email')} within two working days.`
      : 'We’ve passed this to our accessibility lead. As you didn’t leave an email, we won’t reply, but we will look into it.';
    form.hidden = true;
    done.hidden = false;
    done.focus();
  });
  $('[data-ax-again]').addEventListener('click', () => {
    form.reset();
    form.hidden = false;
    done.hidden = true;
    $('#ax-what').focus();
  });
})();
