/* Morrow — journal index: topic filter, search, load more */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const grid = $('[data-grid]');
  if (!grid) return;

  const PAGE = 9;
  const cards = $$('.jcard', grid);
  const search = $('[data-search]');
  let cat = 'all';
  let shown = PAGE;

  const render = () => {
    const q = search.value.trim().toLowerCase();
    const matches = cards.filter((c) => (cat === 'all' || c.dataset.cat === cat)
      && (!q || c.dataset.title.includes(q) || $('.jcard__excerpt', c).textContent.toLowerCase().includes(q)));
    cards.forEach((c) => { c.hidden = true; });
    matches.slice(0, shown).forEach((c) => { c.hidden = false; });

    $('[data-shown-count]').textContent = Math.min(shown, matches.length);
    $('[data-match-count]').textContent = matches.length;
    $('[data-more-wrap]').hidden = matches.length <= shown;
    const empty = $('[data-empty]');
    empty.hidden = matches.length > 0;
    $('[data-empty-q]').textContent = q || $(`[data-cat-filter="${cat}"]`).firstChild.textContent.trim();
  };

  $$('[data-cat-filter]').forEach((btn) => btn.addEventListener('click', () => {
    cat = btn.dataset.catFilter;
    $$('[data-cat-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    shown = PAGE;
    render();
  }));
  search.addEventListener('input', () => { shown = PAGE; render(); });
  $('[data-clear]').addEventListener('click', () => {
    search.value = '';
    $('[data-cat-filter="all"]').click();
    search.focus();
  });
  $('[data-more]').addEventListener('click', () => {
    const before = cards.filter((c) => !c.hidden).length;
    shown += PAGE;
    render();
    cards.filter((c) => !c.hidden)[before]?.querySelector('.jcard__title a')?.focus();
  });

  render();
})();
