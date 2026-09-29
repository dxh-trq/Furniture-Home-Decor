/* Morrow — careers page: role filters (team, search, location), expandable roles with linkable URLs,
   and the application dialog. Roles are plain HTML in the page; send applications to your ATS in the submit handler. */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const list = $('[data-cr-roles]');
  if (!list) return;

  const roles = $$('.cr-role', list);
  const chips = $$('[data-cr-team]');
  const search = $('[data-cr-search]');
  const loc = $('[data-cr-loc]');
  let team = 'all';

  /* ---------- Filters ---------- */
  const filter = () => {
    const q = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    roles.forEach((r) => {
      const ok = (team === 'all' || r.dataset.team === team)
        && (!loc.value || r.dataset.loc === loc.value)
        && q.every((w) => r.dataset.text.includes(w));
      r.hidden = !ok;
      if (ok) shown += 1;
    });
    $('[data-cr-count]').textContent = `${shown} of ${roles.length} roles`;
    $('[data-cr-empty]').hidden = shown > 0;
  };
  const setTeam = (t) => {
    team = t;
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.crTeam === t)));
    filter();
  };
  chips.forEach((c) => c.addEventListener('click', () => setTeam(c.dataset.crTeam)));
  search.addEventListener('input', filter);
  loc.addEventListener('change', filter);
  $('[data-cr-reset]').addEventListener('click', () => { search.value = ''; loc.value = ''; setTeam('all'); });
  $$('[data-team-jump]').forEach((b) => b.addEventListener('click', () => {
    setTeam(b.dataset.teamJump);
    $('#roles').scrollIntoView({ behavior: 'smooth' });
  }));
  filter();

  /* ---------- Expand roles; #role-… links open them ---------- */
  const toggle = (role, open = !role.classList.contains('is-open')) => {
    role.classList.toggle('is-open', open);
    $('.cr-role__toggle', role).setAttribute('aria-expanded', String(open));
    $('.cr-role__body', role).hidden = !open;
  };
  roles.forEach((r) => $('.cr-role__toggle', r).addEventListener('click', () => {
    toggle(r);
    if (r.classList.contains('is-open')) history.replaceState(null, '', `#${r.id}`);
  }));
  const openFromHash = () => {
    const r = roles.find((x) => `#${x.id}` === location.hash);
    if (!r) return;
    if (r.hidden) { search.value = ''; loc.value = ''; setTeam('all'); }
    toggle(r, true);
    r.scrollIntoView({ block: 'start' });
  };
  window.addEventListener('hashchange', openFromHash);
  openFromHash();
  $$('[data-open-role]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    history.replaceState(null, '', `#role-${a.dataset.openRole}`);
    openFromHash();
  }));
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    const url = `${location.href.split('#')[0]}#${b.dataset.copy}`;
    try { await navigator.clipboard.writeText(url); window.Morrow?.toast('Link copied'); } catch (err) { window.Morrow?.toast(url); }
  }));

  /* ---------- Application dialog ---------- */
  const dialog = $('[data-cr-dialog]');
  const form = $('[data-cr-form]');
  const done = $('[data-cr-done]');
  const cv = $('#ap-cv');
  const fileLabel = $('[data-cr-file]');
  const FILE_TEXT = fileLabel.innerHTML;
  let roleName = '';
  let opener = null;

  const setError = (id, msg) => {
    const input = document.getElementById(id);
    const err = document.getElementById(id + '-err');
    input?.setAttribute('aria-invalid', String(!!msg));
    if (err) { err.textContent = msg; err.hidden = !msg; }
    return !msg;
  };
  const val = (id) => document.getElementById(id).value.trim();

  const open = (name, from) => {
    roleName = name;
    opener = from;
    $('[data-cr-role-name]').textContent = name;
    form.reset();
    fileLabel.innerHTML = FILE_TEXT;
    $$('.field__error', form).forEach((e) => { e.hidden = true; });
    $$('[aria-invalid]', form).forEach((e) => e.removeAttribute('aria-invalid'));
    form.hidden = false;
    done.hidden = true;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    $('#ap-first').focus();
  };
  const close = () => dialog.close();
  dialog.addEventListener('close', () => {
    document.body.style.overflow = '';
    opener?.focus();
  });
  $$('[data-apply]').forEach((b) => b.addEventListener('click', () => open(b.dataset.apply, b)));
  $$('[data-cr-close]', dialog).forEach((b) => b.addEventListener('click', close));
  dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); }); // click on the backdrop

  cv.addEventListener('change', () => {
    const f = cv.files[0];
    if (!f) { fileLabel.innerHTML = FILE_TEXT; return; }
    const okType = /\.(pdf|docx?)$/i.test(f.name);
    const msg = !okType ? 'Upload a PDF or Word document.' : f.size > 10 * 1024 * 1024 ? 'That file is over 10 MB.' : '';
    setError('ap-cv', msg);
    fileLabel.textContent = msg ? 'Choose a different file' : `${f.name} (${Math.max(1, Math.round(f.size / 1024))} KB)`;
  });
  form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true') setError(e.target.id, ''); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = cv.files[0];
    const checks = [
      ['ap-first', val('ap-first') ? '' : 'Enter your first name.'],
      ['ap-last', val('ap-last') ? '' : 'Enter your last name.'],
      ['ap-email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('ap-email')) ? '' : 'Enter an email address like name@example.com.'],
      ['ap-cv', !f ? 'Add your CV or résumé.' : !/\.(pdf|docx?)$/i.test(f.name) ? 'Upload a PDF or Word document.' : f.size > 10 * 1024 * 1024 ? 'That file is over 10 MB.' : ''],
      ['ap-why', val('ap-why').length >= 10 ? '' : 'Tell us a little about why you’d like to join.'],
    ];
    const bad = checks.filter(([id, msg]) => !setError(id, msg));
    if (bad.length) {
      const id = bad[0][0];
      document.getElementById(id).focus();
      if (id === 'ap-cv') $('.upload', form).scrollIntoView({ block: 'center' });
      return;
    }
    // Replace with a POST to your applicant tracking system (include the CV file).
    $('[data-cr-done-text]').textContent = roleName === 'General application'
      ? `Thanks, ${val('ap-first')}. We’ll keep your details and email ${val('ap-email')} when a role fits.`
      : `Thanks, ${val('ap-first')}. The hiring manager for the ${roleName} role will read your application and email ${val('ap-email')} within a week, whatever the answer.`;
    form.hidden = true;
    done.hidden = false;
    done.focus();
  });
})();
