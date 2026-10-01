/* Morrow — sale page: countdown, sale pieces (any product with a `was` price in search-index.js)
   with category chips and sort, and workshop seconds (listed below; one of each). */
(() => {
  const S = window.MorrowSearch;
  if (!S) return;
  const $ = (sel, root = document) => root.querySelector(sel);
  const { esc, money, img, card, saving } = S;

  /* ---------- Countdown ---------- */
  const clock = $('[data-sl-clock]');
  if (clock) {
    const end = new Date(clock.dataset.ends).getTime();
    const unit = (u) => $(`[data-unit="${u}"]`, clock);
    const said = $('[data-sl-clock-text]', clock);
    let lastMinute = -1;
    const tick = () => {
      const left = Math.max(0, end - Date.now());
      if (!left) {
        clock.classList.add('is-over');
        $('.sl-clock__label', clock).textContent = 'This sale has ended. Sign up below to hear about the next one.';
        $('.sl-clock__units', clock).hidden = true;
        return false;
      }
      const d = Math.floor(left / 864e5); const h = Math.floor(left / 36e5) % 24;
      const m = Math.floor(left / 6e4) % 60; const s = Math.floor(left / 1e3) % 60;
      unit('d').textContent = d; unit('h').textContent = String(h).padStart(2, '0');
      unit('m').textContent = String(m).padStart(2, '0'); unit('s').textContent = String(s).padStart(2, '0');
      if (m !== lastMinute) { lastMinute = m; said.textContent = `${d} days, ${h} hours and ${m} minutes left.`; }
      return true;
    };
    if (tick()) { const t = setInterval(() => { if (!tick()) clearInterval(t); }, 1000); }
  }

  /* ---------- Sale pieces ---------- */
  const grid = $('[data-sl-grid]');
  const cats = $('[data-sl-cats]');
  const sortEl = $('[data-sl-sort]');
  const countEl = $('[data-sl-count]');
  const deals = S.products.filter((p) => p.was);
  let cat = 'all';
  const sorters = {
    saving: (a, b) => saving(b) - saving(a) || a.price - b.price,
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
  };
  const usedCats = [...new Set(deals.map((p) => p.cat))];
  cats.innerHTML = [['all', 'All', deals.length], ...usedCats.map((c) => [c, S.CATS[c], deals.filter((p) => p.cat === c).length])]
    .map(([v, l, n]) => `<button type="button" class="chip-tab" aria-pressed="${v === cat}" data-cat="${v}">${esc(l)} <span>${n}</span></button>`).join('');
  const renderDeals = () => {
    const list = deals.filter((p) => cat === 'all' || p.cat === cat).sort(sorters[sortEl.value]);
    grid.innerHTML = list.map((p) => card(p)).join('');
    const best = Math.max(...deals.map(saving));
    countEl.textContent = `${list.length} piece${list.length === 1 ? '' : 's'}${cat === 'all' ? `, up to ${best}% off` : ''}`;
  };
  cats.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    cat = b.dataset.cat;
    cats.querySelectorAll('[data-cat]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    renderDeals();
  });
  sortEl.addEventListener('change', renderDeals);
  S.bindCards(grid);
  renderDeals();

  /* ---------- Workshop seconds (placeholders: list your own refurbished pieces) ---------- */
  const SECONDS = [
    { name: 'Alder 3-seat sofa', variant: 'Oat bouclé, oak legs', grade: 'A', note: 'Returned unused after the customer moved house.', price: 1420, was: 1890, photo: 20337842 },
    { name: 'Ren lounge chair', variant: 'Cognac leather, walnut', grade: 'B', note: 'A light 3 cm scratch on the outside of the left arm.', price: 560, was: 760, photo: 20794782 },
    { name: 'Fold dining table', variant: 'Natural oak, seats 6', grade: 'A', note: 'A week on a showroom floor, re-oiled since.', price: 970, was: 1290, photo: 39854857 },
    { name: 'Lumen floor lamp', variant: 'Moss linen, blackened steel', grade: 'A', note: 'Opened, never used. New bulb included.', price: 240, was: 320, photo: 34992772 },
    { name: 'Arc wall mirror', variant: 'Natural oak, 60 × 100 cm', grade: 'B', note: 'A small dent on the back of the frame. Not visible when hung.', price: 330, was: 460, photo: 5644681 },
    { name: 'Otto armchair', variant: 'Rust linen, oak legs', grade: 'B', note: 'A small pull in the fabric on the back.', price: 420, was: 590, photo: 20337873, sold: true },
  ];
  const sgrid = $('[data-sl-seconds]');
  sgrid.innerHTML = SECONDS.map((x) => `<li class="card sl-scard${x.sold ? ' is-sold' : ''}" data-name="${esc(`${x.name} (seconds)`)}">
      <div class="card__media sl-scard__media">
        <span class="badge sl-scard__grade${x.grade === 'B' ? ' sl-scard__grade--b' : ''}">Grade ${x.grade}</span>
        ${img(x.photo, '(max-width: 560px) 100vw, (max-width: 1100px) 50vw, 33vw', [400, 800], `${x.name}, ${x.variant}`)}
        ${x.sold ? '<span class="sl-scard__sold">Sold</span>' : ''}
      </div>
      <div class="card__body">
        <h3 class="card__name">${esc(x.name)}</h3>
        <p class="card__meta">${esc(x.variant)}</p>
        <p class="sl-scard__note">${esc(x.note)}</p>
        <div class="card__foot">
          <p class="price"><span class="price__now">${money(x.price)}</span> <s>${money(x.was)}</s></p>
          ${x.sold ? '<button type="button" class="btn btn--small" disabled>Sold</button>' : '<button type="button" class="btn btn--small" data-card-add>Add to cart</button>'}
        </div>
        <p class="card__stock">${x.sold ? 'Sold out. New seconds arrive most weeks.' : `<span class="dot dot--in"></span>1 left, saves ${Math.round((1 - x.price / x.was) * 100)}%`}</p>
      </div>
    </li>`).join('');
  S.bindCards(sgrid);
})();
