/* Morrow — homepage interactions */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

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
    trigger.addEventListener('click', () => set(!item.classList.contains('is-open')));
    item.addEventListener('mouseenter', () => desktop.matches && set(true));
    item.addEventListener('mouseleave', () => desktop.matches && set(false));
    item.addEventListener('focusout', (e) => {
      if (desktop.matches && !item.contains(e.relatedTarget)) set(false);
    });
  });

  /* ---------- Hero hotspots ---------- */
  const scene = $('.scene');
  const hotspots = $$('.hotspot', scene);

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

  /* ---------- Product tabs + carousel ---------- */
  const carousel = $('[data-carousel]');
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

  /* ---------- Swatches recolour the product ---------- */
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
  $$('[data-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      count += 1;
      countEl.textContent = count;
      cartBtn.setAttribute('aria-label', `Cart, ${count} item${count === 1 ? '' : 's'}`);
      countEl.classList.remove('bump');
      void countEl.offsetWidth;
      countEl.classList.add('bump');
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

  /* ---------- Newsletter ---------- */
  const form = $('[data-newsletter]');
  form.addEventListener('submit', (e) => {
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
