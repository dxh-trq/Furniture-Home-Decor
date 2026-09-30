/* Morrow — shop by room: room tabs (linkable, e.g. room.html#bedroom), finishes that update the piece list,
   hotspots linked to the piece list, and "add the room" with a live total. */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const tabs = $$('.rm-tab');
  if (!tabs.length) return;

  const money = (n) => '$' + n.toLocaleString('en-US');
  const pop = $('[data-rm-pop]');
  let openSpot = null;

  /* ---------- Tabs ---------- */
  const select = (id, focus = false) => {
    tabs.forEach((t) => {
      const on = t.dataset.room === id;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    $$('.rm-panel').forEach((p) => { p.hidden = p.dataset.panel !== id; });
    closePop();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => {
      select(t.dataset.room);
      history.replaceState(null, '', `#${t.dataset.room}`);
    });
    t.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (step) {
        e.preventDefault();
        const next = tabs[(i + step + tabs.length) % tabs.length];
        select(next.dataset.room, true);
        history.replaceState(null, '', `#${next.dataset.room}`);
      }
      if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        const t2 = e.key === 'Home' ? tabs[0] : tabs[tabs.length - 1];
        select(t2.dataset.room, true);
      }
    });
  });
  const fromHash = () => {
    const id = location.hash.slice(1);
    if (tabs.some((t) => t.dataset.room === id)) select(id);
  };
  window.addEventListener('hashchange', fromHash);
  fromHash();

  /* ---------- Each room ---------- */
  $$('.rm-panel').forEach((panel) => {
    const scene = $('.rm-scene', panel);
    const items = $$('.rm-item', panel);
    const spots = $$('.rm-spot', panel);
    const item = (id) => items.find((it) => it.dataset.piece === id);
    const spot = (id) => spots.find((s) => s.dataset.piece === id);

    // palettes
    $$('.rm-pal', panel).forEach((b) => b.addEventListener('click', () => {
      ['wall', 'floor', 'main', 'accent'].forEach((k) => scene.style.setProperty(`--${k}`, b.dataset[k]));
      $$('.rm-pal', panel).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      $$('[data-meta]', panel).forEach((m) => { m.textContent = m.dataset.meta.replace('{main}', b.dataset.mainName); });
      if (openSpot) showPop(openSpot);
    }));

    // totals
    const update = () => {
      const picked = items.filter((it) => $('input', it).checked);
      const count = picked.reduce((s, it) => s + Number(it.dataset.qty), 0);
      const total = picked.reduce((s, it) => s + Number(it.dataset.price) * Number(it.dataset.qty), 0);
      $('[data-rm-count]', panel).textContent = count === items.reduce((s, it) => s + Number(it.dataset.qty), 0)
        ? `The whole room, ${count} pieces` : `${count} piece${count === 1 ? '' : 's'} selected`;
      $('[data-rm-total]', panel).textContent = money(total);
      const btn = $('[data-rm-add]', panel);
      btn.disabled = count === 0;
      btn.textContent = count ? 'Add to cart' : 'Choose a piece';
      items.forEach((it) => spot(it.dataset.piece)?.classList.toggle('is-off', !$('input', it).checked));
    };
    items.forEach((it) => {
      $('input', it).addEventListener('change', update);
      // highlight the matching hotspot while pointing at or focusing a piece
      const on = () => spot(it.dataset.piece)?.classList.add('is-lit');
      const off = () => spot(it.dataset.piece)?.classList.remove('is-lit');
      it.addEventListener('mouseenter', on); it.addEventListener('mouseleave', off);
      $('input', it).addEventListener('focus', on); $('input', it).addEventListener('blur', off);
    });
    update();

    $('[data-rm-add]', panel).addEventListener('click', () => {
      const picked = items.filter((it) => $('input', it).checked);
      const count = picked.reduce((s, it) => s + Number(it.dataset.qty), 0);
      window.Morrow?.addToCart(count);
      const room = $('.rm-side__title', panel).textContent.toLowerCase();
      window.Morrow?.toast(picked.length === items.length ? `Added the whole ${room}, ${count} pieces, to your cart` : `Added ${count} piece${count === 1 ? '' : 's'} to your cart`);
    });

    // hotspots
    spots.forEach((s) => s.addEventListener('click', (e) => {
      e.stopPropagation();
      if (openSpot === s) { closePop(); return; }
      showPop(s);
      const it = item(s.dataset.piece);
      items.forEach((x) => x.classList.toggle('is-lit', x === it));
    }));
  });

  function showPop(s) {
    closePop(false);
    openSpot = s;
    const it = $$('.rm-item', s.closest('.rm-panel')).find((x) => x.dataset.piece === s.dataset.piece);
    $('[data-pop-name]', pop).textContent = $('strong', it).textContent;
    $('[data-pop-meta]', pop).textContent = $('[data-meta]', it).textContent;
    $('[data-pop-price]', pop).textContent = $('.rm-item__price', it).textContent + (Number(it.dataset.qty) > 1 ? ' in this room' : '');
    s.setAttribute('aria-expanded', 'true');
    pop.hidden = false;
    const host = pop.offsetParent.getBoundingClientRect();
    const b = s.getBoundingClientRect();
    const cw = pop.offsetWidth;
    const ch = pop.offsetHeight;
    let top = b.top - host.top - ch - 12;
    if (b.top - ch - 12 < 70) top = b.bottom - host.top + 12; // keep clear of the sticky header
    const pad = parseFloat(getComputedStyle(pop.offsetParent).paddingLeft) || 0; // stay inside the page margins
    const left = Math.min(Math.max(b.left - host.left + b.width / 2 - cw / 2, pad), host.width - cw - pad);
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
  }
  function closePop(clearLit = true) {
    if (openSpot) openSpot.setAttribute('aria-expanded', 'false');
    openSpot = null;
    pop.hidden = true;
    if (clearLit) $$('.rm-item.is-lit').forEach((x) => x.classList.remove('is-lit'));
  }
  pop.addEventListener('click', (e) => e.stopPropagation());
  document.addEventListener('click', () => { if (openSpot) closePop(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && openSpot) { const s = openSpot; closePop(); s.focus(); }
  });
  window.addEventListener('resize', () => { if (openSpot) showPop(openSpot); });
})();
