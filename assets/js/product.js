/* Morrow — product detail page */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const form = $('[data-pdp-form]');
  if (!form) return;

  const root = document.documentElement;
  const money = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const setText = (sel, text) => $$(sel).forEach((el) => { el.textContent = text; });

  /* ---------- Gallery (tabs pattern) ---------- */
  const tabs = $$('.gallery__thumb');
  let current = 0;
  const show = (i, focus = false) => {
    current = (i + tabs.length) % tabs.length;
    tabs.forEach((t, j) => {
      const on = j === current;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
    });
    $('[data-gallery-index]').textContent = current + 1;
    if (focus) tabs[current].focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => show(i));
    t.addEventListener('keydown', (e) => {
      const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (e.key in keys) { e.preventDefault(); show(current + keys[e.key], true); }
      if (e.key === 'Home') { e.preventDefault(); show(0, true); }
      if (e.key === 'End') { e.preventDefault(); show(tabs.length - 1, true); }
    });
  });
  $('[data-gallery-prev]').addEventListener('click', () => show(current - 1));
  $('[data-gallery-next]').addEventListener('click', () => show(current + 1));

  // swipe on touch screens
  const stage = $('.gallery__stage');
  let startX = null;
  stage.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) show(current + (dx < 0 ? 1 : -1));
    startX = null;
  });

  /* ---------- Options ---------- */
  const selected = (name) => $(`input[name="${name}"]:checked`, form);
  const qtyInput = $('#qty');

  const update = () => {
    const fabric = selected('fabric');
    const size = selected('size');
    const legs = selected('legs');

    // colors drive every illustration on the page
    root.style.setProperty('--fabric', fabric.dataset.hex);
    root.style.setProperty('--leg', legs.dataset.hex);
    $$('.texture').forEach((t) => { t.dataset.type = fabric.dataset.type; });

    const fabricName = fabric.dataset.name.charAt(0).toUpperCase() + fabric.dataset.name.slice(1);
    setText('[data-fabric-label]', fabricName);
    setText('[data-size-label]', size.value);
    setText('[data-leg-label]', legs.value);
    $('.pdp-title').textContent = `Alder ${size.value === 'Corner' ? 'corner' : size.value} sofa`;

    const price = Number(size.dataset.price);
    setText('[data-price]', money(price));
    setText('[data-finance]', money(price / 4));

    ['w', 'd', 'h'].forEach((k) => setText(`[data-dim="${k}"]`, size.dataset[k]));

    const inStock = fabric.dataset.stock === 'in';
    $('[data-stock-dot]').className = 'dot ' + (inStock ? 'dot--in' : 'dot--order');
    $('[data-stock-text]').textContent = inStock
      ? 'In stock. Delivered in 1–2 weeks.'
      : 'Made to order in this fabric. Delivered in 6–8 weeks.';
    lastEstimate && checkPostcode(lastEstimate);
  };
  form.addEventListener('change', update);

  /* ---------- Quantity ---------- */
  const clampQty = () => {
    const n = Math.min(10, Math.max(1, parseInt(qtyInput.value, 10) || 1));
    qtyInput.value = n;
    return n;
  };
  $$('[data-qty]').forEach((b) => b.addEventListener('click', () => {
    qtyInput.value = (parseInt(qtyInput.value, 10) || 1) + Number(b.dataset.qty);
    clampQty();
  }));
  qtyInput.addEventListener('blur', clampQty);

  /* ---------- Add to cart ---------- */
  const addBtn = $('[data-pdp-add]');
  const add = () => {
    const qty = clampQty();
    window.Morrow?.addToCart(qty);
    const what = `${$('.pdp-title').textContent} in ${selected('fabric').dataset.name.toLowerCase()}`;
    window.Morrow?.toast(`Added ${qty > 1 ? qty + ' × ' : ''}${what} to your cart`);
  };
  form.addEventListener('submit', (e) => { e.preventDefault(); add(); });
  $('[data-buybar-add]').addEventListener('click', add);

  /* ---------- Wishlist ---------- */
  const wish = $('.pdp-wish');
  wish.addEventListener('click', () => {
    const on = wish.getAttribute('aria-pressed') !== 'true';
    wish.setAttribute('aria-pressed', String(on));
    window.Morrow?.toast(on ? 'Saved Alder sofa to your wishlist' : 'Removed Alder sofa from your wishlist');
  });

  /* ---------- Delivery estimate ---------- */
  const postForm = $('[data-postcode]');
  const postMsg = $('.delivery__msg', postForm);
  const postInput = $('#postcode');
  let lastEstimate = null;
  const fmtDate = (d) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  function checkPostcode(zip) {
    const inStock = selected('fabric').dataset.stock === 'in';
    const [a, b] = inStock ? [8, 14] : [42, 56];
    const from = new Date(); from.setDate(from.getDate() + a);
    const to = new Date(); to.setDate(to.getDate() + b);
    postMsg.className = 'delivery__msg is-success';
    postMsg.textContent = `Delivers to ${zip} between ${fmtDate(from)} and ${fmtDate(to)}.`;
  }
  postForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const zip = postInput.value.trim();
    if (!/^\d{5}$/.test(zip)) {
      lastEstimate = null;
      postInput.setAttribute('aria-invalid', 'true');
      postMsg.className = 'delivery__msg is-error';
      postMsg.textContent = 'Enter a 5-digit ZIP code, like 10001.';
      return;
    }
    postInput.removeAttribute('aria-invalid');
    lastEstimate = zip;
    checkPostcode(zip);
  });

  /* ---------- Sticky buy bar ---------- */
  const bar = $('[data-buybar]');
  const barBtn = $('[data-buybar-add]');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      // show once the main button has scrolled above the viewport
      const show = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      bar.classList.toggle('is-visible', show);
      bar.setAttribute('aria-hidden', String(!show));
      barBtn.tabIndex = show ? 0 : -1;
    }).observe(addBtn);
  }

  /* ---------- Reviews ---------- */
  $$('.rv__helpful').forEach((b) => b.addEventListener('click', () => {
    const on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', String(on));
    $('span', b).textContent = Number(b.dataset.count) + (on ? 1 : 0);
  }));
  const more = $('[data-rv-more]');
  more.addEventListener('click', () => {
    const hidden = $$('.rv[hidden]');
    hidden.slice(0, 4).forEach((r) => { r.hidden = false; });
    hidden[0]?.querySelector('.rv__title')?.setAttribute('tabindex', '-1');
    hidden[0]?.querySelector('.rv__title')?.focus();
    if ($$('.rv[hidden]').length === 0) more.hidden = true;
  });
  $('[data-write-review]').addEventListener('click', () => {
    window.Morrow?.toast('Reviews open to verified buyers. Check your order email for the link.');
  });

  update();
})();
