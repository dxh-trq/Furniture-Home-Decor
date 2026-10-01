/* Morrow — cookie banner. Shown on a visitor's first visit (on every page except the cookie policy, which has the
   full settings). "Accept all" and "Essential only" are equally easy; "Choose" opens per-category switches, which
   start off. Global Privacy Control keeps advertising off. Choices are saved in the same store as the privacy and
   cookie pages (morrow-privacy-choices). Visitors change them later on the cookie policy page, or call
   window.Morrow.consent.open(), or add a button with data-consent-open anywhere.
   In production, load analytics and advertising tags only after consent: listen for the "morrow:consent" event
   or read window.Morrow.consent.get(). */
(() => {
  const KEY = 'morrow-privacy-choices'; // shared with privacy.js and cookies.js
  const CATS = [
    ['essential', 'Essential', 'Keep you signed in, remember your cart and keep checkout secure.'],
    ['personal', 'Functional', 'Remember recently viewed pieces, your delivery ZIP code and your wishlist.'],
    ['analytics', 'Analytics', 'Count visits and see which pages help, with an anonymous ID.'],
    ['ads', 'Advertising', 'Let partners measure our ads and show you Morrow ads on other sites.'],
  ];
  const gpc = navigator.globalPrivacyControl === true;
  const onCookiePage = !!document.querySelector('[data-ck-rows]');

  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (err) { return null; } };
  const write = (data) => { try { localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch (err) { return false; } };
  const get = () => {
    const s = read();
    if (!s?.savedAt) return null; // no choice made yet: only essential cookies
    return { essential: true, personal: !!s.personal, analytics: !!s.analytics, ads: !!s.ads && !gpc, savedAt: s.savedAt };
  };

  /* ---------- Build the banner ---------- */
  const el = document.createElement('section');
  el.className = 'consent';
  el.setAttribute('aria-labelledby', 'consent-title');
  el.hidden = true;
  el.innerHTML = `
    <div class="consent__main">
      <div class="consent__head">
        <span class="consent__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 9 9 3 3 0 0 1-3.5-3A3 3 0 0 1 14 5.5 3 3 0 0 1 12 3Z"/><circle cx="8.5" cy="10" r="1.2"/><circle cx="10" cy="15.5" r="1.2"/><circle cx="15.5" cy="14.5" r="1.2"/></svg></span>
        <h2 class="consent__title" id="consent-title">Cookies, your call</h2>
      </div>
      <p class="consent__text">We use essential cookies to run the shop: your cart, checkout and sign-in. With your OK we’d also remember what you browse, measure what works and show you our ads elsewhere. <a href="cookies.html">Cookie policy</a></p>
      <div class="consent__actions">
        <button class="btn btn--primary btn--small" type="button" data-consent-accept>Accept all</button>
        <button class="btn btn--primary btn--small" type="button" data-consent-reject>Essential only</button>
        <button class="consent__choose" type="button" aria-expanded="false" aria-controls="consent-prefs" data-consent-choose>Choose</button>
      </div>
    </div>
    <div class="consent__prefs" id="consent-prefs" hidden>
      <ul class="consent__list">
        ${CATS.map(([k, name, desc]) => `
        <li class="consent__row">
          <div>
            <label class="consent__label" for="consent-${k}">${name}${k === 'essential' ? ' <span class="pv-always">Always on</span>' : ''}</label>
            <p class="consent__desc" id="consent-${k}-desc">${desc}</p>
          </div>
          <button class="switch" id="consent-${k}" type="button" role="switch" aria-checked="${k === 'essential'}" aria-describedby="consent-${k}-desc" data-consent-cat="${k}"${k === 'essential' ? ' disabled' : ''}><span class="switch__knob"></span></button>
        </li>`).join('')}
      </ul>
      ${gpc ? '<p class="consent__gpc">Your browser sends a Global Privacy Control signal, so advertising stays off.</p>' : ''}
      <div class="consent__actions">
        <button class="btn btn--primary btn--small" type="button" data-consent-save>Save my choices</button>
        <button class="consent__choose" type="button" data-consent-accept>Accept all</button>
      </div>
    </div>`;
  document.body.append(el);

  const $ = (sel) => el.querySelector(sel);
  const $$ = (sel) => [...el.querySelectorAll(sel)];
  const prefs = $('#consent-prefs');
  const choose = $('[data-consent-choose]');
  const sw = (k) => $(`[data-consent-cat="${k}"]`);
  if (gpc) sw('ads').disabled = true;

  const setPrefsOpen = (open) => {
    prefs.hidden = !open;
    el.classList.toggle('is-open', open);
    choose.setAttribute('aria-expanded', String(open));
    choose.textContent = open ? 'Hide choices' : 'Choose';
  };
  const fill = () => {
    const c = get();
    ['personal', 'analytics', 'ads'].forEach((k) => sw(k).setAttribute('aria-checked', String(!!c?.[k])));
  };

  let opener = null;
  const show = ({ expanded = false, focus = false } = {}) => {
    fill();
    setPrefsOpen(expanded);
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('is-in'));
    if (focus) (expanded ? sw('personal') : $('[data-consent-accept]')).focus();
  };
  const hide = () => {
    const hadFocus = el.contains(document.activeElement);
    el.classList.remove('is-in');
    el.hidden = true;
    if (hadFocus) {
      if (opener && document.contains(opener)) opener.focus();
      else { const main = document.getElementById('main'); if (main) { main.tabIndex = -1; main.focus({ preventScroll: true }); } }
    }
    opener = null;
  };

  const save = (choices, msg) => {
    const data = { ...(read() || {}), ...choices, ads: choices.ads && !gpc, savedAt: Date.now() };
    const ok = write(data);
    hide();
    window.dispatchEvent(new CustomEvent('morrow:consent', { detail: get() || { essential: true, ...choices } }));
    window.Morrow?.toast?.(ok ? msg : `${msg} for this visit`);
  };

  $$('[data-consent-accept]').forEach((b) => b.addEventListener('click', () => save({ personal: true, analytics: true, ads: true }, gpc ? 'Cookies allowed, except advertising' : 'All cookies allowed')));
  $('[data-consent-reject]').addEventListener('click', () => save({ personal: false, analytics: false, ads: false }, 'Only essential cookies will be used'));
  $('[data-consent-save]').addEventListener('click', () => {
    const c = Object.fromEntries(['personal', 'analytics', 'ads'].map((k) => [k, sw(k).getAttribute('aria-checked') === 'true']));
    save(c, 'Your cookie choices are saved');
  });
  choose.addEventListener('click', () => {
    const open = prefs.hidden;
    setPrefsOpen(open);
    if (open) sw('personal').focus();
  });
  $$('[data-consent-cat]').forEach((b) => b.addEventListener('click', () => {
    if (!b.disabled) b.setAttribute('aria-checked', String(b.getAttribute('aria-checked') !== 'true'));
  }));
  // Escape closes the banner only when it was reopened (a first-time choice is still needed)
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && get()) { e.preventDefault(); hide(); }
  });

  /* ---------- Reopen from any [data-consent-open] button ---------- */
  document.querySelectorAll('[data-consent-open]').forEach((b) => b.addEventListener('click', () => {
    if (onCookiePage) {
      const panel = document.querySelector('.pv-choices__panel');
      panel?.scrollIntoView({ block: 'center' });
      panel?.querySelector('.switch:not(:disabled)')?.focus({ preventScroll: true });
      return;
    }
    opener = b;
    show({ expanded: true, focus: true });
  }));

  // keep other tabs (and the cookie page's own settings) in step
  window.addEventListener('storage', (e) => { if (e.key === KEY && get() && !el.hidden && !el.classList.contains('is-open')) hide(); });

  window.Morrow = Object.assign(window.Morrow || {}, { consent: { get, open: () => show({ expanded: true, focus: true }) } });

  if (!get() && !onCookiePage) setTimeout(() => show(), 600);
})();
