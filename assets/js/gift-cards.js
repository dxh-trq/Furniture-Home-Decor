/* Morrow — gift cards: builder with a live, flippable card preview, add to cart, and a balance checker.
   Front end only: pass the gift card to your cart in addToCart, and look balances up in your payments system. */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const form = $('[data-gc-form]');
  if (!form) return;

  const MIN = 25;
  const MAX = 2000;
  const money = (n) => '$' + n.toLocaleString('en-US');
  const card = $('[data-gc-card]');
  const custom = $('#gc-custom');
  const dateInput = $('#gc-date');
  const msg = $('#gc-msg');

  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  dateInput.value = iso(today);
  dateInput.min = iso(today);
  dateInput.max = iso(maxDate);

  const setError = (id, text) => {
    const input = document.getElementById(id);
    const err = document.getElementById(id + '-err');
    input?.setAttribute('aria-invalid', String(!!text));
    if (err) { err.textContent = text; err.hidden = !text; }
    return !text;
  };
  const val = (id) => document.getElementById(id).value.trim();
  const checked = (name) => $(`input[name="${name}"]:checked`, form);

  const amount = () => {
    const a = checked('gc-amount').value;
    return a === 'custom' ? Number(custom.value.replace(/[^0-9]/g, '')) || 0 : Number(a);
  };

  /* ---------- Live preview ---------- */
  function render() {
    const design = checked('gc-design');
    const post = checked('gc-type').value === 'post';
    card.style.setProperty('--gc-bg', design.dataset.bg);
    card.style.setProperty('--gc-ink', design.dataset.ink);
    card.style.setProperty('--gc-art', design.dataset.art);
    card.style.setProperty('--leg', design.dataset.leg);
    $('[data-gc-sym]').setAttribute('href', `#s-${design.dataset.sym}`);
    const a = amount();
    $('[data-gc-amount]').textContent = a ? money(a) : '$—';
    $('[data-gc-to]').textContent = val('gc-to') || 'someone special';
    $('[data-gc-from]').textContent = val('gc-from') || 'you';
    $('[data-gc-msg]').textContent = msg.value.trim() || 'Your message will appear here.';
    $('[data-gc-msg]').classList.toggle('is-empty', !msg.value.trim());
    $('[data-gc-count]').textContent = `${200 - msg.value.length} characters left`;

    $('[data-gc-custom]').hidden = checked('gc-amount').value !== 'custom';
    $('[data-gc-email-field]').hidden = post;
    $('[data-gc-date-field]').hidden = post;
    $('[data-gc-post-note]').hidden = !post;

    const name = design.closest('.gc-design').querySelector('.visually-hidden').textContent;
    $('[data-gc-sum]').textContent = `${post ? 'Posted' : 'Email'} gift card, ${name}`;
    $('[data-gc-total]').textContent = a ? money(a) : '$—';
    const sendDay = dateInput.value ? new Date(dateInput.value + 'T08:00:00') : today;
    $('[data-gc-note]').textContent = post
      ? 'Printed on recycled card, in a linen envelope. Posted free in 2–4 working days.'
      : iso(sendDay) === iso(today)
        ? 'Sent by email as soon as you check out.'
        : `Sent by email at 8am on ${sendDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.`;
  }
  form.addEventListener('input', (e) => {
    if (e.target.getAttribute('aria-invalid') === 'true') setError(e.target.id, '');
    render();
  });
  form.addEventListener('change', (e) => {
    if (e.target.name === 'gc-amount') {
      setError('gc-custom', '');
      if (e.target.value === 'custom') { render(); custom.focus(); }
    }
    render();
  });
  custom.addEventListener('blur', () => { const n = amount(); if (n) custom.value = n.toLocaleString('en-US'); });

  // flip between the front and the message side; typing a message shows the back
  const flipBtn = $('[data-gc-flip]');
  const flip = (back) => {
    card.classList.toggle('is-flipped', back);
    flipBtn.setAttribute('aria-pressed', String(back));
    $('[data-gc-flip-label]').textContent = back ? 'See the front' : 'See the message side';
  };
  flipBtn.addEventListener('click', () => flip(!card.classList.contains('is-flipped')));
  ['#gc-to', '#gc-from', '#gc-msg'].forEach((s) => $(s).addEventListener('focus', () => flip(true)));
  $$('input[name="gc-design"], input[name="gc-amount"], #gc-custom').forEach((el) => el.addEventListener('focus', () => flip(false)));

  /* ---------- Add to cart ---------- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const post = checked('gc-type').value === 'post';
    const a = amount();
    const checks = [
      ['gc-custom', checked('gc-amount').value !== 'custom' || (a >= MIN && a <= MAX) ? '' : `Enter an amount from ${money(MIN)} to ${money(MAX)}.`],
      ['gc-to', val('gc-to') ? '' : 'Enter their name, so we can address the card.'],
      ['gc-email', post || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('gc-email')) ? '' : 'Enter their email address, like name@example.com.'],
      ['gc-from', val('gc-from') ? '' : 'Enter your name, so they know who it’s from.'],
    ];
    const bad = checks.filter(([id, text]) => !setError(id, text));
    if (bad.length) { document.getElementById(bad[0][0]).focus(); return; }
    // Replace with a call that adds this gift card (amount, design, recipient, date, message) to your cart.
    window.Morrow?.addToCart(1);
    window.Morrow?.toast(`Added a ${money(a)} gift card for ${val('gc-to')} to your cart`);
    const btn = $('button[type="submit"]', form);
    btn.textContent = 'Added';
    btn.classList.add('is-added');
    setTimeout(() => { btn.textContent = 'Add to cart'; btn.classList.remove('is-added'); }, 1800);
  });

  render();

  /* ---------- Balance checker ---------- */
  const bal = $('[data-gc-bal]');
  const num = $('#gc-number');
  const pin = $('#gc-pin');
  num.addEventListener('input', () => {
    const digits = num.value.replace(/\D/g, '').slice(0, 16);
    num.value = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    if (num.getAttribute('aria-invalid') === 'true') setError('gc-number', '');
  });
  pin.addEventListener('input', () => {
    pin.value = pin.value.replace(/\D/g, '').slice(0, 4);
    if (pin.getAttribute('aria-invalid') === 'true') setError('gc-pin', '');
  });
  bal.addEventListener('submit', (e) => {
    e.preventDefault();
    const digits = num.value.replace(/\D/g, '');
    const okNum = setError('gc-number', digits.length === 16 ? '' : 'Enter the 16-digit card number.');
    const okPin = setError('gc-pin', /^\d{4}$/.test(pin.value) ? '' : 'Enter the 4-digit PIN.');
    if (!okNum || !okPin) { (!okNum ? num : pin).focus(); return; }
    // Demo balance worked out from the number; replace with a request to your gift card provider.
    const cents = [...digits].reduce((s, d, i) => (s * 31 + Number(d) * (i + 7)) % 50000, 0);
    const result = $('[data-gc-bal-result]');
    $('[data-gc-bal-last]').textContent = digits.slice(-4);
    $('[data-gc-bal-amount]').textContent = '$' + (cents / 100 + 25).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    result.hidden = false;
    result.focus();
  });
})();
