/* Morrow — delivery page: ZIP delivery checker (nearest hub, dates, cost, map) and a "get ready" checklist.
   Hubs, prices and lead times are constants below. ZIP lookup is a rough built-in table by ZIP prefix; use your carrier's API in production. */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const form = $('[data-dl-form]');
  if (!form) return;

  const FREE_OVER = 500;
  const STANDARD = 49;
  const WHITE_GLOVE = 79;
  const DISPATCH_DAYS = 3; // working days for in-stock pieces to leave the hub
  const MADE_WEEKS = [6, 8];

  // must match the projection used for the SVG map (viewBox 0 0 900 520), same as the showrooms page
  const project = (lat, lng) => [(lng + 125.5) / 59.5 * 840 + 30, (49.8 - lat) / 25.8 * 460 + 30];
  // first three digits of a ZIP code → a point in that area (state centers, plus big cities)
  const ZIP3 = [
    [10, 27, 42.3, -71.8], [28, 29, 41.7, -71.5], [30, 38, 43.6, -71.6], [39, 49, 45.2, -69.2], [50, 59, 44, -72.7], [60, 69, 41.6, -72.7],
    [70, 89, 40.2, -74.6], [100, 104, 40.71, -74.01], [105, 119, 40.8, -73.4], [120, 149, 42.9, -75.5], [150, 196, 40.9, -77.8],
    [197, 199, 39, -75.5], [200, 205, 38.91, -77.04], [206, 219, 39, -76.8], [220, 246, 37.5, -78.9], [247, 268, 38.6, -80.6],
    [270, 289, 35.6, -79.4], [290, 299, 33.9, -80.9], [300, 319, 33.75, -84.39], [320, 349, 28.5, -81.8], [350, 369, 32.8, -86.8],
    [370, 385, 35.9, -86.4], [386, 397, 32.7, -89.7], [398, 399, 33.75, -84.39], [400, 427, 37.5, -85.3], [430, 459, 40.3, -82.8],
    [460, 479, 39.9, -86.3], [480, 499, 43.3, -84.5], [500, 528, 42, -93.5], [530, 549, 44.6, -89.9], [550, 567, 45.5, -94],
    [570, 577, 44.4, -100.3], [580, 588, 47.5, -100.5], [590, 599, 46.9, -110.4], [600, 620, 41.88, -87.63], [622, 629, 39.8, -89.4],
    [630, 658, 38.4, -92.4], [660, 679, 38.5, -98.3], [680, 693, 41.5, -99.8], [700, 714, 31, -92], [716, 729, 34.9, -92.4],
    [730, 749, 35.5, -97.5], [750, 769, 32.78, -96.8], [770, 779, 29.76, -95.37], [780, 789, 30.27, -97.74], [790, 799, 33.3, -101.9],
    [800, 816, 39.74, -104.99], [820, 831, 43, -107.5], [832, 838, 44.2, -114.6], [840, 847, 40.76, -111.89], [850, 865, 33.45, -112.07],
    [870, 884, 34.5, -106.1], [889, 898, 36.17, -115.14], [900, 918, 34.05, -118.24], [919, 921, 32.72, -117.16], [922, 935, 35, -118.5],
    [936, 953, 37.3, -121.5], [954, 961, 39.5, -121.8], [970, 979, 44.6, -122.3], [980, 994, 47.4, -121.3],
  ];
  const AWAY = [
    [6, 9, 'Puerto Rico', 'We don’t deliver to Puerto Rico yet. Leave your email with our team and we’ll tell you when we do.'],
    [967, 968, 'Hawaii', 'We deliver to Hawaii on request. Send us your order and we’ll quote for freight and a local two-person team.'],
    [995, 999, 'Alaska', 'We deliver to Alaska on request. Send us your order and we’ll quote for freight and a local two-person team.'],
  ];

  const hubs = $$('[data-hub]').map((g) => ({ el: g, name: g.dataset.name, coords: [Number(g.dataset.lat), Number(g.dataset.lng)] }));
  const miles = ([lat1, lng1], [lat2, lng2]) => {
    const r = (d) => (d * Math.PI) / 180;
    const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
    return 3958.8 * 2 * Math.asin(Math.sqrt(a));
  };
  const money = (n) => '$' + n.toLocaleString('en-US');
  const fmt = (d, o = { weekday: 'long', month: 'long', day: 'numeric' }) => d.toLocaleDateString('en-US', o);
  // we deliver Monday to Saturday
  const addDeliveryDays = (from, n) => {
    const d = new Date(from);
    while (n > 0) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0) n -= 1;
    }
    return d;
  };

  const zipInput = $('#dl-zip');
  const totalInput = $('#dl-total');
  const zipErr = $('#dl-zip-err');
  const result = $('[data-dl-result]');
  const away = $('[data-dl-away]');
  const you = $('[data-dl-you]');
  const route = $('[data-dl-route]');
  let place = null;

  const setZipError = (msg) => {
    zipErr.textContent = msg;
    zipErr.hidden = !msg;
    zipInput.setAttribute('aria-invalid', String(!!msg));
  };
  const orderTotal = () => Number(totalInput.value.replace(/[^0-9.]/g, '')) || 0;
  const updateRoomPrice = () => { $('[data-dl-room]').textContent = orderTotal() >= FREE_OVER ? 'Free' : money(STANDARD); };

  const resetMap = () => {
    you.setAttribute('display', 'none');
    route.setAttribute('display', 'none');
    hubs.forEach((h) => h.el.classList.remove('is-selected', 'is-dim'));
  };

  function render() {
    const { coords, hub, dist } = place;
    const type = $('input[name="dl-type"]:checked', form).value;
    const glove = $('input[name="dl-service"]:checked', form).value === 'glove';
    const transit = dist < 150 ? 0 : dist < 500 ? 1 : dist < 1000 ? 2 : 3;
    const near = dist < 150;

    $('[data-dl-hub]').innerHTML = near
      ? `Delivered by our local <strong>${hub.name}</strong> team.`
      : `Delivered from our <strong>${hub.name}</strong> hub, about ${Math.round(dist / 10) * 10} miles away.`;

    const today = new Date();
    if (type === 'stock') {
      const first = addDeliveryDays(today, DISPATCH_DAYS + transit + 1);
      $('[data-dl-when-label]').textContent = 'Earliest delivery';
      $('[data-dl-when]').textContent = fmt(first);
      $('[data-dl-when-note]').textContent = 'Or any later day you choose, Monday to Saturday.';
      const days = [first];
      while (days.length < 6) days.push(addDeliveryDays(days[days.length - 1], 1));
      $('[data-dl-days]').innerHTML = days.map((d) => `<li><small>${fmt(d, { weekday: 'short' })}</small><strong>${fmt(d, { month: 'short', day: 'numeric' })}</strong></li>`).join('');
      $('[data-dl-evening]').textContent = near
        ? 'Windows: 8am–12pm, 12pm–5pm, or 5pm–8pm for $25.'
        : 'Windows: 8am–12pm or 12pm–5pm. Evening delivery is only available near our hubs.';
      $('[data-dl-days-wrap]').hidden = false;
    } else {
      const from = new Date(today);
      from.setDate(from.getDate() + MADE_WEEKS[0] * 7);
      const to = new Date(today);
      to.setDate(to.getDate() + MADE_WEEKS[1] * 7 + transit);
      $('[data-dl-when-label]').textContent = 'Estimated delivery';
      $('[data-dl-when]').textContent = `${fmt(from, { month: 'long', day: 'numeric' })} – ${fmt(to, { month: 'long', day: 'numeric' })}`;
      $('[data-dl-when-note]').textContent = 'We’ll call to book a day as soon as your piece leaves the workshop.';
      $('[data-dl-days-wrap]').hidden = true;
    }

    const total = orderTotal();
    const base = total >= FREE_OVER ? 0 : STANDARD;
    $('[data-dl-base]').textContent = base ? money(base) : 'Free';
    $('[data-dl-glove-row]').hidden = !glove;
    $('[data-dl-cost]').textContent = base + (glove ? WHITE_GLOVE : 0) ? money(base + (glove ? WHITE_GLOVE : 0)) : 'Free';
    $('[data-dl-free]').textContent = total >= FREE_OVER
      ? 'Your order qualifies for free delivery.'
      : `Add ${money(Math.ceil(FREE_OVER - total))} more for free delivery.`;

    // map
    const [x, y] = project(...coords);
    const [hx, hy] = project(...hub.coords);
    you.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    you.setAttribute('display', '');
    $('text', you).setAttribute('display', near ? 'none' : ''); // the hub label is enough when you're next to it
    const line = $('line', route);
    line.setAttribute('x1', hx); line.setAttribute('y1', hy); line.setAttribute('x2', x); line.setAttribute('y2', y);
    route.setAttribute('display', near ? 'none' : '');
    hubs.forEach((h) => { h.el.classList.toggle('is-selected', h === hub); h.el.classList.toggle('is-dim', h !== hub); });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const zip = zipInput.value.trim();
    if (!/^\d{5}$/.test(zip)) {
      setZipError('Enter a 5-digit ZIP code, like 60622.');
      zipInput.focus();
      return;
    }
    setZipError('');
    const p3 = Number(zip.slice(0, 3));
    const off = AWAY.find(([a, b]) => p3 >= a && p3 <= b);
    if (off) {
      place = null;
      resetMap();
      result.hidden = true;
      $('[data-dl-away-title]').textContent = `Delivering to ${off[2]}`;
      $('[data-dl-away-text]').textContent = off[3];
      away.hidden = false;
      away.focus();
      return;
    }
    const hit = ZIP3.find(([a, b]) => p3 >= a && p3 <= b);
    if (!hit) {
      setZipError('We couldn’t find that ZIP code. Check it and try again.');
      zipInput.focus();
      return;
    }
    const coords = [hit[2], hit[3]];
    const hub = hubs.reduce((best, h) => (miles(coords, h.coords) < miles(coords, best.coords) ? h : best));
    place = { coords, hub, dist: miles(coords, hub.coords) };
    away.hidden = true;
    result.hidden = false;
    render();
    result.focus({ preventScroll: true });
    if (result.getBoundingClientRect().top > innerHeight) result.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });

  zipInput.addEventListener('input', () => {
    zipInput.value = zipInput.value.replace(/\D/g, '').slice(0, 5);
    if (!zipErr.hidden) setZipError('');
  });
  totalInput.addEventListener('input', () => { updateRoomPrice(); if (place) render(); });
  totalInput.addEventListener('blur', () => { totalInput.value = orderTotal().toLocaleString('en-US'); });
  form.addEventListener('change', (e) => { if (place && e.target !== zipInput) render(); });
  updateRoomPrice();

  /* ---------- Get-ready checklist, remembered on this device ---------- */
  const KEY = 'morrow-delivery-prep';
  const boxes = $$('[data-dl-prep] input');
  const count = $('[data-dl-prep-count]');
  const bar = $('[data-dl-prep-bar]');
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem(KEY)) || []; } catch (err) { saved = []; }
  boxes.forEach((b) => { b.checked = saved.includes(b.value); });
  const updatePrep = () => {
    const done = boxes.filter((b) => b.checked);
    count.textContent = done.length === boxes.length ? 'All set for delivery day.' : `${done.length} of ${boxes.length} done`;
    bar.style.width = `${(done.length / boxes.length) * 100}%`;
    boxes.forEach((b) => b.closest('li').classList.toggle('is-done', b.checked));
    try { localStorage.setItem(KEY, JSON.stringify(done.map((b) => b.value))); } catch (err) { /* storage unavailable */ }
  };
  $('[data-dl-prep]').addEventListener('change', updatePrep);
  updatePrep();
})();
