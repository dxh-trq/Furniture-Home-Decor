/* Morrow — cookie policy: cookie settings (shared with the privacy page's choices), a filterable cookie table,
   and a live list of what the site has stored on this device. Apply the saved choices to your tags in production. */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const panel = $('.pv-choices__panel');
  if (!panel || !$('[data-ck-rows]')) return;

  const KEY = 'morrow-privacy-choices'; // same store as privacy.js
  const DEFAULTS = { personal: true, analytics: true, ads: false };
  const switches = $$('[data-choice]', panel);
  const saved = $('[data-pv-saved]');
  const gpc = navigator.globalPrivacyControl === true;
  const toast = (msg) => window.Morrow?.toast(msg);
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (err) { return null; } };
  const set = (sw, on) => sw.setAttribute('aria-checked', String(on));

  /* ---------- Settings ---------- */
  const load = () => {
    const stored = read() || {};
    switches.forEach((sw) => {
      if (sw.dataset.choice === 'essential') return;
      set(sw, sw.dataset.choice in stored ? !!stored[sw.dataset.choice] : DEFAULTS[sw.dataset.choice]);
    });
    if (gpc) set($('[data-choice="ads"]', panel), false);
    saved.textContent = stored.savedAt ? `Last saved ${new Date(stored.savedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.` : '';
  };
  if (gpc) {
    $('[data-choice="ads"]', panel).disabled = true;
    $('[data-pv-gpc]').hidden = false;
  }
  load();

  switches.forEach((sw) => sw.addEventListener('click', () => {
    if (sw.disabled) return;
    set(sw, sw.getAttribute('aria-checked') !== 'true');
    saved.textContent = 'You have unsaved changes.';
  }));
  const save = (msg) => {
    // keep the privacy page's other choices (like marketing emails) as they are
    const data = { ...(read() || {}), savedAt: Date.now() };
    switches.forEach((sw) => { data[sw.dataset.choice] = sw.getAttribute('aria-checked') === 'true'; });
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (err) { /* storage unavailable */ }
    saved.textContent = 'Saved. Your settings apply straight away.';
    toast(msg);
    renderDevice();
  };
  $('[data-ck-save]').addEventListener('click', () => save('Your cookie settings are saved'));
  $('[data-ck-accept]').addEventListener('click', () => {
    switches.forEach((sw) => { if (!sw.disabled) set(sw, true); });
    save(gpc ? 'Allowed all cookies except advertising' : 'All cookies allowed');
  });
  $('[data-ck-reject]').addEventListener('click', () => {
    switches.forEach((sw) => { if (!sw.disabled) set(sw, false); });
    save('Only essential cookies will be used');
  });

  /* ---------- Cookie table ---------- */
  const rows = $$('[data-ck-rows] tr');
  $$('[data-ck-count]').forEach((el) => {
    const n = rows.filter((r) => r.dataset.cat === el.dataset.ckCount).length;
    el.textContent = `${n} cookie${n === 1 ? '' : 's'}`;
  });
  const chips = $$('[data-ck-filter]');
  const filter = (cat) => {
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.ckFilter === cat)));
    let shown = 0;
    rows.forEach((r) => { r.hidden = cat !== 'all' && r.dataset.cat !== cat; if (!r.hidden) shown += 1; });
    $('[data-ck-shown]').textContent = `${shown} of ${rows.length} cookies`;
  };
  chips.forEach((c) => c.addEventListener('click', () => filter(c.dataset.ckFilter)));
  filter('all');

  /* ---------- Stored on this device ---------- */
  const KNOWN = {
    'morrow-privacy-choices': ['Your privacy and cookie choices', 'Saved when you change the settings on this page or the privacy page.'],
    'morrow-delivery-prep': ['Delivery day checklist', 'The boxes you ticked on the delivery page.'],
  };
  const list = $('[data-ck-device-list]');
  const clearAll = $('[data-ck-clear-all]');
  const stored = () => {
    const items = [];
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const k = localStorage.key(i);
        if (k.startsWith('morrow-')) items.push({ key: k, kind: 'Local storage' });
      }
    } catch (err) { /* storage unavailable */ }
    document.cookie.split(';').map((c) => c.trim().split('=')[0]).filter(Boolean)
      .forEach((name) => items.push({ key: name, kind: 'Cookie' }));
    return items;
  };
  function renderDevice() {
    const items = stored();
    list.innerHTML = '';
    items.forEach((it) => {
      const [title, desc] = KNOWN[it.key] || [it.key, 'Saved by the Morrow website.'];
      const li = document.createElement('li');
      li.innerHTML = '<div><strong></strong><span></span><code></code></div><button type="button" class="line__action">Delete</button>';
      $('strong', li).textContent = title;
      $('span', li).textContent = desc;
      $('code', li).textContent = `${it.kind}: ${it.key}`;
      const btn = $('button', li);
      btn.setAttribute('aria-label', `Delete ${title}`);
      btn.addEventListener('click', () => {
        remove(it);
        toast(`Deleted ${title.toLowerCase()}`);
        renderDevice();
        (clearAll.hidden ? $('[data-ck-device-empty]') : list.querySelector('button') || clearAll).focus?.();
      });
      list.appendChild(li);
    });
    $('[data-ck-device-empty]').hidden = items.length > 0;
    clearAll.hidden = items.length === 0;
  }
  const remove = (it) => {
    if (it.kind === 'Cookie') document.cookie = `${it.key}=; max-age=0; path=/`;
    else try { localStorage.removeItem(it.key); } catch (err) { /* storage unavailable */ }
    if (it.key === KEY) load(); // settings go back to the defaults
  };
  clearAll.addEventListener('click', () => {
    stored().forEach(remove);
    renderDevice();
    toast('Deleted everything Morrow stored on this device');
  });
  $('[data-ck-device-empty]').tabIndex = -1;
  renderDevice();
})();
