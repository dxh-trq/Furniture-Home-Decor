/* Morrow — account: section navigation, sign in / out, wishlist, addresses, preferences, forms.
   Front end only: wire the forms to your auth and customer APIs. */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const account = $('[data-account]');
  if (!account) return;

  const auth = $('[data-auth]');
  const toast = (msg) => window.Morrow?.toast(msg);
  const panels = $$('[data-panel]');
  const titles = { overview: 'Your account', orders: 'Orders', wishlist: 'Wishlist', swatches: 'Swatches', addresses: 'Addresses', payment: 'Payment methods', settings: 'Settings' };

  /* ---------- Section navigation (hash based, so sections can be linked to) ---------- */
  const show = (name, focus = false) => {
    if (!titles[name]) name = 'overview';
    panels.forEach((p) => { p.hidden = p.dataset.panel !== name; });
    $$('[data-nav]').forEach((a) => {
      if (a.dataset.nav === name) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    document.title = `${titles[name]} — Morrow`;
    if (focus) {
      const h = $(`[data-panel="${name}"] .acc-panel__title`);
      h.setAttribute('tabindex', '-1');
      h.focus({ preventScroll: true });
      if (window.matchMedia('(max-width: 900px)').matches) h.scrollIntoView({ block: 'start' });
    }
  };
  window.addEventListener('hashchange', () => {
    const name = location.hash.slice(1);
    if (name === 'sign-in') return setSignedIn(false);
    if (titles[name]) show(name, true);
  });

  /* ---------- Sign in / out ---------- */
  function setSignedIn(on) {
    auth.hidden = on;
    account.hidden = !on;
    if (on) {
      show(location.hash.slice(1));
    } else {
      document.title = 'Sign in — Morrow';
      $('#auth-title').setAttribute('tabindex', '-1');
      $('#auth-title').focus();
    }
  }
  $('[data-signout]').addEventListener('click', () => {
    history.replaceState(null, '', '#sign-in');
    setSignedIn(false);
    toast('You’ve signed out.');
  });

  /* ---------- Form validation helpers ---------- */
  const rules = {
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter an email address like name@example.com.'),
    required: (label) => (v) => (v ? '' : `Enter ${label}.`),
    password: (v) => (v.length >= 8 ? '' : 'Use at least 8 characters.'),
    zip: (v) => (/^\d{5}$/.test(v) ? '' : 'Enter a 5-digit ZIP code.'),
  };
  const setError = (input, msg) => {
    const err = document.getElementById(input.id + '-err');
    input.setAttribute('aria-invalid', String(!!msg));
    if (err) { err.textContent = msg; err.hidden = !msg; }
    return !msg;
  };
  const validate = (checks) => {
    const results = checks.map(([id, rule]) => setError(document.getElementById(id), rule(document.getElementById(id).value.trim())));
    const firstBad = checks.find((_, i) => !results[i]);
    if (firstBad) document.getElementById(firstBad[0]).focus();
    return !firstBad;
  };
  document.addEventListener('input', (e) => {
    if (e.target.getAttribute('aria-invalid') === 'true') setError(e.target, '');
  });

  $('[data-signin]').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate([['si-email', rules.email], ['si-password', rules.required('your password')]])) return;
    history.replaceState(null, '', '#overview');
    setSignedIn(true);
    toast('Welcome back.');
  });
  $('[data-register]').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate([['re-name', rules.required('your first name')], ['re-email', rules.email], ['re-password', rules.password]])) return;
    const name = $('#re-name').value.trim();
    updateName(name, '');
    history.replaceState(null, '', '#overview');
    setSignedIn(true);
    toast(`Account created. Welcome, ${name}.`);
  });
  $('[data-forgot]').addEventListener('click', (e) => {
    e.preventDefault();
    const email = $('#si-email').value.trim();
    if (!rules.email(email)) toast(`We’ve sent a reset link to ${email}.`);
    else { setError($('#si-email'), 'Enter your email first, then we’ll send a reset link.'); $('#si-email').focus(); }
  });

  /* ---------- Overview ---------- */
  $('[data-reschedule]').addEventListener('click', () => toast('We’ll text you a link to pick a new day for delivery 1.'));

  /* ---------- Orders ---------- */
  account.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.buyAgain) {
      window.Morrow?.addToCart(Number(t.dataset.qty) || 1);
      toast(`Added ${t.dataset.buyAgain} to your cart`);
    }
    if (t.dataset.invoice) toast(`Invoice for ${t.dataset.invoice} downloaded.`);
    if (t.dataset.return) toast(`Return started for ${t.dataset.return}. We’ll email a collection date.`);
  });

  /* ---------- Wishlist ---------- */
  const wishGrid = $('[data-wish-grid]');
  const syncWish = () => {
    const n = $$('.card', wishGrid).length;
    $$('[data-wish-count]').forEach((el) => { el.textContent = n; });
    $('[data-wish-empty]').hidden = n > 0;
    wishGrid.hidden = n === 0;
  };
  wishGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-wish-remove]');
    if (!btn) return;
    // main.js toggles the heart and shows the toast; remove the card on the next tick
    setTimeout(() => {
      const card = btn.closest('.card');
      const next = card.nextElementSibling || card.previousElementSibling;
      card.remove();
      syncWish();
      (next?.querySelector('.card__name a') || $('[data-wish-empty] a'))?.focus();
    });
  });

  /* ---------- Addresses ---------- */
  const addrList = $('[data-addr-list]');
  const syncAddr = () => {
    $$('[data-address-count]').forEach((el) => { el.textContent = $$('.addr', addrList).length; });
  };
  addrList.addEventListener('click', (e) => {
    const addr = e.target.closest('.addr');
    if (!addr) return;
    if (e.target.closest('[data-addr-default]')) {
      $$('.addr', addrList).forEach((a) => a.classList.toggle('is-default', a === addr));
      addrList.prepend(addr);
      toast(`${$('.addr__name', addr).textContent} is now your default address.`);
      $('[data-addr-default]', addr).focus();
    }
    if (e.target.closest('[data-addr-remove]')) {
      if (addr.classList.contains('is-default') && $$('.addr', addrList).length > 1) {
        toast('Choose another default address before removing this one.');
        return;
      }
      const name = $('.addr__name', addr).textContent;
      addr.remove();
      syncAddr();
      toast(`Removed ${name}.`);
    }
  });
  $('[data-addr-form]').addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = validate([['an-label', rules.required('a label')], ['an-street', rules.required('a street address')],
      ['an-city', rules.required('a city')], ['an-zip', rules.zip]]);
    if (!ok) return;
    const tpl = $('.addr', addrList) ? $('.addr', addrList).cloneNode(true) : null;
    if (!tpl) return;
    tpl.classList.remove('is-default');
    $('.addr__name', tpl).textContent = $('#an-label').value.trim();
    const p = $('.addr__name', tpl).nextElementSibling;
    p.textContent = '';
    [$('[data-user-name]').textContent, $('#an-street').value.trim(), `${$('#an-city').value.trim()} ${$('#an-zip').value.trim()}`]
      .forEach((line, i) => { if (i) p.appendChild(document.createElement('br')); p.appendChild(document.createTextNode(line)); });
    $('.addr__access', tpl).textContent = 'Add access details at your next checkout';
    addrList.appendChild(tpl);
    e.target.reset();
    $('[data-addr-new]').open = false;
    syncAddr();
    toast('Address saved.');
  });

  /* ---------- Payment ---------- */
  $$('[data-card-remove]').forEach((b) => b.addEventListener('click', () => {
    const card = b.closest('.paycard');
    toast(`Removed ${$('.paycard__no', card).textContent.toLowerCase()}.`);
    card.remove();
  }));

  /* ---------- Settings ---------- */
  function updateName(first, last) {
    $$('[data-first-name]').forEach((el) => { el.textContent = first; });
    $('[data-user-name]').textContent = `${first} ${last}`.trim();
    $('[data-initial]').textContent = first.charAt(0).toUpperCase();
    $('#pf-first').value = first;
    $('#pf-last').value = last;
  }
  $('[data-profile]').addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = validate([['pf-first', rules.required('your first name')], ['pf-last', rules.required('your last name')],
      ['pf-email', rules.email], ['pf-phone', (v) => (v.replace(/\D/g, '').length >= 10 ? '' : 'Enter a 10-digit phone number.')]]);
    if (!ok) return;
    updateName($('#pf-first').value.trim(), $('#pf-last').value.trim());
    toast('Profile saved.');
  });
  $('[data-password]').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate([['pw-current', rules.required('your current password')], ['pw-new', rules.password]])) return;
    e.target.reset();
    toast('Password updated.');
  });
  $$('.switch').forEach((s) => s.addEventListener('click', () => {
    const on = s.getAttribute('aria-checked') !== 'true';
    s.setAttribute('aria-checked', String(on));
    const label = $(`label[for="${s.id}"]`).textContent;
    toast(`${label}: ${on ? 'on' : 'off'}`);
  }));
  $('[data-delete]').addEventListener('click', () => toast('We’ve emailed you a link to confirm deleting your account.'));

  /* ---------- Start ---------- */
  setSignedIn(location.hash !== '#sign-in');
  syncWish();
  syncAddr();
})();
