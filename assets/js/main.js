/* Morrow — homepage interactions */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ---------- Display preferences (chosen on the accessibility page), on every page ---------- */
  const DISPLAY_KEY = 'morrow-display';
  const applyDisplay = (d = {}) => {
    const root = document.documentElement;
    root.classList.toggle('pref-text-112', d.size === '112');
    root.classList.toggle('pref-text-125', d.size === '125');
    ['contrast', 'links', 'spacing', 'motion'].forEach((k) => root.classList.toggle(`pref-${k}`, !!d[k]));
  };
  try { applyDisplay(JSON.parse(localStorage.getItem(DISPLAY_KEY)) || {}); } catch (err) { /* storage unavailable */ }

  /* ---------- Mobile nav ---------- */
  const nav = $('#primary-nav');
  const navToggle = $('.nav-toggle');
  let scrim;

  const setNav = (open) => {
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      scrim = document.createElement('div');
      scrim.className = 'nav-scrim';
      scrim.addEventListener('click', () => setNav(false));
      document.body.appendChild(scrim);
    } else if (scrim) {
      scrim.remove();
      scrim = null;
    }
  };
  navToggle.addEventListener('click', () => setNav(!nav.classList.contains('is-open')));

  /* ---------- Mega menu ---------- */
  const desktop = window.matchMedia('(min-width: 901px)');
  $$('.has-mega').forEach((item) => {
    const trigger = $('.nav__link', item);
    const set = (open) => {
      item.classList.toggle('is-open', open);
      trigger.setAttribute('aria-expanded', String(open));
    };
    // a mouse click right after hovering shouldn't close the menu the hover just opened
    let hoverOpened = false;
    trigger.addEventListener('click', (e) => {
      if (hoverOpened && e.detail > 0) { hoverOpened = false; set(true); return; }
      set(!item.classList.contains('is-open'));
    });
    item.addEventListener('mouseenter', () => { if (desktop.matches) { hoverOpened = !item.classList.contains('is-open'); set(true); } });
    item.addEventListener('mouseleave', () => { hoverOpened = false; if (desktop.matches) set(false); });
    item.addEventListener('focusout', (e) => {
      if (desktop.matches && !item.contains(e.relatedTarget)) set(false);
    });
  });

  /* ---------- Header search: a panel with suggestions as you type ----------
     The index (search-index.js) loads the first time the panel opens. Enter goes to search.html. */
  const searchBtn = $('[data-search-open]');
  const pageSearch = $('[data-sr-form]'); // on search.html the button just focuses the big field
  if (searchBtn) {
    const RECENT_KEY = 'morrow-recent-searches';
    const getRecent = () => { try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch (e) { return []; } };
    const addRecent = (q) => {
      const list = [q, ...getRecent().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 6);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch (e) { /* storage unavailable */ }
    };
    const loadIndex = () => new Promise((resolve) => {
      if (window.MorrowSearch) { resolve(window.MorrowSearch); return; }
      let s = $('script[data-search-index]');
      if (!s) {
        s = document.createElement('script');
        s.src = 'assets/js/search-index.js';
        s.dataset.searchIndex = '';
        document.head.appendChild(s);
      }
      s.addEventListener('load', () => resolve(window.MorrowSearch), { once: true });
      s.addEventListener('error', () => resolve(null), { once: true });
    });

    const qs = document.createElement('div');
    qs.className = 'qs';
    qs.hidden = true;
    qs.innerHTML = `
      <div class="qs__scrim" data-qs-close></div>
      <div class="qs__panel" role="dialog" aria-modal="true" aria-label="Search">
        <div class="container qs__bar">
          <form class="qs__form" role="search" action="search.html">
            <div class="sr-field sr-field--sm">
              <svg class="sr-field__icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
              <input class="qs__input" name="q" type="search" role="combobox" aria-label="Search furniture, ideas and help" aria-expanded="true" aria-controls="qs-list" aria-autocomplete="list" autocomplete="off" spellcheck="false" enterkeyhint="search" placeholder="Search sofas, oak, delivery…">
              <button class="sr-field__clear" type="button" data-qs-clear aria-label="Clear search" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
            </div>
          </form>
          <button class="qs__close" type="button" data-qs-close>Close</button>
        </div>
        <div class="container qs__body">
          <div class="qs__list" id="qs-list" role="listbox" aria-label="Suggestions"></div>
          <p class="visually-hidden" aria-live="polite" data-qs-status></p>
        </div>
      </div>`;
    document.body.appendChild(qs);
    const qInput = $('.qs__input', qs);
    const list = $('#qs-list', qs);
    const status = $('[data-qs-status]', qs);
    const qClear = $('[data-qs-clear]', qs);
    let S = null;
    let active = -1;
    let lastFocus = null;

    const opts = () => $$('[role="option"]', list);
    const setActive = (i, scroll = true) => {
      const all = opts();
      active = all.length ? (i + all.length) % all.length : -1;
      all.forEach((o, n) => o.setAttribute('aria-selected', String(n === active)));
      if (active >= 0) {
        qInput.setAttribute('aria-activedescendant', all[active].id);
        if (scroll) all[active].scrollIntoView({ block: 'nearest' });
      } else qInput.removeAttribute('aria-activedescendant');
    };

    let uid = 0;
    const opt = (inner, attrs, cls = '') => `<a class="qs-opt ${cls}" role="option" id="qs-o${uid++}" aria-selected="false" tabindex="-1" ${attrs}>${inner}</a>`;
    const group = (title, body, cls = '') => `<div class="qs-group ${cls}" role="group" aria-label="${title}"><p class="qs-group__title" aria-hidden="true">${title}</p>${body}</div>`;
    const thumb = (id) => (id ? `<span class="qs-thumb"><img class="ph" src="${S.photo(id, 120)}" srcset="${S.photo(id, 120)} 120w, ${S.photo(id, 240)} 240w" sizes="56px" alt="" loading="lazy" decoding="async"></span>` : '<span class="qs-thumb"></span>');
    const icon = (d) => `<svg class="qs-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
    const ICON_SEARCH = 'M10.5 17.5a7 7 0 1 1 0-14 7 7 0 0 1 0 14ZM20 20l-4.5-4.5';
    const ICON_RECENT = 'M12 7v5l3 2M3.5 12a8.5 8.5 0 1 0 2.5-6M3 4v4h4';
    const ICON_HELP = 'M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z';
    const ICON_ARROW = 'M5 12h14M13 6l6 6-6 6';
    const productOpt = (p, q) => opt(`${thumb(p.photo)}<span class="qs-opt__text"><span class="qs-opt__name">${S.highlight(p.name, q)}</span><span class="qs-opt__meta">${S.esc(p.meta)}</span></span><span class="qs-opt__price">${p.was ? `<span class="price__now">${S.money(p.price)}</span>` : S.money(p.price)}</span>`, 'href="product.html"', 'qs-opt--product');
    const searchUrl = (q) => `search.html?q=${encodeURIComponent(q)}`;

    const renderEmpty = () => {
      const rec = getRecent();
      const trending = [...S.products].sort((a, b) => a.pop - b.pop).slice(0, 4);
      list.innerHTML = `<div class="qs-cols">
        <div>
          ${rec.length ? group('Recent searches', rec.map((r) => opt(`${icon(ICON_RECENT)}<span>${S.esc(r)}</span>`, `href="${searchUrl(r)}" data-q="${S.esc(r)}"`)).join('') + opt('<span class="qs-opt__clear">Clear recent searches</span>', 'href="#" data-clear-recent', 'qs-opt--quiet')) : ''}
          ${group('Popular searches', S.popular.map((r) => opt(`${icon(ICON_SEARCH)}<span>${S.esc(r)}</span>`, `href="${searchUrl(r)}" data-q="${S.esc(r)}"`)).join(''))}
        </div>
        ${group('Popular right now', trending.map((p) => productOpt(p, '')).join(''), 'qs-group--products')}
      </div>`;
      status.textContent = '';
      setActive(-1);
    };

    const renderResults = (q) => {
      const r = S.search(q, { prefix: true });
      const shownQ = r.corrected || q;
      const total = r.products.length + r.articles.length + r.help.length;
      const left = [];
      if (r.shortcuts.length) left.push(group('Categories and rooms', r.shortcuts.slice(0, 4).map((s) => opt(`${icon(ICON_ARROW)}<span>${S.highlight(s.name, shownQ)}</span><span class="qs-opt__kind">${S.esc(s.kind)}</span>`, `href="${s.href}"`)).join('')));
      if (r.help.length) left.push(group('Help', r.help.slice(0, 3).map((h) => opt(`${icon(ICON_HELP)}<span>${S.highlight(h.title, shownQ)}</span>`, `href="${h.href}"`)).join('')));
      if (r.articles.length) left.push(group('Ideas & guides', r.articles.slice(0, 2).map((a) => opt(`${thumb(a.photo)}<span class="qs-opt__text"><span class="qs-opt__name">${S.highlight(a.title, shownQ)}</span><span class="qs-opt__meta">${S.esc(a.kind)}</span></span>`, `href="${a.href}"`, 'qs-opt--article')).join('')));
      const right = r.products.length ? group('Products', r.products.slice(0, 4).map((p) => productOpt(p, shownQ)).join(''), 'qs-group--products') : '';
      const note = r.corrected ? `<p class="qs-note">Showing results for <strong>${S.esc(r.corrected)}</strong></p>` : '';
      if (!total && !r.shortcuts.length) {
        list.innerHTML = `<div class="qs-none"><p>No matches for <strong>${S.esc(q)}</strong>. Check the spelling or try a simpler word, like sofa or delivery.</p></div>${group('Popular searches', S.popular.slice(0, 5).map((p) => opt(`${icon(ICON_SEARCH)}<span>${S.esc(p)}</span>`, `href="${searchUrl(p)}" data-q="${S.esc(p)}"`)).join(''), 'qs-group--inline')}`;
        status.textContent = `No matches for ${q}`;
      } else {
        list.innerHTML = `${note}<div class="qs-cols qs-cols--results">${right}${left.length ? `<div>${left.join('')}</div>` : ''}</div>
          ${opt(`<span>See all ${total} result${total === 1 ? '' : 's'} for <strong>${S.esc(q)}</strong></span>${icon(ICON_ARROW)}`, `href="${searchUrl(q)}" data-q="${S.esc(q)}"`, 'qs-opt--all')}`;
        status.textContent = `${total} results. Use the up and down arrows to browse.`;
      }
      setActive(-1);
    };

    let timer;
    const update = () => {
      const q = qInput.value.trim();
      qClear.hidden = !qInput.value;
      if (!S) return;
      if (q) renderResults(q); else renderEmpty();
    };

    const openSearch = async () => {
      if (pageSearch) { const f = $('#sr-q'); f.focus(); f.select(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      lastFocus = document.activeElement;
      qs.hidden = false;
      document.body.classList.add('qs-open');
      searchBtn.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(() => qs.classList.add('is-open'));
      qInput.focus();
      if (!S) {
        list.innerHTML = '<p class="qs-loading">Loading…</p>';
        S = await loadIndex();
        if (!S) { list.innerHTML = '<p class="qs-loading">Search isn’t available right now. Press Enter to search anyway.</p>'; return; }
      }
      update();
    };
    const closeSearch = () => {
      qs.classList.remove('is-open');
      qs.hidden = true;
      document.body.classList.remove('qs-open');
      searchBtn.setAttribute('aria-expanded', 'false');
      (lastFocus && lastFocus !== document.body ? lastFocus : searchBtn).focus();
    };
    const go = (el) => {
      if (el.hasAttribute('data-clear-recent')) {
        try { localStorage.removeItem(RECENT_KEY); } catch (e) { /* storage unavailable */ }
        renderEmpty();
        qInput.focus();
        return;
      }
      if (el.dataset.q) addRecent(el.dataset.q);
      else if (qInput.value.trim()) addRecent(qInput.value.trim());
      location.href = el.getAttribute('href');
    };

    searchBtn.addEventListener('click', () => (qs.hidden ? openSearch() : closeSearch()));
    // start loading the index as soon as someone reaches for the button
    ['pointerenter', 'focus'].forEach((ev) => searchBtn.addEventListener(ev, () => { if (!pageSearch) loadIndex().then((s) => { S = S || s; }); }, { once: true }));
    $$('[data-qs-close]', qs).forEach((b) => b.addEventListener('click', closeSearch));
    qClear.addEventListener('click', () => { qInput.value = ''; update(); qInput.focus(); });
    qInput.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(update, 90); });
    $('.qs__form', qs).addEventListener('submit', (e) => {
      e.preventDefault();
      const all = opts();
      if (active >= 0 && all[active]) { go(all[active]); return; }
      const q = qInput.value.trim();
      if (!q) return;
      addRecent(q);
      location.href = searchUrl(q);
    });
    list.addEventListener('click', (e) => {
      const o = e.target.closest('[role="option"]');
      if (!o) return;
      e.preventDefault();
      go(o);
    });
    list.addEventListener('mousemove', (e) => {
      const o = e.target.closest('[role="option"]');
      if (o) { const i = opts().indexOf(o); if (i !== active) setActive(i, false); }
    });
    qs.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); if (qInput.value) { qInput.value = ''; update(); } else closeSearch(); return; }
      if (e.target === qInput && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();
        setActive(active < 0 && e.key === 'ArrowUp' ? -1 : active + (e.key === 'ArrowDown' ? 1 : -1));
        return;
      }
      if (e.key === 'Tab') { // keep focus inside the dialog: the field, clear and close
        const f = [qInput, qClear, $('.qs__close', qs)].filter((el) => !el.hidden);
        const i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    // "/" opens search from anywhere (unless you're typing in a field)
    document.addEventListener('keydown', (e) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.closest('input, textarea, select, [contenteditable="true"]') || !qs.hidden) return;
      e.preventDefault();
      openSearch();
    });
  }

  /* ---------- Hotspots on photos ----------
     Hotspots with data-x / data-y (percent of the photo itself) stay on their object however the
     photo is cropped by object-fit: cover. Used by the home hero, shop-by-room and the lookbook. */
  const fitSpots = (box) => {
    const photo = $('img.ph', box);
    const bw = box.clientWidth, bh = box.clientHeight;
    if (!photo || !photo.naturalWidth || !bw) return;
    const scale = Math.max(bw / photo.naturalWidth, bh / photo.naturalHeight);
    const w = photo.naturalWidth * scale, h = photo.naturalHeight * scale;
    const [px, py] = (getComputedStyle(photo).objectPosition || '50% 50%').split(' ').map((v) => parseFloat(v) / 100);
    const ox = (bw - w) * (Number.isNaN(px) ? 0.5 : px), oy = (bh - h) * (Number.isNaN(py) ? 0.5 : py);
    $$('[data-x][data-y]', box).forEach((s) => {
      const x = ox + (Number(s.dataset.x) / 100) * w, y = oy + (Number(s.dataset.y) / 100) * h;
      s.style.left = `${Math.min(Math.max(x, 18), bw - 18) / bw * 100}%`;
      s.style.top = `${Math.min(Math.max(y, 18), bh - 18) / bh * 100}%`;
    });
  };
  // a ResizeObserver also catches boxes that start hidden (e.g. room tabs)
  const spotBoxes = $$('[data-photo-spots]');
  const spotObserver = 'ResizeObserver' in window ? new ResizeObserver((es) => es.forEach((e) => fitSpots(e.target))) : null;
  spotBoxes.forEach((box) => {
    const photo = $('img.ph', box);
    if (photo && !photo.complete) photo.addEventListener('load', () => fitSpots(box), { once: true });
    fitSpots(box);
    spotObserver?.observe(box);
  });
  if (spotBoxes.length && !spotObserver) {
    let t;
    window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => spotBoxes.forEach(fitSpots), 100); });
  }

  /* ---------- Hero hotspots ---------- */
  const scene = $('.scene');
  const hotspots = scene ? $$('.hotspot', scene) : [];

  const closeHotspots = () => {
    hotspots.forEach((h) => {
      h.setAttribute('aria-expanded', 'false');
      $('#' + h.getAttribute('aria-controls')).hidden = true;
    });
  };

  const placeCard = (spot, card) => {
    const s = scene.getBoundingClientRect();
    const b = spot.getBoundingClientRect();
    const cw = card.offsetWidth;
    const ch = card.offsetHeight;
    const cx = b.left - s.left + b.width / 2;
    const cy = b.top - s.top;
    // prefer above the marker; fall back to below
    let top = cy - ch - 12;
    if (top < 0) top = cy + b.height + 12;
    const left = Math.min(Math.max(cx - cw / 2, 0), s.width - cw);
    card.style.left = left + 'px';
    card.style.top = top + 'px';
  };

  hotspots.forEach((spot) => {
    spot.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = $('#' + spot.getAttribute('aria-controls'));
      const wasOpen = spot.getAttribute('aria-expanded') === 'true';
      closeHotspots();
      if (wasOpen) return;
      spot.setAttribute('aria-expanded', 'true');
      card.hidden = false;
      placeCard(spot, card);
    });
  });
  $$('.hotspot-card').forEach((c) => c.addEventListener('click', (e) => e.stopPropagation()));

  document.addEventListener('click', closeHotspots);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeHotspots();
    $$('.has-mega.is-open').forEach((i) => {
      i.classList.remove('is-open');
      $('.nav__link', i).setAttribute('aria-expanded', 'false');
    });
    if (nav.classList.contains('is-open')) setNav(false);
  });
  window.addEventListener('resize', closeHotspots);

  /* ---------- Product tabs + carousel (homepage) ---------- */
  const carousel = $('[data-carousel]');
  if (carousel) {
    const prev = $('[data-carousel-prev]');
    const next = $('[data-carousel-next]');
    const cards = $$('.card', carousel);

    const updateArrows = () => {
      const max = carousel.scrollWidth - carousel.clientWidth - 2;
      prev.disabled = carousel.scrollLeft <= 2;
      next.disabled = carousel.scrollLeft >= max;
    };
    const step = () => (cards.find((c) => !c.hidden)?.offsetWidth || 300) + 20;
    prev.addEventListener('click', () => carousel.scrollBy({ left: -step() }));
    next.addEventListener('click', () => carousel.scrollBy({ left: step() }));
    carousel.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);

    const applyFilter = (filter) => {
      cards.forEach((c) => { c.hidden = !c.dataset.tags.split(' ').includes(filter); });
      carousel.scrollLeft = 0;
      updateArrows();
    };
    $$('.tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        $$('.tab').forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
        applyFilter(tab.dataset.filter);
      });
    });
    applyFilter($('.tab[aria-selected="true"]').dataset.filter);
  }

  /* ---------- Swatches recolor the product ---------- */
  $$('.swatches').forEach((group) => {
    const media = $('.card__media', group.closest('.card'));
    $$('button', group).forEach((btn) => {
      btn.addEventListener('click', () => {
        $$('button', group).forEach((b) => b.setAttribute('aria-checked', String(b === btn)));
        media.style.color = btn.style.getPropertyValue('--c');
      });
    });
  });

  /* ---------- Wishlist ---------- */
  $$('.wish').forEach((btn) => {
    btn.addEventListener('click', () => {
      const on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(on));
      const name = $('.card__name', btn.closest('.card')).textContent.trim();
      toast(on ? `Saved ${name} to your wishlist` : `Removed ${name} from your wishlist`);
    });
  });

  /* ---------- Cart ---------- */
  const countEl = $('[data-cart-count]');
  const cartBtn = $('.cart-btn');
  let count = 0;
  const setCartCount = (n) => {
    count = n;
    countEl.textContent = count;
    cartBtn.setAttribute('aria-label', `Cart, ${count} item${count === 1 ? '' : 's'}`);
  };
  const addToCart = (qty = 1) => {
    setCartCount(count + qty);
    countEl.classList.remove('bump');
    void countEl.offsetWidth;
    countEl.classList.add('bump');
  };
  $$('[data-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      addToCart(1);
      const card = btn.closest('.card');
      const name = $('.card__name', card).textContent.trim();
      const colour = $('.swatches [aria-checked="true"]', card)?.getAttribute('aria-label');
      toast(`Added ${name}${colour ? ` in ${colour.toLowerCase()}` : ''} to your cart`);
      btn.textContent = 'Added';
      btn.classList.add('is-added');
      setTimeout(() => { btn.textContent = 'Add to cart'; btn.classList.remove('is-added'); }, 1600);
    });
  });

  /* ---------- Toast ---------- */
  const toastEl = $('.toast');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2600);
  }

  // shared helpers for page scripts (shop.js, product.js, cart.js)
  /* ---------- Product photos (Pexels, free to use; see README > Photos) ---------- */
  const PHOTOS = {
    'Alder 3-seat sofa': 20337842, 'Alder corner sofa': 19650953, 'Hale 2-seat sofa': 16825059, 'Hale lounge chair': 29508373,
    'Ren lounge chair': 20794782, 'Otto armchair': 20337873, 'Fold dining chair': 39854852, 'Oslo dining chair': 39854852,
    'Fold dining table': 39854857, 'Drift coffee table': 27059629, 'Tove side table': 8670505, 'Arc wall mirror': 5644681,
    'Stilla sideboard': 12277013, 'Haven bed': 12277123, 'Linden bed': 12277123, 'Rowe desk': 12202411,
    'Lumen floor lamp': 34992772, 'Halo pendant light': 38278700, 'Loma vase': 7674547, 'Mira wool rug': 18266462, 'Terra planter': 7912988,
  };
  const photoUrl = (id, w = 400) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
  // <img> for a product by name, or '' if there's no photo for it
  const productImg = (name, { w = 200, alt = '' } = {}) => {
    const id = PHOTOS[name];
    if (!id) return '';
    const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    return `<img class="ph" src="${photoUrl(id, w)}" srcset="${photoUrl(id, w)} ${w}w, ${photoUrl(id, w * 2)} ${w * 2}w" sizes="96px" alt="${esc(alt)}" loading="lazy" decoding="async">`;
  };

  window.Morrow = { addToCart, setCartCount, toast, applyDisplay, DISPLAY_KEY, productImg, photoUrl };

  /* ---------- Newsletter ---------- */
  const form = $('[data-newsletter]');
  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('input', form);
    const msg = $('.newsletter__msg', form);
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
    input.setAttribute('aria-invalid', String(!ok));
    msg.className = 'newsletter__msg ' + (ok ? 'is-success' : 'is-error');
    msg.textContent = ok
      ? 'Subscribed. Your 10% code is on its way to your inbox.'
      : 'Enter an email address like name@example.com.';
    if (ok) form.reset();
  });
})();
