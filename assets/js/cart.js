/* Morrow — cart page: quantities, remove + undo, save for later, delivery, promo codes, totals */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const cart = $('[data-cart]');
  if (!cart) return;

  const FREE_OVER = 500;
  const STANDARD = 49;
  const WHITE_GLOVE = 79;
  // demo codes; replace with a server check in production
  const PROMOS = { WELCOME10: { rate: 0.1, label: '10% off your first order' } };

  const groups = $('[data-cart-groups]');
  const savedList = $('[data-saved-list]');
  const lineTemplate = $('.line', cart).cloneNode(true); // used to build lines for suggested products
  let promo = null;

  const money = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const setText = (sel, text) => $$(sel).forEach((el) => { el.textContent = text; });
  const cartLines = () => $$('.line', groups);
  const qtyOf = (line) => Math.min(10, Math.max(1, parseInt($('input', line).value, 10) || 1));

  /* ---------- Totals ---------- */
  const render = () => {
    const lines = cartLines();
    let items = 0;
    let subtotal = 0;
    lines.forEach((line) => {
      const qty = qtyOf(line);
      const price = Number(line.dataset.price);
      $('input', line).value = qty;
      $('.line__total', line).textContent = money(price * qty);
      const each = $('.line__each', line);
      each.textContent = `${money(price)} each`;
      each.hidden = qty < 2;
      $('[data-step="-1"]', line).disabled = qty <= 1;
      $('[data-step="1"]', line).disabled = qty >= 10;
      items += qty;
      subtotal += price * qty;
    });

    // delivery groups: hide empty ones, renumber the rest
    // (a group holding only an "Undo" note stays visible so the note can be used)
    const visible = $$('.dgroup', groups).filter((g) => {
      const has = $$('.line, .line-removed', g).length > 0;
      g.hidden = !has;
      return has;
    });
    visible.forEach((g, i) => {
      $('[data-group-title]', g).textContent = visible.length > 1 ? `Delivery ${i + 1} of ${visible.length}` : 'Delivery';
    });

    // delivery cost
    const standard = subtotal >= FREE_OVER ? 0 : STANDARD;
    const whiteGlove = $('input[name="shipping"]:checked').value === 'whiteglove';
    const shipping = items ? standard + (whiteGlove ? WHITE_GLOVE : 0) : 0;
    setText('[data-standard-price]', standard ? money(STANDARD) : 'Free');
    setText('[data-shipping]', shipping ? money(shipping) : 'Free');

    // promo
    const discount = promo ? Math.round(subtotal * promo.rate * 100) / 100 : 0;
    $('[data-discount-row]').hidden = !discount;
    setText('[data-discount]', '−' + money(discount));

    const total = subtotal - discount + shipping;
    setText('[data-item-count]', items);
    setText('[data-item-word]', items === 1 ? 'item' : 'items');
    setText('[data-subtotal]', money(subtotal));
    setText('[data-total]', money(total));
    setText('[data-finance]', money(Math.round((total / 4) * 100) / 100));

    // free delivery meter
    const left = FREE_OVER - subtotal;
    $('[data-ship-msg]').textContent = left > 0
      ? `Add ${money(left)} more for free delivery.`
      : 'Your order qualifies for free delivery.';
    $('[data-ship-bar]').style.width = Math.min(100, (subtotal / FREE_OVER) * 100) + '%';
    $('[data-ship-meter]').classList.toggle('is-free', left <= 0);

    // empty state
    const empty = items === 0;
    $('[data-cart-empty]').hidden = !empty;
    $('[data-ship-meter]').hidden = empty;
    $('.summary').classList.toggle('is-disabled', empty);
    $$('[data-checkout], .checkout-bar .btn').forEach((b) => {
      b.setAttribute('aria-disabled', String(empty));
      b.tabIndex = empty ? -1 : 0;
    });
    $('[data-checkout-bar]').hidden = empty;

    // saved list
    const saved = $$('.line', savedList).length;
    $('[data-saved-section]').hidden = $$('.line, .line-removed', savedList).length === 0;
    setText('[data-saved-count]', `(${saved})`);

    window.Morrow?.setCartCount(items);
  };

  /* ---------- Line actions (event delegation) ---------- */
  const groupFor = (line) => $(`.dgroup[data-group="${line.dataset.stock}"] .lines`, groups);
  const nameOf = (line) => $('.line__name', line).textContent.trim();

  cart.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const line = btn.closest('.line');

    if (btn.dataset.step && line) {
      $('input', line).value = qtyOf(line) + Number(btn.dataset.step);
      render();
    }

    if ('remove' in btn.dataset && line) {
      $$('.line-removed', cart).forEach((n) => n.remove()); // one undo at a time
      const note = document.createElement('li');
      note.className = 'line-removed';
      note.innerHTML = '<p></p><button type="button" class="line__action">Undo</button>';
      note.firstChild.textContent = `Removed ${nameOf(line)}.`;
      line.replaceWith(note);
      const undo = note.lastChild;
      undo.addEventListener('click', () => {
        note.replaceWith(line);
        render();
        $('.line__name a', line).focus();
      });
      undo.focus();
      render();
    }

    if ('save' in btn.dataset && line) {
      savedList.prepend(line);
      render();
      window.Morrow?.toast(`Saved ${nameOf(line)} for later`);
      $('[data-move]', line).focus();
    }

    if ('move' in btn.dataset && line) {
      groupFor(line).append(line);
      render();
      window.Morrow?.toast(`Moved ${nameOf(line)} to your cart`);
      $('[data-save]', line).focus();
    }
  });

  cart.addEventListener('change', (e) => {
    if (e.target.matches('.line input, input[name="shipping"]')) render();
  });

  /* ---------- Promo code ---------- */
  const promoForm = $('[data-promo-form]');
  const promoMsg = $('[data-promo-msg]');
  promoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('input', promoForm);
    const code = input.value.trim().toUpperCase();
    if (!code) {
      promoMsg.className = 'promo__msg is-error';
      promoMsg.textContent = 'Enter a promo code.';
      return;
    }
    if (!PROMOS[code]) {
      input.setAttribute('aria-invalid', 'true');
      promoMsg.className = 'promo__msg is-error';
      promoMsg.textContent = `${code} isn’t a valid code, or it has expired.`;
      return;
    }
    input.removeAttribute('aria-invalid');
    promo = PROMOS[code];
    setText('[data-discount-code]', `(${code})`);
    promoMsg.className = 'promo__msg is-success';
    promoMsg.textContent = `Applied: ${promo.label}.`;
    input.value = '';
    render();
  });

  /* ---------- Checkout links do nothing while the cart is empty ---------- */
  $$('[data-checkout], .checkout-bar .btn').forEach((a) => a.addEventListener('click', (e) => {
    if (a.getAttribute('aria-disabled') === 'true') e.preventDefault();
  }));

  /* ---------- Suggestions add a real line to the cart ---------- */
  $$('[data-suggestions] [data-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.card');
      const name = $('.card__name', card).textContent.trim();
      const swatch = $('.swatches [aria-checked="true"]', card);
      const colour = swatch?.getAttribute('aria-label') || '';
      const id = (name + '-' + colour).toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const existing = $(`.line[data-id="${id}"]`, groups);
      if (existing) {
        $('input', existing).value = qtyOf(existing) + 1;
      } else {
        const line = lineTemplate.cloneNode(true);
        const priceText = ($('.price__now', card) || $('.price', card)).textContent;
        line.dataset.id = id;
        line.dataset.price = priceText.replace(/[^0-9.]/g, '');
        line.dataset.stock = 'in';
        const media = $('.card__media', card);
        const lineMedia = $('.line__media', line);
        lineMedia.style.color = media.style.color;
        lineMedia.style.setProperty('--leg', card.style.getPropertyValue('--leg'));
        $('use', lineMedia).setAttribute('href', $('use', media).getAttribute('href'));
        $('.line__name a', line).textContent = name;
        $('.line__opts', line).innerHTML = '';
        if (colour) {
          const div = document.createElement('div');
          div.innerHTML = '<dt>Colour</dt><dd></dd>';
          div.lastChild.textContent = colour;
          $('.line__opts', line).appendChild(div);
        }
        $('input', line).value = 1;
        $('input', line).setAttribute('aria-label', `Quantity of ${name}`);
        $('[data-step="-1"]', line).setAttribute('aria-label', `Decrease quantity of ${name}`);
        $('[data-step="1"]', line).setAttribute('aria-label', `Increase quantity of ${name}`);
        $('.dgroup[data-group="in"] .lines', groups).append(line);
      }
      // main.js already bumped the count and showed a toast; re-sync the real total
      render();
    });
  });

  render();
})();
