/* Morrow — collection page: shows the collection named in the address (collection.html?c=warm-minimal),
   filters and sorts its pieces, and works out the "buy the set" saving. Each collection is an <article data-collection>. */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const articles = $$('[data-collection]');
  if (!articles.length) return;

  const SET_OFF = 0.1; // saving when buying at least SET_MIN pieces from the set
  const SET_MIN = 3;
  const money = (n) => '$' + Math.round(n).toLocaleString('en-US');

  /* ---------- Which collection ---------- */
  const wanted = new URLSearchParams(location.search).get('c');
  const current = articles.find((a) => a.dataset.collection === wanted) || articles[0];
  articles.forEach((a) => { a.hidden = a !== current; });
  const name = $('.co-hero__title', current).textContent;
  document.title = `${name} collection — Morrow`;
  $$('[data-co-link]').forEach((l) => {
    const on = l.dataset.coLink === current.dataset.collection;
    l.classList.toggle('is-current', on);
    if (on) l.setAttribute('aria-current', 'page');
  });

  /* ---------- Filter and sort ---------- */
  const grid = $('[data-co-grid]', current);
  const cards = $$('.card', grid);
  const sort = $('[data-co-sort]', current);
  let type = 'all';
  const render = () => {
    const order = [...cards].sort((a, b) => {
      if (sort.value === 'low') return a.dataset.price - b.dataset.price;
      if (sort.value === 'high') return b.dataset.price - a.dataset.price;
      return a.dataset.order - b.dataset.order;
    });
    order.forEach((c) => grid.appendChild(c));
    let shown = 0;
    cards.forEach((c) => { c.hidden = type !== 'all' && c.dataset.type !== type; if (!c.hidden) shown += 1; });
    $('[data-co-count]', current).textContent = `${shown} piece${shown === 1 ? '' : 's'}`;
  };
  $$('[data-co-filter]', current).forEach((b) => b.addEventListener('click', () => {
    type = b.dataset.coFilter;
    $$('[data-co-filter]', current).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    render();
  }));
  sort.addEventListener('change', render);
  render();

  /* ---------- Buy the set ---------- */
  const set = $('[data-co-set]', current);
  const items = $$('.co-set__item', set);
  const addBtn = $('[data-set-add]', set);
  const updateSet = () => {
    const picked = items.filter((it) => $('input', it).checked);
    const subtotal = picked.reduce((s, it) => s + Number(it.dataset.price), 0);
    const saving = picked.length >= SET_MIN ? Math.round(subtotal * SET_OFF) : 0;
    $('[data-set-subtotal]', set).textContent = money(subtotal);
    $('[data-set-save]', set).textContent = `−${money(saving)}`;
    $('[data-set-save-row]', set).hidden = !saving;
    $('[data-set-total]', set).textContent = money(subtotal - saving);
    const need = SET_MIN - picked.length;
    $('[data-set-hint]', set).textContent = saving
      ? `You’re saving ${money(saving)}.`
      : picked.length ? `Add ${need} more piece${need === 1 ? '' : 's'} to save 10%.` : 'Choose the pieces you’d like.';
    addBtn.disabled = !picked.length;
    addBtn.textContent = picked.length === items.length ? 'Add the set to cart' : `Add ${picked.length} piece${picked.length === 1 ? '' : 's'} to cart`;
    items.forEach((it) => it.classList.toggle('is-off', !$('input', it).checked));
  };
  items.forEach((it) => $('input', it).addEventListener('change', updateSet));
  addBtn.addEventListener('click', () => {
    const picked = items.filter((it) => $('input', it).checked);
    // Replace with a call that adds these pieces to the cart with the set discount applied.
    window.Morrow?.addToCart(picked.length);
    window.Morrow?.toast(`Added ${picked.length} ${name} piece${picked.length === 1 ? '' : 's'} to your cart${picked.length >= SET_MIN ? ', with 10% off' : ''}`);
  });
  updateSet();
})();
