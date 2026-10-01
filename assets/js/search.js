/* Morrow — search results page (search.html?q=…).
   Tabs (all, products, ideas & guides, help), product filters and sort, spelling correction,
   and helpful empty and no-results states. The index and ranking live in search-index.js.
   Everything is kept in the URL (q, tab, cat, price, mat, col, avail, sort), so results can be
   shared and the back button works. */
(() => {
  const S = window.MorrowSearch;
  const form = document.querySelector('[data-sr-form]');
  if (!S || !form) return;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const { esc, highlight } = S;
  const input = $('#sr-q');
  const clearBtn = $('[data-sr-clear]');
  const titleEl = $('[data-sr-title]');
  const countEl = $('[data-sr-count]');
  const noteEl = $('[data-sr-note]');
  const jumpEl = $('[data-sr-jump]');
  const tabsEl = $('[data-sr-tabs]');
  const panel = $('[data-sr-panel]');
  const toast = (m) => window.Morrow?.toast(m);

  /* ---------- Recent searches (this browser only) ---------- */
  const RECENT_KEY = 'morrow-recent-searches';
  const recent = {
    get() { try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch (e) { return []; } },
    add(q) {
      const list = [q, ...this.get().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 6);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch (e) { /* storage unavailable */ }
    },
    clear() { try { localStorage.removeItem(RECENT_KEY); } catch (e) { /* storage unavailable */ } },
  };

  /* ---------- URL state ---------- */
  const PRICES = [['0-250', 'Under $250', 0, 250], ['250-750', '$250 to $750', 250, 750], ['750-1500', '$750 to $1,500', 750, 1500], ['1500-', 'Over $1,500', 1500, Infinity]];
  const AVAIL = { in: 'In stock', order: 'Made to order', sale: 'On sale' };
  const SORTS = [['best', 'Best match'], ['newest', 'Newest'], ['price-asc', 'Price, low to high'], ['price-desc', 'Price, high to low'], ['rating', 'Top rated']];
  const FACETS = ['cat', 'price', 'mat', 'col', 'avail'];
  const PAGE = 9;

  const read = () => {
    const p = new URLSearchParams(location.search);
    const st = { q: (p.get('q') || '').trim(), tab: p.get('tab') || 'all', sort: p.get('sort') || 'best', f: {} };
    FACETS.forEach((k) => { st.f[k] = (p.get(k) || '').split(',').filter(Boolean); });
    if (!['all', 'products', 'ideas', 'help'].includes(st.tab)) st.tab = 'all';
    return st;
  };
  let st = read();
  let shown = PAGE;

  const url = () => {
    const p = new URLSearchParams();
    if (st.q) p.set('q', st.q);
    if (st.tab !== 'all') p.set('tab', st.tab);
    if (st.tab === 'products') {
      FACETS.forEach((k) => { if (st.f[k].length) p.set(k, st.f[k].join(',')); });
      if (st.sort !== 'best') p.set('sort', st.sort);
    }
    const s = p.toString();
    return `${location.pathname}${s ? `?${s}` : ''}`;
  };
  const save = (push) => history[push ? 'pushState' : 'replaceState'](null, '', url());

  /* ---------- Markup helpers ---------- */
  const { img } = S;
  const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const x = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  const { card } = S;

  const article = (a, q) => `<li class="jcard">
      <a class="jcard__media" href="${a.href}" tabindex="-1" aria-hidden="true">${img(a.photo, '(max-width: 700px) 100vw, 33vw', [400, 800]).replace('class="ph"', 'class="ph post-art"')}</a>
      <p class="post__meta"><span>${esc(a.kind)}</span>${a.mins ? `<span>${a.mins} min read</span>` : ''}</p>
      <h3 class="jcard__title"><a href="${a.href}">${highlight(a.title, q)}</a></h3>
      <p class="jcard__excerpt">${highlight(a.text, q)}</p>
    </li>`;

  const helpItem = (h, q) => (h.kind === 'FAQ'
    ? `<li class="sr-help__item"><details class="sr-qa">
        <summary><span class="sr-qa__q">${highlight(h.title, q)}</span><span class="sr-qa__kind">FAQ</span></summary>
        <div class="sr-qa__a"><p>${highlight(h.text, q)}</p><a class="link" href="${h.href}">Open in the help center</a></div>
      </details></li>`
    : `<li class="sr-help__item"><a class="sr-help__page" href="${h.href}">
        <span><span class="sr-qa__q">${highlight(h.title, q)}</span><span class="sr-help__text">${highlight(h.text, q)}</span></span>
        <span class="sr-qa__kind">Page</span>${arrow}</a></li>`);

  const chipsOf = (list, cls = 'sr-pop') => list.map((t) => `<li><a class="${cls}" href="search.html?q=${encodeURIComponent(t)}" data-sr-q="${esc(t)}">${esc(t)}</a></li>`).join('');

  const sectionHead = (title, n, tab, label) => `<div class="sr-sec__head">
      <h2 class="sr-sec__title">${title}</h2>
      ${n ? `<button type="button" class="link sr-sec__more" data-go-tab="${tab}">${label}</button>` : ''}
    </div>`;

  /* ---------- Products: filters, sort and paging ---------- */
  const matchers = {
    cat: (p, v) => v.includes(p.cat),
    price: (p, v) => v.some((k) => { const b = PRICES.find((x) => x[0] === k); return b && p.price >= b[2] && p.price < b[3]; }),
    mat: (p, v) => v.includes(p.material),
    col: (p, v) => v.some((c) => p.colours.includes(c)),
    avail: (p, v) => v.some((a) => (a === 'sale' ? !!p.was : p.stock === a)),
  };
  const applyFilters = (list, skip) => list.filter((p) => FACETS.every((k) => k === skip || !st.f[k].length || matchers[k](p, st.f[k])));
  const sorters = {
    best: null,
    newest: (a, b) => b.added.localeCompare(a.added),
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
  };
  const facetOptions = () => ({
    cat: Object.entries(S.CATS).map(([k, l]) => [k, l]),
    price: PRICES.map(([k, l]) => [k, l]),
    mat: Object.entries(S.MATERIALS),
    col: Object.entries(S.COLOURS).map(([k, [l, c]]) => [k, l, c]),
    avail: Object.entries(AVAIL),
  });
  const FACET_TITLES = { cat: 'Category', price: 'Price', mat: 'Material', col: 'Color', avail: 'Availability' };
  const facetLabel = (k, v) => {
    const o = facetOptions()[k].find((x) => x[0] === v);
    return o ? o[1] : v;
  };

  const filtersHtml = (base) => {
    const opts = facetOptions();
    return FACETS.map((k) => {
      const pool = applyFilters(base, k);
      const rows = opts[k].map(([v, label, colour]) => {
        const n = pool.filter((p) => matchers[k](p, [v])).length;
        const on = st.f[k].includes(v);
        if (!n && !on) return '';
        if (k === 'col') {
          return `<li><label class="colour-opt"><input type="checkbox" name="${k}" value="${v}"${on ? ' checked' : ''}><span class="colour-opt__dot" style="--c:${colour}" aria-hidden="true"></span><span>${label} <span class="sr-fcount">(${n})</span></span></label></li>`;
        }
        return `<li><label class="check"><input type="checkbox" name="${k}" value="${v}"${on ? ' checked' : ''}><span class="check__box" aria-hidden="true"></span><span class="check__label">${label}</span><span class="check__count">${n}</span></label></li>`;
      }).join('');
      if (!rows) return '';
      return `<details class="fgroup" open><summary>${FACET_TITLES[k]}</summary><ul class="${k === 'col' ? 'colour-list' : 'fgroup__list'}">${rows}</ul></details>`;
    }).join('');
  };

  /* ---------- Rendering ---------- */
  let res = null; // current search results
  const setTabs = (counts) => {
    tabsEl.hidden = !counts;
    if (!counts) return;
    $$('.sr-tab', tabsEl).forEach((t) => {
      const on = t.dataset.tab === st.tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      t.hidden = t.dataset.tab !== 'all' && !counts[t.dataset.tab];
      $('span', t).textContent = counts[t.dataset.tab];
    });
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `sr-tab-${st.tab}`);
  };

  const renderStart = () => {
    const rec = recent.get();
    const cats = S.shortcuts.filter((s) => s.kind === 'Category' || s.kind === 'Room');
    const trending = [...S.products].sort((a, b) => a.pop - b.pop).slice(0, 4);
    panel.removeAttribute('role');
    panel.removeAttribute('aria-labelledby');
    panel.innerHTML = `
      <div class="sr-start">
        ${rec.length ? `<section class="sr-sec sr-sec--tight" aria-labelledby="sr-recent-title">
          <div class="sr-sec__head"><h2 class="sr-sec__title" id="sr-recent-title">Your recent searches</h2><button type="button" class="link sr-sec__more" data-sr-clear-recent>Clear</button></div>
          <ul class="sr-pops">${chipsOf(rec, 'sr-pop sr-pop--recent')}</ul>
        </section>` : ''}
        <section class="sr-sec sr-sec--tight" aria-labelledby="sr-popular-title">
          <div class="sr-sec__head"><h2 class="sr-sec__title" id="sr-popular-title">Popular searches</h2></div>
          <ul class="sr-pops">${chipsOf(S.popular)}</ul>
        </section>
        <section class="sr-sec" aria-labelledby="sr-browse-title">
          <div class="sr-sec__head"><h2 class="sr-sec__title" id="sr-browse-title">Browse by category and room</h2></div>
          <ul class="sr-tiles">${cats.map((c) => `<li><a class="sr-tile" href="${c.href}"><span class="sr-tile__art">${img(c.photo, '160px', [200, 400])}</span><span class="sr-tile__name">${esc(c.name)}</span></a></li>`).join('')}</ul>
        </section>
        <section class="sr-sec" aria-labelledby="sr-trend-title">
          ${sectionHead('<span id="sr-trend-title">Popular right now</span>', 0)}
          <ul class="plp-grid sr-grid">${trending.map((p) => card(p, '')).join('')}</ul>
        </section>
      </div>`;
  };

  const renderNone = () => {
    const trending = [...S.products].sort((a, b) => a.pop - b.pop).slice(0, 4);
    panel.removeAttribute('role');
    panel.removeAttribute('aria-labelledby');
    panel.innerHTML = `
      <div class="sr-none">
        <div class="sr-none__tips">
          <h2 class="sr-sec__title">Try another way</h2>
          <ul class="sr-none__list">
            <li>Check the spelling, or use fewer words.</li>
            <li>Search for the kind of piece (“side table”) rather than a size or code.</li>
            <li>Try a material or a room: oak, bouclé, bedroom.</li>
          </ul>
          <h3 class="sr-none__sub">Popular searches</h3>
          <ul class="sr-pops">${chipsOf(S.popular)}</ul>
        </div>
        <aside class="sr-help-card">
          <p class="sr-help-card__eyebrow">Can’t find it?</p>
          <h2 class="sr-help-card__title">A stylist can help, free</h2>
          <p>Tell us what you’re looking for. We’ll suggest pieces, fabrics and sizes on a 30-minute video call.</p>
          <div class="sr-help-card__actions">
            <a class="btn btn--light" href="services.html">Book a free call</a>
            <a class="sr-help-card__link" href="contact.html">Or message us</a>
          </div>
        </aside>
      </div>
      <section class="sr-sec" aria-labelledby="sr-trend-title">
        ${sectionHead('<span id="sr-trend-title">Popular right now</span>', 0)}
        <ul class="plp-grid sr-grid">${trending.map((p) => card(p, '')).join('')}</ul>
      </section>`;
  };

  const renderAll = (q) => {
    const P = res.products; const A = res.articles; const H = res.help;
    const blocks = [];
    if (P.length) {
      blocks.push(`<section class="sr-sec" aria-labelledby="sr-p-title">
        ${sectionHead(`<span id="sr-p-title">Products</span> <span class="sr-sec__n">${P.length}</span>`, P.length > 4, 'products', `See all ${P.length} products`)}
        <ul class="plp-grid sr-grid">${P.slice(0, 4).map((p) => card(p, q)).join('')}</ul>
      </section>`);
    }
    if (H.length) {
      blocks.push(`<section class="sr-sec" aria-labelledby="sr-h-title">
        ${sectionHead(`<span id="sr-h-title">Help</span> <span class="sr-sec__n">${H.length}</span>`, H.length > 3, 'help', `See all ${H.length} answers`)}
        <ul class="sr-help">${H.slice(0, 3).map((h) => helpItem(h, q)).join('')}</ul>
      </section>`);
    }
    if (A.length) {
      blocks.push(`<section class="sr-sec" aria-labelledby="sr-a-title">
        ${sectionHead(`<span id="sr-a-title">Ideas &amp; guides</span> <span class="sr-sec__n">${A.length}</span>`, A.length > 3, 'ideas', `See all ${A.length}`)}
        <ul class="jgrid sr-jgrid sr-jgrid--preview">${A.slice(0, 3).map((a) => article(a, q)).join('')}</ul>
      </section>`);
    }
    // put help first when the query reads like a question about service rather than a product
    if (H.length && P.length && H.length >= 2 && P.length <= 2) blocks.unshift(blocks.splice(1, 1)[0]);
    if (!P.length) {
      const trending = [...S.products].sort((a, b) => a.pop - b.pop).slice(0, 4);
      blocks.push(`<section class="sr-sec" aria-labelledby="sr-trend-title">
        ${sectionHead('<span id="sr-trend-title">Popular right now</span>', 0)}
        <ul class="plp-grid sr-grid">${trending.map((p) => card(p, '')).join('')}</ul>
      </section>`);
    }
    panel.innerHTML = blocks.join('');
  };

  const renderProducts = (q) => {
    const base = res.products;
    let list = applyFilters(base);
    if (sorters[st.sort]) list = [...list].sort(sorters[st.sort]);
    const active = FACETS.flatMap((k) => st.f[k].map((v) => [k, v]));
    const nActive = active.length;
    panel.innerHTML = `
      <div class="plp sr-plp">
        <aside class="filters" id="filters" aria-label="Filters">
          <div class="filters__head">
            <h2>Filters</h2>
            <button type="button" class="icon-btn filters__close" data-filters-close aria-label="Close filters">${x}</button>
          </div>
          <form class="filters__form" data-sr-filters>${filtersHtml(base)}</form>
          <div class="filters__foot">
            <button class="btn btn--ghost" type="button" data-sr-clear-filters>Clear all</button>
            <button class="btn btn--primary" type="button" data-filters-close>Show ${list.length} result${list.length === 1 ? '' : 's'}</button>
          </div>
        </aside>
        <section class="plp-main" aria-labelledby="sr-plist-title">
          <h2 id="sr-plist-title" class="visually-hidden">Products</h2>
          <div class="toolbar">
            <button type="button" class="btn btn--ghost toolbar__filters" data-filters-open aria-controls="filters" aria-expanded="false">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>
              Filters <span class="toolbar__badge"${nActive ? '' : ' hidden'}>${nActive}</span>
            </button>
            <p class="toolbar__count" aria-live="polite">${list.length} of ${base.length} product${base.length === 1 ? '' : 's'}</p>
            <label class="sort"><span>Sort by</span>
              <select data-sr-sort>${SORTS.map(([v, l]) => `<option value="${v}"${v === st.sort ? ' selected' : ''}>${l}</option>`).join('')}</select>
            </label>
          </div>
          ${nActive ? `<ul class="active-filters" aria-label="Active filters">${active.map(([k, v]) => `<li><button type="button" class="chip" data-sr-unfilter="${k}:${v}" aria-label="Remove filter: ${esc(facetLabel(k, v))}">${esc(facetLabel(k, v))}${x}</button></li>`).join('')}<li><button type="button" class="chip chip--clear" data-sr-clear-filters>Clear all</button></li></ul>` : ''}
          ${list.length ? `<ul class="plp-grid">${list.slice(0, shown).map((p) => card(p, q)).join('')}</ul>
            ${list.length > shown ? `<div class="sr-more"><p>Showing ${Math.min(shown, list.length)} of ${list.length}</p><button type="button" class="btn btn--ghost" data-sr-more>Show more</button></div>` : ''}`
          : `<div class="sr-filtered-none"><p>No products match these filters.</p><button type="button" class="btn btn--ghost" data-sr-clear-filters>Clear filters</button></div>`}
        </section>
      </div>`;
  };

  const renderIdeas = (q) => {
    panel.innerHTML = `<h2 class="visually-hidden">Ideas and guides</h2><ul class="jgrid sr-jgrid">${res.articles.map((a) => article(a, q)).join('')}</ul>`;
  };
  const renderHelp = (q) => {
    const faqs = res.help.filter((h) => h.kind === 'FAQ');
    const pages = res.help.filter((h) => h.kind !== 'FAQ');
    panel.innerHTML = `<div class="sr-helpcols">
        ${faqs.length ? `<section aria-labelledby="sr-faq-title"><h2 class="sr-sec__title" id="sr-faq-title">Answers</h2><ul class="sr-help">${faqs.map((h) => helpItem(h, q)).join('')}</ul></section>` : ''}
        ${pages.length ? `<section aria-labelledby="sr-pages-title"><h2 class="sr-sec__title" id="sr-pages-title">Pages</h2><ul class="sr-help">${pages.map((h) => helpItem(h, q)).join('')}</ul></section>` : ''}
      </div>
      <p class="sr-help-more">Still stuck? Call or text <a class="link" href="tel:+18005550142">1-800-555-0142</a>, Monday to Saturday, 9am–6pm ET, or <a class="link" href="contact.html">send us a message</a>.</p>`;
  };

  const render = ({ focusPanel = false } = {}) => {
    const q = st.q;
    input.value = q;
    clearBtn.hidden = !q;
    noteEl.hidden = true;
    jumpEl.hidden = true;
    document.title = q ? `“${q}” — Search — Morrow` : 'Search — Morrow';

    if (!q) {
      titleEl.textContent = 'What are you looking for?';
      countEl.textContent = '';
      setTabs(null);
      renderStart();
      return;
    }

    res = S.search(q);
    const shownQ = res.corrected || q;
    const counts = { products: res.products.length, ideas: res.articles.length, help: res.help.length };
    counts.all = counts.products + counts.ideas + counts.help;

    if (!counts.all && !res.shortcuts.length) {
      titleEl.innerHTML = `No results for <q>${esc(q)}</q>`;
      countEl.textContent = '';
      setTabs(null);
      renderNone();
      return;
    }

    titleEl.innerHTML = `Results for <q>${esc(shownQ)}</q>`;
    countEl.textContent = `${counts.all} result${counts.all === 1 ? '' : 's'}${res.price ? `, ${res.price.text.replace(/\s+/g, ' ')}` : ''}`;
    if (res.corrected) {
      noteEl.innerHTML = `We couldn’t find <q>${esc(q)}</q>, so we searched for <q>${esc(res.corrected)}</q>.${res.partial ? ' Nothing matched every word, so these match some of them.' : ''}`;
      noteEl.hidden = false;
    } else if (res.partial) {
      noteEl.textContent = 'Nothing matched every word, so these match some of them.';
      noteEl.hidden = false;
    }

    if (res.shortcuts.length) {
      jumpEl.innerHTML = `<span class="sr-jump__label">Jump to</span><ul>${res.shortcuts.slice(0, 5).map((s) => `<li><a class="sr-jump__item" href="${s.href}">${s.photo ? `<span class="sr-jump__art">${img(s.photo, '32px', [100, 200])}</span>` : ''}<span>${highlight(s.name, shownQ)}</span><span class="sr-jump__kind">${esc(s.kind)}</span></a></li>`).join('')}</ul>`;
      jumpEl.hidden = false;
    }

    // an empty tab isn't useful: fall back to All
    if (st.tab !== 'all' && !counts[st.tab]) st.tab = 'all';
    setTabs(counts);
    ({ all: renderAll, products: renderProducts, ideas: renderIdeas, help: renderHelp })[st.tab](shownQ);
    if (focusPanel) panel.focus({ preventScroll: true });
  };

  /* ---------- Events ---------- */
  const run = (q) => {
    st = { q: q.trim(), tab: 'all', sort: 'best', f: Object.fromEntries(FACETS.map((k) => [k, []])) };
    shown = PAGE;
    if (st.q) recent.add(st.q);
    save(true);
    render();
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    run(input.value);
    if (st.q) input.blur();
  });
  input.addEventListener('input', () => { clearBtn.hidden = !input.value; });
  clearBtn.addEventListener('click', () => { input.value = ''; clearBtn.hidden = true; input.focus(); });

  const goTab = (tab, focus) => {
    st.tab = tab;
    shown = PAGE;
    save(true);
    render();
    if (focus) $(`#sr-tab-${tab}`).focus();
  };
  tabsEl.addEventListener('click', (e) => {
    const t = e.target.closest('.sr-tab');
    if (t) goTab(t.dataset.tab);
  });
  tabsEl.addEventListener('keydown', (e) => {
    const tabs = $$('.sr-tab', tabsEl).filter((t) => !t.hidden);
    const i = tabs.indexOf(document.activeElement);
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (i < 0) return;
    let next = null;
    if (step) next = tabs[(i + step + tabs.length) % tabs.length];
    if (e.key === 'Home') next = tabs[0];
    if (e.key === 'End') next = tabs[tabs.length - 1];
    if (next) { e.preventDefault(); goTab(next.dataset.tab, true); }
  });

  // filter drawer on small screens (same pattern as the shop page)
  let scrim = null;
  const setDrawer = (open) => {
    const aside = $('#filters');
    const openBtn = $('[data-filters-open]');
    if (!aside) return;
    aside.classList.toggle('is-open', open);
    openBtn?.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      scrim = document.createElement('div');
      scrim.className = 'filters-scrim';
      scrim.addEventListener('click', () => setDrawer(false));
      document.body.appendChild(scrim);
      $('.filters__close', aside).focus();
    } else {
      scrim?.remove();
      scrim = null;
    }
  };

  const rerenderProducts = (keepDrawer) => {
    const wasOpen = $('#filters')?.classList.contains('is-open');
    save(false);
    render();
    if (keepDrawer && wasOpen) {
      $('#filters').classList.add('is-open');
      $('[data-filters-open]')?.setAttribute('aria-expanded', 'true');
    }
  };

  panel.addEventListener('change', (e) => {
    if (e.target.matches('[data-sr-filters] input')) {
      const { name, value, checked } = e.target;
      st.f[name] = checked ? [...st.f[name], value] : st.f[name].filter((v) => v !== value);
      shown = PAGE;
      rerenderProducts(true);
      $(`[data-sr-filters] input[name="${name}"][value="${value}"]`)?.focus();
    }
    if (e.target.matches('[data-sr-sort]')) {
      st.sort = e.target.value;
      rerenderProducts();
      $('[data-sr-sort]').focus();
    }
  });

  panel.addEventListener('click', (e) => {
    const t = e.target;
    const tab = t.closest('[data-go-tab]');
    if (tab) { goTab(tab.dataset.goTab); window.scrollTo({ top: tabsEl.getBoundingClientRect().top + scrollY - 90, behavior: 'smooth' }); return; }

    if (t.closest('[data-filters-open]')) { setDrawer(true); return; }
    if (t.closest('[data-filters-close]')) { const was = $('#filters')?.classList.contains('is-open'); setDrawer(false); if (was) $('[data-filters-open]')?.focus(); return; }

    const un = t.closest('[data-sr-unfilter]');
    if (un) {
      const [k, v] = un.dataset.srUnfilter.split(':');
      st.f[k] = st.f[k].filter((y) => y !== v);
      rerenderProducts();
      ($('[data-sr-unfilter]') || $('[data-sr-sort]')).focus();
      return;
    }
    if (t.closest('[data-sr-clear-filters]')) {
      FACETS.forEach((k) => { st.f[k] = []; });
      setDrawer(false);
      rerenderProducts();
      $('[data-sr-sort]')?.focus();
      return;
    }
    if (t.closest('[data-sr-more]')) {
      const before = shown;
      shown += PAGE;
      rerenderProducts();
      $$('.plp-grid .card__name a')[before]?.focus();
      return;
    }
    if (t.closest('[data-sr-clear-recent]')) {
      recent.clear();
      renderStart();
      toast('Cleared your recent searches');
      $('.sr-pop')?.focus();
      return;
    }
    const pop = t.closest('[data-sr-q]');
    if (pop) { e.preventDefault(); run(pop.dataset.srQ); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  });
  S.bindCards(panel);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('#filters')?.classList.contains('is-open')) { setDrawer(false); $('[data-filters-open]')?.focus(); }
  });

  window.addEventListener('popstate', () => { st = read(); shown = PAGE; render(); });

  panel.tabIndex = -1;
  if (st.q) recent.add(st.q);
  render();
  if (!st.q) input.focus();
})();
