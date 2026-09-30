/* Morrow — checkout: three steps, inline validation, delivery dates, card formatting, confirmation.
   This is front-end only. Send the form data to your payment provider / order API in placeOrder(). */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // display preferences from the accessibility page (checkout doesn't load main.js)
  try {
    const d = JSON.parse(localStorage.getItem('morrow-display')) || {};
    const root = document.documentElement;
    root.classList.toggle('pref-text-112', d.size === '112');
    root.classList.toggle('pref-text-125', d.size === '125');
    ['contrast', 'links', 'spacing', 'motion'].forEach((k) => root.classList.toggle(`pref-${k}`, !!d[k]));
  } catch (err) { /* storage unavailable */ }

  const flow = $('[data-flow]');
  if (!flow) return;

  const SUBTOTAL = 2620;
  const WHITE_GLOVE = 79;
  const EVENING = 25;
  const TAX = { NY: 0.08875, CA: 0.0725, TX: 0.0625, IL: 0.0625, WA: 0.065, OR: 0 }; // demo rates
  const DEFAULT_TAX = 0.06;

  const money = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const setText = (sel, text) => $$(sel).forEach((el) => { el.textContent = text; });
  const val = (name) => (document.getElementsByName(name)[0]?.value || '').trim();
  const radio = (name) => $(`input[name="${name}"]:checked`);
  const fmtDay = (d) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  /* ---------- Toast ---------- */
  const toastEl = $('.toast');
  let toastTimer;
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, 3000);
  };

  /* ---------- Totals ---------- */
  const totals = () => {
    let shipping = 0;
    if (radio('service')?.value === 'whiteglove') shipping += WHITE_GLOVE;
    if (radio('slot')?.value === '5pm–8pm') shipping += EVENING;
    const state = val('state');
    const zipOk = /^\d{5}$/.test(val('zip'));
    const rate = state in TAX ? TAX[state] : DEFAULT_TAX;
    const tax = state && zipOk ? Math.round((SUBTOTAL + shipping) * rate * 100) / 100 : 0;
    const total = SUBTOTAL + shipping + tax;

    setText('[data-co-shipping]', shipping ? money(shipping) : 'Free');
    const taxEl = $('[data-co-tax]');
    taxEl.textContent = state && zipOk ? money(tax) : 'Added after address';
    taxEl.classList.toggle('summary__muted', !(state && zipOk));
    setText('[data-total]', money(total));
    setText('[data-finance]', money(Math.round((total / 4) * 100) / 100));
    return total;
  };

  /* ---------- Validation ---------- */
  const luhn = (num) => {
    let sum = 0;
    let dbl = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let d = Number(num[i]);
      if (dbl) { d *= 2; if (d > 9) d -= 9; }
      sum += d;
      dbl = !dbl;
    }
    return sum % 10 === 0;
  };
  const brandOf = (digits) => {
    if (/^3[47]/.test(digits)) return 'Amex';
    if (/^4/.test(digits)) return 'Visa';
    if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
    return '';
  };

  const rules = {
    email: (v) => (!v ? 'Enter your email address.' : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter an email address like name@example.com.'),
    first: (v) => (v ? '' : 'Enter your first name.'),
    last: (v) => (v ? '' : 'Enter your last name.'),
    address1: (v) => (v ? '' : 'Enter your street address.'),
    city: (v) => (v ? '' : 'Enter your city.'),
    state: (v) => (v ? '' : 'Select your state.'),
    zip: (v) => (/^\d{5}$/.test(v) ? '' : 'Enter a 5-digit ZIP code.'),
    phone: (v) => {
      const d = v.replace(/\D/g, '');
      return d.length === 10 || (d.length === 11 && d[0] === '1') ? '' : 'Enter a 10-digit phone number so the delivery team can reach you.';
    },
    ccnum: (v) => {
      const d = v.replace(/\D/g, '');
      if (!d) return 'Enter your card number.';
      const len = brandOf(d) === 'Amex' ? 15 : 16;
      return d.length < 13 || d.length > 19 || (brandOf(d) && d.length !== len) || !luhn(d)
        ? 'Check your card number. It looks incomplete or mistyped.' : '';
    },
    ccexp: (v) => {
      const m = v.replace(/\s/g, '').match(/^(\d{2})\/(\d{2})$/);
      if (!m) return 'Enter the expiry date as MM / YY.';
      const month = Number(m[1]);
      const year = 2000 + Number(m[2]);
      if (month < 1 || month > 12) return 'Enter a month from 01 to 12.';
      const now = new Date();
      if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) return 'This card has expired. Use a different card.';
      return '';
    },
    cccvc: (v) => {
      const amex = brandOf(val('ccnum').replace(/\D/g, '')) === 'Amex';
      return new RegExp(`^\\d{${amex ? 4 : 3}}$`).test(v) ? '' : `Enter the ${amex ? '4' : '3'}-digit security code.`;
    },
    ccname: (v) => (v ? '' : 'Enter the name as it appears on the card.'),
    baddress: (v) => (v ? '' : 'Enter your billing street address.'),
    bzip: (v) => (/^\d{5}$/.test(v) ? '' : 'Enter a 5-digit billing ZIP code.'),
  };

  const showError = (id, msg) => {
    const input = document.getElementById(id);
    const err = document.getElementById(id + '-err');
    if (!input || !err) return;
    input.setAttribute('aria-invalid', String(!!msg));
    err.textContent = msg;
    err.hidden = !msg;
  };
  const check = (id) => {
    const msg = rules[id](val(id));
    showError(id, msg);
    return !msg;
  };

  // re-check a field once it has been marked invalid, so errors clear as people fix them
  document.addEventListener('input', (e) => {
    const id = e.target.id;
    if (rules[id] && e.target.getAttribute('aria-invalid') === 'true') check(id);
  });
  document.addEventListener('focusout', (e) => {
    const id = e.target.id;
    if (rules[id] && e.target.value.trim()) check(id);
  });

  const fieldsFor = {
    1: () => ['email', 'first', 'last', 'address1', 'city', 'state', 'zip', 'phone'],
    2: () => [],
    3: () => {
      const f = radio('method').value === 'card' ? ['ccnum', 'ccexp', 'cccvc', 'ccname'] : [];
      if (!$('[data-billing-same]').checked) f.push('baddress', 'bzip');
      return f;
    },
  };
  const validateStep = (n) => {
    const bad = fieldsFor[n]().filter((id) => !check(id));
    if (n === 2 && !radio('date')) {
      const err = $('#date-err');
      err.textContent = 'Choose a delivery day.';
      err.hidden = false;
      bad.push('date');
    }
    if (bad.length) {
      const first = bad[0] === 'date' ? $('input[name="date"]') : document.getElementById(bad[0]);
      first?.focus();
    }
    return bad.length === 0;
  };

  /* ---------- Steps ---------- */
  const steps = $$('.co-step');
  const stepEl = (n) => $(`.co-step[data-step="${n}"]`);
  const progress = $$('[data-steps] li');

  const setProgress = (idx) => {
    progress.forEach((li, i) => {
      li.classList.toggle('is-done', i < idx);
      if (i === idx) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
    });
  };

  const summaries = {
    1: () => {
      const address = [val('address1'), val('address2'), val('city'), `${val('state')} ${val('zip')}`].filter(Boolean).join(', ');
      const access = [val('home'), val('floor').toLowerCase(),
        $('input[name="elevator"]').checked ? 'elevator' : '',
        $('input[name="narrow"]').checked ? 'narrow doorways' : ''].filter(Boolean).join(', ');
      return `<p><strong>${esc(val('first'))} ${esc(val('last'))}</strong></p>
        <p>${esc(val('email'))}, ${esc(val('phone'))}</p>
        <p>${esc(address)}</p>
        <p class="co-step__muted">${esc(access)}</p>`;
    },
    2: () => {
      const date = radio('date');
      const service = radio('service').value === 'whiteglove' ? 'White glove' : 'Room of choice';
      return `<p><strong>${service}</strong></p><p>Delivery 1: ${esc(date.dataset.label)}, ${esc(radio('slot').value)}</p><p>Delivery 2: week of ${esc(laterWeek)}, we’ll call to book</p>`;
    },
  };
  function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  const open = (n) => {
    steps.forEach((s) => {
      const k = Number(s.dataset.step);
      const form = $(`[data-form="${k}"]`, s);
      const summary = $(`[data-summary="${k}"]`, s);
      const edit = $(`[data-edit="${k}"]`, s);
      const active = k === n;
      s.classList.toggle('is-active', active);
      s.classList.toggle('is-locked', !active && !s.classList.contains('is-done'));
      form.hidden = !active;
      if (summary) summary.hidden = active || !s.classList.contains('is-done');
      if (edit) edit.hidden = active || !s.classList.contains('is-done');
    });
    setProgress(n === 3 ? 2 : 1);
    const title = $('.co-step__title', stepEl(n));
    title.setAttribute('tabindex', '-1');
    title.focus({ preventScroll: true });
    stepEl(n).scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };

  const complete = (n) => {
    const s = stepEl(n);
    s.classList.add('is-done');
    $(`[data-summary="${n}"]`, s).innerHTML = summaries[n]();
    // go to the first step after n that isn't done yet (payment is never "done")
    const next = [2, 3].find((k) => k > n && !stepEl(k).classList.contains('is-done')) || 3;
    open(next);
  };

  $$('[data-form]').forEach((form) => {
    const n = Number(form.dataset.form);
    if (n === 3) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (validateStep(n)) complete(n);
    });
  });
  $$('[data-edit]').forEach((btn) => btn.addEventListener('click', () => open(Number(btn.dataset.edit))));

  /* ---------- Delivery dates ---------- */
  const today = new Date();
  const dates = [];
  const d = new Date(today);
  d.setDate(d.getDate() + 8); // in-stock: earliest 8 days out
  while (dates.length < 8) {
    if (d.getDay() !== 0) dates.push(new Date(d)); // no Sunday deliveries
    d.setDate(d.getDate() + 1);
  }
  $('[data-dates]').innerHTML = dates.map((day, i) => {
    const iso = day.toISOString().slice(0, 10);
    const label = fmtDay(day);
    const [wd, rest] = [day.toLocaleDateString('en-US', { weekday: 'short' }), day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })];
    return `<label class="date"><input type="radio" name="date" value="${iso}" data-label="${label}"${i === 0 ? ' checked' : ''}><span><small>${wd}</small><strong>${rest}</strong>${i === 0 ? '<em>Earliest</em>' : ''}</span></label>`;
  }).join('');
  $('[data-dates]').addEventListener('change', () => { $('#date-err').hidden = true; });

  const later = new Date(today);
  later.setDate(later.getDate() + 49);
  later.setDate(later.getDate() - ((later.getDay() + 6) % 7)); // Monday of that week
  const laterWeek = later.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  setText('[data-later-week]', laterWeek);

  /* ---------- Card formatting ---------- */
  const ccnum = $('#ccnum');
  ccnum.addEventListener('input', () => {
    const digits = ccnum.value.replace(/\D/g, '').slice(0, 19);
    const brand = brandOf(digits);
    const groups = brand === 'Amex' ? [4, 6, 5] : [4, 4, 4, 4, 3];
    let out = '';
    let i = 0;
    for (const g of groups) {
      if (i >= digits.length) break;
      out += (out ? ' ' : '') + digits.slice(i, i + g);
      i += g;
    }
    ccnum.value = out;
    $('[data-brand]').textContent = brand;
  });
  const ccexp = $('#ccexp');
  ccexp.addEventListener('input', (e) => {
    let digits = ccexp.value.replace(/\D/g, '').slice(0, 4);
    if (digits.length === 1 && Number(digits) > 1) digits = '0' + digits; // "4" → "04"
    ccexp.value = digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits;
    if (e.inputType === 'deleteContentBackward' && digits.length === 2) ccexp.value = digits;
  });

  /* ---------- Payment method + billing ---------- */
  const syncPay = () => {
    const card = radio('method').value === 'card';
    $('[data-panel="card"]').hidden = !card;
    $$('.pay-opt').forEach((o) => o.classList.toggle('is-checked', $('input', o).checked));
  };
  $$('input[name="method"]').forEach((r) => r.addEventListener('change', syncPay));
  $('[data-billing-same]').addEventListener('change', (e) => { $('[data-billing]').hidden = e.target.checked; });

  document.addEventListener('change', (e) => {
    if (['service', 'slot', 'state'].includes(e.target.name)) totals();
  });
  $('#zip').addEventListener('input', totals);

  /* ---------- Express buttons ---------- */
  $$('[data-express]').forEach((b) => b.addEventListener('click', () => {
    toast(`${b.dataset.express} opens here once you connect a payment provider.`);
  }));

  /* ---------- Place order ---------- */
  const placeBtn = $('[data-place]');
  const placeForm = $('[data-form="3"]');
  placeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const incomplete = [1, 2].find((k) => !stepEl(k).classList.contains('is-done'));
    if (incomplete) { open(incomplete); return; }
    if (!validateStep(3)) return;
    placeOrder();
  });

  function placeOrder() {
    placeBtn.disabled = true;
    placeBtn.classList.add('is-loading');
    const label = placeBtn.innerHTML;
    placeBtn.textContent = 'Placing order…';
    // Replace this timeout with your payment + order API call.
    setTimeout(() => {
      placeBtn.innerHTML = label;
      placeBtn.disabled = false;
      placeBtn.classList.remove('is-loading');
      showConfirmation();
    }, 1200);
  }

  function showConfirmation() {
    const orderNo = 'MR-' + String(Math.floor(10000 + Math.random() * 90000));
    setText('[data-order-no]', orderNo);
    setText('[data-confirm-name]', val('first'));
    setText('[data-confirm-email]', val('email'));
    setText('[data-confirm-when]', `${radio('date').dataset.label}, ${radio('slot').value}`);
    setText('[data-confirm-address]', `${val('address1')}, ${val('city')}, ${val('state')} ${val('zip')}`);
    setText('[data-confirm-service]', radio('service').value === 'whiteglove' ? 'White glove delivery' : 'Room of choice delivery');
    flow.hidden = true;
    const confirm = $('[data-confirm]');
    confirm.hidden = false;
    $('.checkout').classList.add('is-confirmed');
    setProgress(3);
    $$('[data-steps] li').forEach((li) => li.classList.add('is-done'));
    document.title = `Order ${orderNo} confirmed — Morrow`;
    window.scrollTo({ top: 0 });
    confirm.focus();
  }

  /* ---------- Mobile summary toggle ---------- */
  const toggle = $('[data-osum-toggle]');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    $('.osum').classList.toggle('is-open', open);
    $('span', toggle).textContent = open ? 'Hide order summary' : 'Show order summary';
  });

  syncPay();
  totals();
})();
