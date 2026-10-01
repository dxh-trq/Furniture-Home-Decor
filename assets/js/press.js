/* Morrow — press page: news filter, copy brand colors, and the press request form
   (front end only: send requests to your press inbox in the submit handler). */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const toast = (m) => window.Morrow?.toast(m);

  /* ---------- News filter ---------- */
  const filter = $('[data-pr-filter]');
  filter?.addEventListener('click', (e) => {
    const b = e.target.closest('[data-topic]');
    if (!b) return;
    $$('[data-topic]', filter).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    $$('.pr-rel').forEach((r) => { r.hidden = b.dataset.topic !== 'all' && r.dataset.topic !== b.dataset.topic; });
  });

  /* ---------- Copy a brand color ---------- */
  $$('.pr-swatch').forEach((b) => b.addEventListener('click', async () => {
    const hex = b.dataset.hex;
    const name = $('.pr-swatch__name', b).textContent;
    try { await navigator.clipboard.writeText(hex); toast(`Copied ${name} ${hex}`); } catch (err) { toast(`${name} is ${hex}`); }
  }));

  /* ---------- Request form ---------- */
  const form = $('[data-pr-form]');
  if (!form) return;
  const msg = $('[data-pr-msg]');
  const error = (field, text) => {
    const wrap = field.closest('.field');
    let el = $('.field__error', wrap);
    field.setAttribute('aria-invalid', String(!!text));
    if (!text) { el?.remove(); field.removeAttribute('aria-describedby'); return; }
    if (!el) { el = document.createElement('p'); el.className = 'field__error'; el.id = `${field.id}-error`; wrap.appendChild(el); }
    el.textContent = text;
    field.setAttribute('aria-describedby', el.id);
  };
  const checks = {
    'pr-name': (v) => (v ? '' : 'Enter your name.'),
    'pr-email': (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter an email address like name@example.com.'),
    'pr-outlet': (v) => (v ? '' : 'Tell us where the story will run.'),
    'pr-msg': (v) => (v.length >= 10 ? '' : 'Tell us a little about the story.'),
  };
  Object.keys(checks).forEach((id) => $(`#${id}`).addEventListener('blur', (e) => {
    if (e.target.getAttribute('aria-invalid') === 'true') error(e.target, checks[id](e.target.value.trim()));
  }));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let first = null;
    Object.entries(checks).forEach(([id, check]) => {
      const f = $(`#${id}`);
      const t = check(f.value.trim());
      error(f, t);
      if (t && !first) first = f;
    });
    if (first) { msg.className = 'pr-form__msg is-error'; msg.textContent = 'Check the highlighted fields.'; first.focus(); return; }
    const deadline = $('#pr-deadline').value;
    const when = deadline ? ` before your deadline of ${new Date(`${deadline}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}` : '';
    msg.className = 'pr-form__msg is-success';
    msg.textContent = `Thanks, ${$('#pr-name').value.trim().split(' ')[0]}. Priya will reply to ${$('#pr-email').value.trim()} today${when}.`;
    form.reset();
  });
})();
