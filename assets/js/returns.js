/* Morrow — returns: find order, choose items and reasons, choose collection or drop-off, confirmation.
   Front end only: DEMO_ORDER stands in for your order API; replace lookup() and the final submit. */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const tool = $('.rt-tool');
  if (!tool) return;

  const WINDOW_DAYS = 30;
  const CREDIT_BONUS = 0.1;
  const REASONS = ['Doesn’t fit the space', 'Color or fabric isn’t right', 'Not as comfortable as expected', 'Changed my mind', 'Arrived damaged', 'Other'];

  // demo order, delivered 14 days ago so it's inside the window
  const delivered = new Date();
  delivered.setDate(delivered.getDate() - 14);
  const DEMO_ORDER = {
    items: [
      { id: 'otto', name: 'Otto armchair', meta: 'Rust linen, oak legs', price: 590, qty: 1, furniture: true, sym: 'armchair', color: '#A4583A', leg: '#B08A5E' },
      { id: 'halo', name: 'Halo pendant light', meta: 'Moss', price: 168, qty: 2, furniture: false, sym: 'pendant', color: '#6F7A5E', leg: '#2B2F2A' },
      { id: 'loma', name: 'Loma vase', meta: 'Ochre, 30 cm', price: 65, qty: 1, furniture: false, sym: 'vase', color: '#C28E2E', leg: '#5C3E28' },
      { id: 'cushion', name: 'Linen cushion cover', meta: 'Clay, 50 × 50 cm', price: 45, qty: 1, furniture: false, finalSale: true, sym: 'rug', color: '#B7775A', leg: '#5C3E28' },
    ],
  };

  const money = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const fmtDate = (d, opts = { weekday: 'long', month: 'long', day: 'numeric' }) => d.toLocaleDateString('en-US', opts);
  const setError = (id, msg) => {
    const input = document.getElementById(id);
    const err = document.getElementById(id + '-err');
    input?.setAttribute('aria-invalid', String(!!msg));
    if (err) { err.textContent = msg; err.hidden = !msg; }
    return !msg;
  };

  const panels = $$('[data-rt-panel]');
  const stepItems = $$('[data-rt-steps] li');
  let order = null;

  const show = (n) => {
    panels.forEach((p) => { p.hidden = Number(p.dataset.rtPanel) !== n; });
    $('[data-rt-done]').hidden = true;
    stepItems.forEach((li, i) => {
      li.classList.toggle('is-done', i + 1 < n);
      if (i + 1 === n) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
    });
    const first = $('input:not([type="hidden"]):not(:disabled), select', panels[n - 1]);
    first?.focus({ preventScroll: true });
    tool.scrollIntoView({ block: 'nearest' });
  };
  $$('[data-rt-back]').forEach((b) => b.addEventListener('click', () => show(Number(b.closest('[data-rt-panel]').dataset.rtPanel) - 1)));

  /* ---------- 1: find the order ---------- */
  const lookup = (no) => ({ no, ...DEMO_ORDER }); // replace with a request to your order API
  $('[data-rt-panel="1"]').addEventListener('submit', (e) => {
    e.preventDefault();
    const no = $('#rt-order').value.trim().toUpperCase().replace(/^MR(\d)/, 'MR-$1');
    const okNo = setError('rt-order', /^MR-\d{5}$/.test(no) ? '' : 'Enter your order number, like MR-45502.');
    const okMail = setError('rt-email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('#rt-email').value.trim()) ? '' : 'Enter the email you used to order.');
    if (!okNo || !okMail) { (!okNo ? $('#rt-order') : $('#rt-email')).focus(); return; }
    order = lookup(no);
    renderItems();
    show(2);
  });
  $$('#rt-order, #rt-email').forEach((i) => i.addEventListener('input', () => setError(i.id, '')));

  /* ---------- 2: items ---------- */
  function renderItems() {
    const deadline = new Date(delivered);
    deadline.setDate(deadline.getDate() + WINDOW_DAYS);
    const left = Math.ceil((deadline - new Date()) / 86400000);
    $('[data-rt-order]').textContent = order.no;
    $('[data-rt-delivered]').textContent = fmtDate(delivered, { month: 'long', day: 'numeric' });
    $('[data-rt-window]').textContent = `${left} days left to return, until ${fmtDate(deadline, { month: 'long', day: 'numeric' })}.`;
    $('[data-rt-items]').innerHTML = order.items.map((it) => `
      <li class="rt-item${it.finalSale ? ' is-final' : ''}" data-item="${it.id}">
        <label class="rt-item__pick">
          <input type="checkbox" value="${it.id}"${it.finalSale ? ' disabled' : ''}>
          <span class="check__box" aria-hidden="true"></span>
          <span class="osum__thumb" style="color:${it.color};--leg:${it.leg}">${window.Morrow?.productImg(it.name) || `<svg viewBox="0 0 200 160" aria-hidden="true"><use href="#s-${it.sym}"/></svg>`}</span>
          <span class="rt-item__info"><strong>${it.name}</strong><span>${it.meta}${it.qty > 1 ? `, ${it.qty} × ${money(it.price)}` : ''}</span>${it.finalSale ? '<span class="rt-item__final">Final sale, can’t be returned</span>' : ''}</span>
          <span class="rt-item__price">${money(it.price * it.qty)}</span>
        </label>
        <div class="rt-item__opts" hidden>
          ${it.qty > 1 ? `<div class="field"><label for="qty-${it.id}">How many?</label><select id="qty-${it.id}" data-qty>${Array.from({ length: it.qty }, (_, i) => `<option value="${it.qty - i}">${it.qty - i}</option>`).join('')}</select></div>` : ''}
          <div class="field"><label for="why-${it.id}">Reason</label><select id="why-${it.id}" data-why aria-describedby="why-${it.id}-err"><option value="">Choose a reason</option>${REASONS.map((r) => `<option>${r}</option>`).join('')}</select><p class="field__error" id="why-${it.id}-err" hidden></p></div>
        </div>
      </li>`).join('');
    updateTotals();
  }
  const selected = () => $$('.rt-item', tool).filter((li) => $('input[type="checkbox"]', li).checked).map((li) => {
    const it = order.items.find((x) => x.id === li.dataset.item);
    return { ...it, qty: Number($('[data-qty]', li)?.value || it.qty), reason: $('[data-why]', li).value };
  });
  function updateTotals() {
    const total = selected().reduce((s, it) => s + it.price * it.qty, 0);
    $('[data-rt-card]').textContent = money(total);
    $('[data-rt-credit]').textContent = money(Math.round(total * (1 + CREDIT_BONUS) * 100) / 100);
  }
  $('[data-rt-items]').addEventListener('change', (e) => {
    const li = e.target.closest('.rt-item');
    if (e.target.type === 'checkbox') {
      $('.rt-item__opts', li).hidden = !e.target.checked;
      li.classList.toggle('is-picked', e.target.checked);
      setError('rt-items', '');
    }
    if (e.target.matches('[data-why]')) setError(e.target.id, '');
    updateTotals();
  });
  $('[data-rt-panel="2"]').addEventListener('submit', (e) => {
    e.preventDefault();
    const items = selected();
    if (!items.length) {
      setError('rt-items', 'Tick at least one item to return.');
      $('.rt-item input:not(:disabled)', tool).focus();
      return;
    }
    const missing = items.filter((it) => !setError(`why-${it.id}`, it.reason ? '' : 'Choose a reason. It helps us improve.'));
    if (missing.length) { document.getElementById(`why-${missing[0].id}`).focus(); return; }
    renderMethod(items);
    show(3);
  });

  /* ---------- 3: collection or drop-off ---------- */
  function renderMethod(items) {
    const big = items.filter((it) => it.furniture);
    const small = items.filter((it) => !it.furniture);
    const collect = $('[data-rt-collect]');
    collect.hidden = !big.length;
    $('[data-rt-drop]').hidden = !small.length;
    $('[data-rt-furniture]').textContent = big.map((it) => it.name.toLowerCase()).join(' and ') || '';
    $('[data-rt-small]').textContent = small.map((it) => `${it.qty > 1 ? it.qty + ' × ' : ''}${it.name.toLowerCase()}`).join(' and ');
    if (big.length) {
      const days = [];
      const d = new Date();
      d.setDate(d.getDate() + 2);
      while (days.length < 6) {
        if (d.getDay() !== 0) days.push(new Date(d));
        d.setDate(d.getDate() + 1);
      }
      $('[data-rt-days]').innerHTML = days.map((day) => `<label class="date"><input type="radio" name="rt-day" value="${day.toISOString().slice(0, 10)}" data-label="${fmtDate(day)}"><span><small>${day.toLocaleDateString('en-US', { weekday: 'short' })}</small><strong>${day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</strong></span></label>`).join('');
    }
  }
  $('[data-rt-days]').addEventListener('change', () => setError('rt-day', ''));

  $('[data-rt-panel="3"]').addEventListener('submit', (e) => {
    e.preventDefault();
    const items = selected();
    const big = items.some((it) => it.furniture);
    const day = $('input[name="rt-day"]:checked');
    if (big && !day) {
      setError('rt-day', 'Choose a collection day.');
      $('input[name="rt-day"]').focus();
      return;
    }
    // Replace with a request to your returns API.
    const credit = $('input[name="refund"]:checked').value === 'credit';
    const total = items.reduce((s, it) => s + it.price * it.qty, 0);
    const amount = credit ? Math.round(total * (1 + CREDIT_BONUS) * 100) / 100 : total;
    $('[data-rt-ref]').textContent = 'RT-' + Math.floor(10000 + Math.random() * 90000);
    $('[data-rt-done-list]').innerHTML = items.map((it) => `<li>${it.qty > 1 ? it.qty + ' × ' : ''}${it.name}<span>${it.reason}</span></li>`).join('');
    const parts = [];
    if (big) parts.push(`We’ll collect on ${day.dataset.label}, and text you a two-hour window the day before.`);
    if (items.some((it) => !it.furniture)) {
      parts.push($('input[name="drop"]:checked').value === 'label'
        ? 'Your free UPS label is on its way by email.'
        : 'Bring small items to any showroom with your return number.');
    }
    parts.push(credit
      ? `${money(amount)} in store credit is in your account now.`
      : `${money(amount)} will be refunded to your original payment method within 5 working days of us receiving everything.`);
    $('[data-rt-done-text]').textContent = parts.join(' ');
    panels.forEach((p) => { p.hidden = true; });
    stepItems.forEach((li) => { li.classList.add('is-done'); li.removeAttribute('aria-current'); });
    const done = $('[data-rt-done]');
    done.hidden = false;
    done.focus();
  });

  $('[data-rt-again]').addEventListener('click', () => {
    $$('form', tool).forEach((f) => f.reset());
    order = null;
    show(1);
  });
})();
