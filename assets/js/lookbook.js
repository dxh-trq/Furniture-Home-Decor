/* Morrow — lookbook: collection filter, chapter bar that follows your scroll, numbered hotspots linked to each
   look's piece list, add a piece or a whole look, saved looks (kept on this device), the season's palette,
   and a slideshow. Looks are plain HTML in the page: add one by copying an <article data-look>. */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const looks = $$('[data-look]');
  if (!looks.length) return;

  const money = (n) => '$' + n.toLocaleString('en-US');
  const toast = (m) => window.Morrow?.toast(m);
  const title = (look) => $('.lb-copy__title', look).textContent;
  const visible = () => looks.filter((l) => !l.hidden);

  /* ---------- Collection filter ---------- */
  const filters = $$('[data-lb-filter]');
  const chaps = $$('[data-lb-chap]');
  const interludes = $$('.lb-quote, .lb-palette');
  const setFilter = (c) => {
    filters.forEach((f) => f.setAttribute('aria-pressed', String(f.dataset.lbFilter === c)));
    looks.forEach((l) => { l.hidden = c !== 'all' && l.dataset.coll !== c; });
    chaps.forEach((a) => { a.parentElement.hidden = c !== 'all' && a.parentElement.dataset.coll !== c; });
    interludes.forEach((el) => { el.hidden = c !== 'all'; });
    visible().forEach((l, i) => l.classList.toggle('lb-look--flip', i % 2 === 1));
    closeTip();
    const bar = $('.lb-bar');
    if (bar.getBoundingClientRect().top <= 1) window.scrollTo({ top: $('[data-lb-looks]').offsetTop - bar.offsetHeight - 70 });
  };
  filters.forEach((f) => f.addEventListener('click', () => setFilter(f.dataset.lbFilter)));

  /* ---------- Chapter bar follows the look in view ---------- */
  const setCurrent = (id) => chaps.forEach((a) => {
    const on = a.dataset.lbChap === id;
    if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    if (on && a.parentElement.parentElement.scrollWidth > a.parentElement.parentElement.clientWidth) {
      const list = a.parentElement.parentElement;
      list.scrollTo({ left: a.offsetLeft - list.clientWidth / 2 + a.offsetWidth / 2 });
    }
  });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.filter((e) => e.isIntersecting).forEach((e) => setCurrent(e.target.id));
    }, { rootMargin: '-45% 0px -50% 0px' });
    looks.forEach((l) => io.observe(l));
  }

  /* ---------- Hotspots and piece lists ---------- */
  let openSpot = null;
  function closeTip() {
    if (!openSpot) return;
    openSpot.setAttribute('aria-expanded', 'false');
    const look = openSpot.closest('[data-look]');
    $('[data-lb-tip]', look).hidden = true;
    $$('.lb-item.is-lit', look).forEach((x) => x.classList.remove('is-lit'));
    openSpot = null;
  }
  const addOne = (it) => {
    const qty = Number(it.dataset.qty);
    window.Morrow?.addToCart(qty);
    toast(`Added ${qty > 1 ? `${qty} × ` : ''}${$('strong', it).textContent} to your cart`);
  };

  looks.forEach((look) => {
    const items = $$('.lb-item', look);
    const spots = $$('.lb-spot', look);
    const tip = $('[data-lb-tip]', look);
    const item = (id) => items.find((x) => x.dataset.piece === id);
    const spot = (id) => spots.find((x) => x.dataset.piece === id);

    spots.forEach((s) => s.addEventListener('click', (e) => {
      e.stopPropagation();
      if (openSpot === s) { closeTip(); return; }
      closeTip();
      openSpot = s;
      const it = item(s.dataset.piece);
      const qty = Number(it.dataset.qty);
      $('[data-tip-name]', tip).textContent = $('strong', it).textContent;
      $('[data-tip-price]', tip).textContent = `${$('.lb-item__info span', it).textContent} · ${qty > 1 ? `${qty} × ` : ''}${money(Number(it.dataset.price))}`;
      const x = parseFloat(s.style.left);
      const y = parseFloat(s.style.top);
      tip.style.left = `${x}%`;
      tip.style.top = `${y}%`;
      tip.classList.toggle('is-left', x > 60);
      tip.classList.toggle('is-center', x >= 35 && x <= 60);
      tip.classList.toggle('is-below', y < 35);
      tip.hidden = false;
      s.setAttribute('aria-expanded', 'true');
      it.classList.add('is-lit');
    }));
    $('[data-tip-add]', tip).addEventListener('click', (e) => {
      e.stopPropagation();
      if (openSpot) addOne(item(openSpot.dataset.piece));
    });
    tip.addEventListener('click', (e) => e.stopPropagation());

    items.forEach((it) => {
      const on = () => spot(it.dataset.piece)?.classList.add('is-lit');
      const off = () => spot(it.dataset.piece)?.classList.remove('is-lit');
      it.addEventListener('mouseenter', on); it.addEventListener('mouseleave', off);
      it.addEventListener('focusin', on); it.addEventListener('focusout', off);
      $('[data-lb-add-one]', it).addEventListener('click', () => addOne(it));
    });

    $('[data-lb-add-look]', look).addEventListener('click', () => {
      const count = items.reduce((s, it) => s + Number(it.dataset.qty), 0);
      window.Morrow?.addToCart(count);
      toast(`Added all ${count} pieces from ${title(look)} to your cart`);
    });
  });
  document.addEventListener('click', closeTip);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && openSpot && !show.open) { const s = openSpot; closeTip(); s.focus(); }
  });

  /* ---------- Saved looks (this device only) ---------- */
  const KEY = 'morrow-saved-looks';
  const readSaved = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (err) { return []; } };
  let saved = readSaved().filter((id) => looks.some((l) => l.id === id));
  const drawSaved = () => {
    looks.forEach((l) => {
      const b = $('[data-lb-save]', l);
      const on = saved.includes(l.id);
      b.setAttribute('aria-pressed', String(on));
      $('span', b).textContent = on ? 'Saved' : 'Save';
    });
    $('[data-lb-saved-wrap]').hidden = !saved.length;
    $('[data-lb-saved]').textContent = `${saved.length} saved`;
  };
  looks.forEach((l) => $('[data-lb-save]', l).addEventListener('click', () => {
    const on = !saved.includes(l.id);
    saved = on ? [...saved, l.id] : saved.filter((id) => id !== l.id);
    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (err) { /* storage unavailable: kept for this visit */ }
    drawSaved();
    toast(on ? `Saved ${title(l)}. Find it here next time.` : `Removed ${title(l)} from your saved looks`);
  }));
  drawSaved();

  /* ---------- Palette ---------- */
  $$('.lb-swatch').forEach((b) => b.addEventListener('click', async () => {
    const text = `${b.dataset.name} ${b.dataset.hex}`;
    try { await navigator.clipboard.writeText(b.dataset.hex); toast(`Copied ${text}`); } catch (err) { toast(text); }
  }));

  /* ---------- Slideshow ---------- */
  const show = $('[data-lb-show]');
  let at = 0;
  let opener = null;
  const draw = () => {
    const list = visible();
    const look = list[at];
    const art = $('.lb-scene__art', look).cloneNode(true);
    art.classList.add('lb-show__art');
    $('[data-lb-show-art]', show).replaceChildren(art);
    $('[data-lb-show-pos]', show).textContent = `${at + 1} of ${list.length}`;
    $('[data-lb-show-eyebrow]', show).textContent = $('.lb-copy__eyebrow', look).textContent.replace(/^\d+\s*/, '');
    $('[data-lb-show-title]', show).textContent = title(look);
    $('[data-lb-show-caption]', show).textContent = $('.lb-copy__caption', look).textContent;
    $('[data-lb-show-link]', show).href = `#${look.id}`;
  };
  const step = (d) => { const n = visible().length; at = (at + d + n) % n; draw(); };
  const openShow = (from, start = 0) => {
    opener = from;
    at = start;
    closeTip();
    draw();
    show.showModal();
    document.body.style.overflow = 'hidden';
    $('[data-lb-show-step="1"]', show).focus();
  };
  $('[data-lb-play]').addEventListener('click', (e) => openShow(e.currentTarget));
  $$('[data-lb-show-step]', show).forEach((b) => b.addEventListener('click', () => step(Number(b.dataset.lbShowStep))));
  $('[data-lb-show-close]', show).addEventListener('click', () => show.close());
  $('[data-lb-show-link]', show).addEventListener('click', () => { opener = null; show.close(); });
  show.addEventListener('click', (e) => { if (e.target === show) show.close(); });
  show.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  });
  show.addEventListener('close', () => { document.body.style.overflow = ''; opener?.focus(); });
  // swipe on touch screens
  let x0 = null;
  show.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  show.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    x0 = null;
  });
})();
