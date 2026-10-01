/* Morrow — compare up to four pieces side by side.
   Pieces come from the URL (compare.html?items=alder-3-seat-sofa,ren-lounge-chair) or, without one,
   from the compare list kept by main.js (Morrow.compare). Specs live in search-index.js. */
(() => {
  const S = window.MorrowSearch;
  const M = window.Morrow;
  const root = document.querySelector('[data-cmp-root]');
  if (!S || !M || !root) return;
  const $ = (sel, r = document) => r.querySelector(sel);
  const { esc, money, img } = S;
  const MAX = 4;
  const tools = $('[data-cmp-tools]');
  const lede = $('[data-cmp-lede]');
  const diffBtn = $('[data-cmp-diff]');
  let onlyDiff = false;

  /* ---------- Which pieces ---------- */
  const fromUrl = (new URLSearchParams(location.search).get('items') || '').split(',').map(S.byId).filter(Boolean);
  let items = (fromUrl.length ? fromUrl : M.compare.list().map((n) => S.products.find((p) => p.name === n)).filter(Boolean)).slice(0, MAX);
  const save = () => {
    M.compare.save(items.map((p) => p.name));
    const q = items.length ? `?items=${items.map((p) => p.id).join(',')}` : '';
    history.replaceState(null, '', `${location.pathname}${q}`);
  };

  /* ---------- Rows: [label, value(p) -> html or '', compare key(p) for "same"/"best"] ---------- */
  const cm = (n) => (n == null ? '' : `${n} cm`);
  const stars = (r) => `<span class="stars" aria-hidden="true">★</span> ${r}`;
  const GROUPS = [
    ['Overview', [
      ['Price', (p) => `<span class="cmp-price">${p.was ? `<span class="price__now">${money(p.price)}</span> <s>${money(p.was)}</s>` : money(p.price)}</span>`, (p) => p.price, 'low'],
      ['Rating', (p) => `${stars(p.rating)} <span class="cmp-muted">(${p.reviews})</span>`, (p) => p.rating, 'high'],
      ['Category', (p) => esc(S.CATS[p.cat]), (p) => p.cat],
      ['Colors', (p) => `<span class="cmp-dots">${p.swatches.map(([n, c]) => `<span class="cmp-dot" style="--c:${c}" title="${esc(n)}"></span>`).join('')}</span><span class="cmp-muted">${p.swatches.map((s) => esc(s[0])).join(', ')}</span>`, (p) => p.swatches.map((s) => s[0]).join()],
      ['Availability', (p) => (p.stock === 'in' ? '<span class="dot dot--in"></span>In stock, 1–2 weeks' : '<span class="dot dot--order"></span>Made to order, 6–8 weeks'), (p) => p.stock],
    ]],
    ['Size', [
      ['Footprint', null, null, 'footprint'],
      ['Width', (p) => cm(p.w), (p) => p.w],
      ['Depth', (p) => cm(p.d), (p) => p.d],
      ['Height', (p) => cm(p.h), (p) => p.h],
      ['Seat height', (p) => cm(p.seatH), (p) => p.seatH],
      ['Seat depth', (p) => cm(p.seatD), (p) => p.seatD],
      ['Seats', (p) => (p.seats ? String(p.seats) : ''), (p) => p.seats],
      ['Smallest doorway', (p) => cm(p.door), (p) => p.door],
      ['Weight', (p) => (p.kg ? `${p.kg} kg` : ''), (p) => p.kg],
    ]],
    ['Materials and care', [
      ['Material', (p) => esc(S.MATERIALS[p.material]), (p) => p.material],
      ['Made from', (p) => esc(p.frame || ''), (p) => p.frame],
      ['Cover', (p) => esc(p.cover || ''), (p) => p.cover],
      ['Details', (p) => esc(p.extra || ''), (p) => p.extra],
      ['Care', (p) => esc(p.care || ''), (p) => p.care],
      ['Made in', (p) => esc(p.made || ''), (p) => p.made],
    ]],
    ['Delivery and warranty', [
      ['Delivery', () => 'Free over $500, into the room you choose', () => 1],
      ['Assembly', (p) => esc(p.assembly || ''), (p) => p.assembly],
      ['Warranty', (p) => esc(p.warranty || ''), (p) => p.warranty],
      ['Returns', () => '30 days, free collection', () => 1],
    ]],
  ];

  // footprints drawn to one scale, so sizes can be compared at a glance
  const footprint = (p, scale) => {
    if (!p.w || !p.d) return '';
    const w = p.w * scale; const d = p.d * scale;
    return `<svg class="cmp-foot" viewBox="0 0 120 ${Math.max(d, 8) + 4}" width="120" height="${Math.max(d, 8) + 4}" role="img" aria-label="${p.w} by ${p.d} cm"><rect x="${(120 - w) / 2}" y="2" width="${w}" height="${d}" rx="2"/></svg>`;
  };

  /* ---------- Picker for empty columns ---------- */
  const picker = (i) => {
    const groups = Object.entries(S.CATS).map(([k, label]) => {
      const opts = S.products.filter((p) => p.cat === k && !items.includes(p));
      return opts.length ? `<optgroup label="${esc(label)}">${opts.map((p) => `<option value="${p.id}">${esc(p.name)}, ${money(p.price)}</option>`).join('')}</optgroup>` : '';
    }).join('');
    return `<div class="cmp-add">
      <span class="cmp-add__art" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span>
      <label class="cmp-add__label" for="cmp-add-${i}">Add a piece</label>
      <select id="cmp-add-${i}" data-cmp-add><option value="">Choose…</option>${groups}</select>
    </div>`;
  };

  /* ---------- Render ---------- */
  const render = () => {
    tools.hidden = !items.length;
    if (!items.length) {
      lede.textContent = 'Up to four pieces side by side: size, materials, care, delivery and warranty.';
      const pairs = [['alder-3-seat-sofa', 'hale-2-seat-sofa'], ['ren-lounge-chair', 'otto-armchair', 'hale-lounge-chair'], ['haven-bed', 'linden-bed'], ['fold-dining-chair', 'oslo-dining-chair']];
      root.innerHTML = `<div class="cmp-empty">
          <h2 class="cmp-empty__title">Nothing to compare yet</h2>
          <p>Tick <strong>Compare</strong> on any product in the shop or in search results, or start with one of these.</p>
          <ul class="cmp-pairs">${pairs.map((ids) => `<li><a class="cmp-pair" href="compare.html?items=${ids.join(',')}">${ids.map((id) => S.byId(id)).map((p) => `<span class="cmp-pair__art">${img(p.photo, '64px', [120, 240])}</span>`).join('')}<span class="cmp-pair__text">${ids.map((id) => esc(S.byId(id).name)).join(' vs ')}</span></a></li>`).join('')}</ul>
          <a class="btn btn--primary" href="shop.html">Browse furniture</a>
        </div>`;
      return;
    }
    lede.textContent = items.length === 1 ? 'Add at least one more piece to compare.' : `Comparing ${items.length} pieces. Add up to ${MAX}.`;
    const cols = [...items, ...(items.length < MAX ? [null] : [])];
    const scale = 110 / Math.max(...items.map((p) => Math.max(p.w || 0, p.d || 0)), 1);

    const head = `<thead><tr>
        <td class="cmp-corner"><span class="visually-hidden">Product</span></td>
        ${cols.map((p, i) => (p ? `<th scope="col" class="cmp-col">
          <div class="cmp-prod">
            <button type="button" class="cmp-prod__remove" data-cmp-remove="${p.id}" aria-label="Remove ${esc(p.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
            <a class="cmp-prod__art" href="product.html" tabindex="-1" aria-hidden="true">${img(p.photo, '(max-width: 700px) 45vw, 240px', [400, 800])}</a>
            <a class="cmp-prod__name" href="product.html">${esc(p.name)}</a>
            <span class="cmp-prod__meta">${esc(p.meta)}</span>
            <button type="button" class="btn btn--small cmp-prod__add" data-card-add>Add to cart</button>
          </div>
        </th>` : `<td class="cmp-col cmp-col--add">${picker(i)}</td>`)).join('')}
      </tr></thead>`;

    const bodies = GROUPS.map(([title, rows]) => {
      const trs = rows.map(([label, val, key, kind]) => {
        if (kind === 'footprint') {
          if (!items.some((p) => p.w && p.d)) return '';
          return `<tr class="cmp-row"><th scope="row">${label}<span class="cmp-muted cmp-row__note">to scale</span></th>${cols.map((p) => (p ? `<td>${footprint(p, scale)}</td>` : '<td></td>')).join('')}</tr>`;
        }
        const vals = items.map(val);
        if (vals.every((v) => !v)) return '';
        const keys = items.map(key).map(String);
        const same = items.length > 1 && keys.every((k) => k === keys[0]);
        let best = -1;
        if (kind && items.length > 1 && !same) {
          const nums = items.map(key);
          const target = kind === 'low' ? Math.min(...nums) : Math.max(...nums);
          if (nums.filter((n) => n === target).length === 1) best = nums.indexOf(target);
        }
        const tag = kind === 'low' ? 'Lowest price' : 'Top rated';
        return `<tr class="cmp-row${same ? ' is-same' : ''}"><th scope="row">${label}</th>${cols.map((p, i) => (p
          ? `<td>${vals[i] || '<span class="cmp-muted">—</span>'}${i === best ? ` <span class="cmp-best">${tag}</span>` : ''}</td>`
          : '<td></td>')).join('')}</tr>`;
      }).join('');
      return trs ? `<tbody><tr class="cmp-group"><th scope="rowgroup" colspan="${cols.length + 1}">${title}</th></tr>${trs}</tbody>` : '';
    }).join('');

    root.innerHTML = `<div class="cmp-scroll" tabindex="0" role="region" aria-label="Comparison table, scrolls sideways">
        <table class="cmp-table${onlyDiff ? ' is-diff' : ''}" style="--cols:${cols.length}">
          <caption class="visually-hidden">Comparing ${items.map((p) => esc(p.name)).join(', ')}</caption>
          ${head}${bodies}
        </table>
      </div>`;
    // the cart button needs the product name on a .card ancestor
    root.querySelectorAll('.cmp-prod').forEach((el, i) => { el.classList.add('card'); el.dataset.name = items[i].name; });
  };

  /* ---------- Events ---------- */
  S.bindCards(root);
  root.addEventListener('click', (e) => {
    const rm = e.target.closest('[data-cmp-remove]');
    if (!rm) return;
    const p = S.byId(rm.dataset.cmpRemove);
    items = items.filter((x) => x !== p);
    save();
    render();
    M.toast(`Removed ${p.name}`);
    (root.querySelector('[data-cmp-remove]') || root.querySelector('[data-cmp-add]') || root.querySelector('a, button'))?.focus();
  });
  root.addEventListener('change', (e) => {
    const sel = e.target.closest('[data-cmp-add]');
    if (!sel || !sel.value) return;
    items = [...items, S.byId(sel.value)].slice(0, MAX);
    save();
    render();
    root.querySelector('[data-cmp-add]')?.focus();
  });
  diffBtn.addEventListener('click', () => {
    onlyDiff = !onlyDiff;
    diffBtn.setAttribute('aria-checked', String(onlyDiff));
    root.querySelector('.cmp-table')?.classList.toggle('is-diff', onlyDiff);
  });
  $('[data-cmp-share]').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(location.href); M.toast('Link copied. Anyone with it sees this comparison.'); } catch (err) { M.toast('Copy the address from your browser bar to share this comparison.'); }
  });
  $('[data-cmp-clear]').addEventListener('click', () => { items = []; save(); render(); M.toast('Cleared your comparison'); });

  if (fromUrl.length) save();
  render();
})();
