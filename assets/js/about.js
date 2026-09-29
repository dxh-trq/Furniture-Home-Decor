/* Morrow — about page: "What goes into an Alder sofa" exploded diagram */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const stage = $('[data-anatomy]');
  if (!stage) return;

  const buttons = $$('[data-part-btn]');
  let current = null;

  const select = (part) => {
    current = part === current ? null : part; // pressing the selected layer again clears it
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.partBtn === current)));
    $$('[data-part]', stage).forEach((g) => g.classList.toggle('is-active', g.dataset.part === current));
    stage.classList.toggle('has-selection', !!current);
    $$('[data-part-detail]').forEach((d) => { d.hidden = d.dataset.partDetail !== (current || 'none'); });
  };

  buttons.forEach((b) => b.addEventListener('click', () => select(b.dataset.partBtn)));
  // the drawing itself is clickable too (the buttons are the keyboard route)
  $$('[data-part]', stage).forEach((g) => g.addEventListener('click', () => select(g.dataset.part)));
  $$('[data-part]', stage).forEach((g) => {
    g.addEventListener('mouseenter', () => g.classList.add('is-hover'));
    g.addEventListener('mouseleave', () => g.classList.remove('is-hover'));
  });
})();
