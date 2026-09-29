/* Morrow — product listing page: filters, sort, grid size, load more */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const form = $('[data-filters]');
  const grid = $('[data-grid]');
  if (!form || !grid) return;

  const PAGE = 12;
  const PROMO_AFTER = 5; // promo tile sits after this many products
  const cards = $$('.card', grid);
  const promo = $('[data-promo]');
  const minInput = $('#price-min');
  const maxInput = $('#price-max');
  const priceMax = Number(maxInput.max);
  const sortSelect = $('[data-sort]');
  const chipsEl = $('[data-active-filters]');
  let shown = PAGE;

  const fmt = (n) => '$' + Number(n).toLocaleString('en-US');
  const labelFor = (input) => $('.check__label', input.closest('label'))?.textContent
    || input.closest('label').textContent.trim();

  /* ---------- Read state from the form ---------- */
  const state = () => {
    const checked = (name) => $$(`input[name="${name}"]:checked`, form).map((i) => i.value);
    return {
      category: checked('category'),
      material: checked('material'),
      colour: checked('colour'),
      stock: checked('stock'),
      sale: $('input[name="sale"]', form).checked,
      min: Number(minInput.value),
      max: Number(maxInput.value),
    };
  };

  const matches = (card, s) => {
    const d = card.dataset;
    const price = Number(d.price);
    if (s.category.length && !s.category.includes(d.category)) return false;
    if (s.material.length && !s.material.includes(d.material)) return false;
    if (s.colour.length && !d.colour.split(' ').some((c) => s.colour.includes(c))) return false;
    if (s.stock.length && !s.stock.includes(d.stock)) return false;
    if (s.sale && !('sale' in d)) return false;
    if (price < s.min) return false;
    if (s.max < priceMax && price > s.max) return false;
    return true;
  };

  const sorters = {
    recommended: (a, b) => a.dataset.popularity - b.dataset.popularity,
    newest: (a, b) => b.dataset.added.localeCompare(a.dataset.added),
    'price-asc': (a, b) => a.dataset.price - b.dataset.price,
    'price-desc': (a, b) => b.dataset.price - a.dataset.price,
    rating: (a, b) => b.dataset.rating - a.dataset.rating,
  };

  /* ---------- Render ---------- */
  const render = () => {
    const s = state();
    const hits = cards.filter((c) => matches(c, s)).sort(sorters[sortSelect.value]);
    const misses = cards.filter((c) => !hits.includes(c));

    // re-order DOM: hits first (sorted), then the rest hidden
    hits.forEach((c, i) => {
      grid.appendChild(c);
      c.hidden = i >= shown;
      if (i === PROMO_AFTER - 1) grid.appendChild(promo);
    });
    misses.forEach((c) => { grid.appendChild(c); c.hidden = true; });
    promo.hidden = hits.length < PROMO_AFTER || shown < PROMO_AFTER;

    // counts
    const total = hits.length;
    $$('[data-result-count]').forEach((el) => { el.textContent = total; });
    const visible = Math.min(shown, total);
    $('[data-shown]').textContent = visible;
    $('[data-progress]').style.width = total ? (visible / total) * 100 + '%' : '0';
    $('[data-load-more]').hidden = total === 0;
    $('[data-load-more-btn]').hidden = visible >= total;
    $('[data-empty]').hidden = total > 0;

    renderChips(s);
    syncSubcats(s);
  };

  /* ---------- Price slider ---------- */
  const syncPrice = () => {
    let a = Number(minInput.value);
    let b = Number(maxInput.value);
    if (a > b - 100) {
      if (document.activeElement === minInput) minInput.value = a = b - 100;
      else maxInput.value = b = a + 100;
    }
    const wrap = minInput.closest('.price-range');
    wrap.style.setProperty('--a', (a / priceMax) * 100 + '%');
    wrap.style.setProperty('--b', (b / priceMax) * 100 + '%');
    $('[data-min-out]').textContent = fmt(a);
    $('[data-max-out]').textContent = b >= priceMax ? fmt(priceMax) + '+' : fmt(b);
  };

  /* ---------- Active filter chips ---------- */
  const renderChips = (s) => {
    const chips = [];
    $$('input[type="checkbox"]:checked', form).forEach((input) => {
      chips.push({ label: labelFor(input), clear: () => { input.checked = false; } });
    });
    if (s.min > 0 || s.max < priceMax) {
      chips.push({
        label: `${fmt(s.min)} to ${s.max >= priceMax ? fmt(priceMax) + '+' : fmt(s.max)}`,
        clear: () => { minInput.value = 0; maxInput.value = priceMax; syncPrice(); },
      });
    }
    chipsEl.innerHTML = '';
    chips.forEach((chip) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.setAttribute('aria-label', `Remove filter: ${chip.label}`);
      btn.innerHTML = `<span></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>`;
      btn.firstChild.textContent = chip.label;
      btn.addEventListener('click', () => { chip.clear(); shown = PAGE; render(); });
      li.appendChild(btn);
      chipsEl.appendChild(li);
    });
    if (chips.length) {
      const li = document.createElement('li');
      li.innerHTML = '<button type="button" class="chip chip--clear">Clear all</button>';
      li.firstChild.addEventListener('click', clearAll);
      chipsEl.appendChild(li);
    }
    chipsEl.hidden = chips.length === 0;
    const badge = $('[data-filter-count]');
    badge.textContent = chips.length;
    badge.hidden = chips.length === 0;
  };

  const clearAll = () => {
    form.reset();
    minInput.value = 0;
    maxInput.value = priceMax;
    syncPrice();
    shown = PAGE;
    render();
  };
  $$('[data-clear-all]').forEach((b) => b.addEventListener('click', clearAll));

  /* ---------- Subcategory tiles toggle the category filter ---------- */
  const syncSubcats = (s) => {
    $$('[data-subcat]').forEach((b) => b.setAttribute('aria-pressed', String(s.category.includes(b.dataset.subcat))));
  };
  $$('[data-subcat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const box = $(`input[name="category"][value="${btn.dataset.subcat}"]`, form);
      box.checked = !box.checked;
      shown = PAGE;
      render();
    });
  });

  /* ---------- Events ---------- */
  form.addEventListener('input', (e) => {
    if (e.target.type === 'range') syncPrice();
    shown = PAGE;
    render();
  });
  sortSelect.addEventListener('change', render);

  $('[data-load-more-btn]').addEventListener('click', () => {
    const firstNew = cards.filter((c) => !c.hidden).length;
    shown += PAGE;
    render();
    // move focus to the first newly revealed product for keyboard users
    const visibleCards = $$('.card:not([hidden])', grid);
    visibleCards[firstNew]?.querySelector('.card__name a')?.focus();
  });

  $$('[data-density]').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('[data-density]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      grid.classList.toggle('plp-grid--large', btn.dataset.density === '2');
    });
  });

  /* ---------- Mobile filter drawer ---------- */
  const panel = $('#filters');
  const openBtn = $('[data-filters-open]');
  let scrim;
  const setPanel = (open) => {
    panel.classList.toggle('is-open', open);
    openBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      scrim = document.createElement('div');
      scrim.className = 'filters-scrim';
      scrim.addEventListener('click', () => setPanel(false));
      document.body.appendChild(scrim);
      $('.filters__close', panel).focus();
    } else {
      scrim?.remove();
      scrim = null;
    }
  };
  openBtn.addEventListener('click', () => setPanel(true));
  $$('[data-filters-close]').forEach((b) => b.addEventListener('click', () => {
    const wasOpen = panel.classList.contains('is-open');
    setPanel(false);
    if (wasOpen) openBtn.focus();
  }));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('is-open')) { setPanel(false); openBtn.focus(); }
  });

  /* ---------- Pre-select filters from the URL (links from the mega menu) ---------- */
  const params = new URLSearchParams(location.search);
  const catMap = { sofas: 'sofas', chairs: 'armchairs', armchairs: 'armchairs', tables: 'tables', storage: 'storage',
    lighting: 'lighting', rugs: 'rugs', mirrors: 'decor', vases: 'decor', decor: 'decor', textiles: 'rugs' };
  const cat = catMap[params.get('c')];
  if (cat) $(`input[name="category"][value="${cat}"]`, form).checked = true;
  if (params.get('sale')) $('input[name="sale"]', form).checked = true;
  if (params.get('new')) sortSelect.value = 'newest';

  syncPrice();
  render();
})();
