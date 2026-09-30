/* Morrow — showroom locator: search by city / ZIP / location, distance sorting, live opening hours,
   illustrated map, filters and appointment booking.
   City and ZIP lookup is a small built-in table for the demo; swap locate() for a geocoding API in production. */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const list = $('[data-store-list]');
  if (!list) return;

  const toast = (msg) => window.Morrow?.toast(msg);
  const cards = $$('.store-card', list);
  const map = $('[data-map]');
  const msg = $('[data-st-msg]');

  // must match the projection in the page's SVG (viewBox 0 0 900 520)
  const W = 900;
  const H = 520;
  const project = (lat, lng) => [
    (lng + 125.5) / (125.5 - 66) * (W - 60) + 30,
    (49.8 - lat) / (49.8 - 24) * (H - 60) + 30,
  ];

  /* ---------- Places we can recognise without a geocoding service ---------- */
  const CITIES = {
    'new york': [40.7128, -74.006], brooklyn: [40.6782, -73.9442], boston: [42.3601, -71.0589], philadelphia: [39.9526, -75.1652],
    'washington': [38.9072, -77.0369], baltimore: [39.2904, -76.6122], pittsburgh: [40.4406, -79.9959], atlanta: [33.749, -84.388],
    miami: [25.7617, -80.1918], orlando: [28.5383, -81.3792], charlotte: [35.2271, -80.8431], nashville: [36.1627, -86.7816],
    detroit: [42.3314, -83.0458], cleveland: [41.4993, -81.6944], columbus: [39.9612, -82.9988], chicago: [41.8781, -87.6298],
    milwaukee: [43.0389, -87.9065], minneapolis: [44.9778, -93.265], 'st louis': [38.627, -90.1994], 'kansas city': [39.0997, -94.5786],
    dallas: [32.7767, -96.797], houston: [29.7604, -95.3698], austin: [30.2672, -97.7431], 'san antonio': [29.4241, -98.4936],
    'new orleans': [29.9511, -90.0715], denver: [39.7392, -104.9903], boulder: [40.015, -105.2705], 'salt lake city': [40.7608, -111.891],
    phoenix: [33.4484, -112.074], 'las vegas': [36.1699, -115.1398], 'los angeles': [34.0522, -118.2437], 'san diego': [32.7157, -117.1611],
    'san francisco': [37.7749, -122.4194], oakland: [37.8044, -122.2712], sacramento: [38.5816, -121.4944], portland: [45.5152, -122.6784],
    seattle: [47.6062, -122.3321], boise: [43.615, -116.2023], albuquerque: [35.0844, -106.6504],
  };
  const ZIP3 = {
    '021': 'boston', '100': 'new york', '101': 'new york', '102': 'new york', '103': 'new york', '104': 'new york', '112': 'brooklyn',
    '191': 'philadelphia', '200': 'washington', '303': 'atlanta', '331': 'miami', '372': 'nashville', '482': 'detroit', '554': 'minneapolis',
    '606': 'chicago', '631': 'st louis', '752': 'dallas', '770': 'houston', '787': 'austin', '802': 'denver', '841': 'salt lake city',
    '850': 'phoenix', '891': 'las vegas', '900': 'los angeles', '921': 'san diego', '941': 'san francisco', '972': 'portland', '981': 'seattle',
  };
  // rough center of each ZIP region (first digit), used when the prefix isn't in the table
  const ZIP1 = [[42.4, -71.8], [40.9, -75], [37.5, -78.5], [32.5, -84], [40.2, -84.5], [44.5, -93], [39, -93], [31.5, -97], [40, -108], [38, -120.5]];

  $('[data-city-list]').innerHTML = Object.keys(CITIES).map((c) => `<option value="${c.replace(/\b\w/g, (m) => m.toUpperCase())}">`).join('');

  const locate = (q) => {
    const s = q.trim().toLowerCase().replace(/,.*$/, '').replace(/\./g, '');
    if (/^\d{5}$/.test(s)) {
      const city = ZIP3[s.slice(0, 3)];
      if (city) return { coords: CITIES[city], label: `ZIP ${s}` };
      return { coords: ZIP1[Number(s[0])], label: `ZIP ${s}`, approx: true };
    }
    if (CITIES[s]) return { coords: CITIES[s], label: q.trim().replace(/,.*$/, '') };
    const partial = Object.keys(CITIES).find((c) => c.startsWith(s) && s.length >= 3);
    return partial ? { coords: CITIES[partial], label: partial.replace(/\b\w/g, (m) => m.toUpperCase()) } : null;
  };

  const miles = ([lat1, lng1], [lat2, lng2]) => {
    const r = (d) => (d * Math.PI) / 180;
    const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
    return 3958.8 * 2 * Math.asin(Math.sqrt(a));
  };

  /* ---------- Opening hours in each showroom's own time zone ---------- */
  const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hr = (h) => `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`;
  const localNow = (tz) => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false })
      .formatToParts(new Date()).map((x) => [x.type, x.value]));
    return { day: DAY.indexOf(p.weekday), hour: (Number(p.hour) % 24) + Number(p.minute) / 60 };
  };
  const statusOf = (card) => {
    const hours = JSON.parse(card.dataset.hours);
    if (!hours) return null;
    const { day, hour } = localNow(card.dataset.tz);
    const today = hours[day];
    if (today && hour >= today[0] && hour < today[1]) return { open: true, text: `Open now, until ${hr(today[1])}` };
    if (today && hour < today[0]) return { open: false, text: `Closed now, opens today at ${hr(today[0])}` };
    for (let i = 1; i <= 7; i++) {
      const d = (day + i) % 7;
      if (hours[d]) return { open: false, text: `Closed now, opens ${i === 1 ? 'tomorrow' : DAY[d]} at ${hr(hours[d][0])}` };
    }
    return { open: false, text: 'Closed' };
  };
  const renderStatus = () => {
    let open = 0;
    cards.forEach((c) => {
      const s = statusOf(c);
      c.dataset.open = s?.open ? '1' : '0';
      if (s?.open) open += 1;
      const el = $('[data-status]', c);
      if (el && s) {
        el.textContent = s.text;
        el.classList.toggle('is-open', s.open);
      }
      const { day } = localNow(c.dataset.tz);
      $$('[data-day]', c).forEach((row) => row.classList.toggle('is-today', Number(row.dataset.day) === day));
    });
    $('[data-count-open]').textContent = open;
  };

  /* ---------- Selection: card <-> map pin ---------- */
  let you = null;
  const select = (id, { scroll = false, focus = false } = {}) => {
    cards.forEach((c) => c.classList.toggle('is-selected', c.dataset.store === id));
    $$('[data-pin]', map).forEach((p) => p.classList.toggle('is-selected', p.dataset.pin === id));
    const card = cards.find((c) => c.dataset.store === id);
    if (!card) return;
    // draw a line from you to the selected showroom
    const route = $('[data-route]', map);
    if (you) {
      const [x1, y1] = project(...you);
      const [x2, y2] = project(Number(card.dataset.lat), Number(card.dataset.lng));
      const line = $('[data-route-line]', map);
      line.setAttribute('x1', x1); line.setAttribute('y1', y1); line.setAttribute('x2', x2); line.setAttribute('y2', y2);
      route.setAttribute('display', 'inline');
    }
    if (scroll) card.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    if (focus) card.focus({ preventScroll: true });
  };
  $$('[data-pin]', map).forEach((pin) => pin.addEventListener('click', () => select(pin.dataset.pin, { scroll: true, focus: true })));
  list.addEventListener('click', (e) => {
    const card = e.target.closest('.store-card');
    if (!card) return;
    if (e.target.closest('[data-show-on-map]')) {
      select(card.dataset.store);
      $('.st-map').scrollIntoView({ block: 'nearest' });
      return;
    }
    if (!e.target.closest('a, button, summary')) select(card.dataset.store);
  });

  /* ---------- Distance sorting ---------- */
  const useLocation = (coords, label, approx) => {
    you = coords;
    const [x, y] = project(...coords);
    const youPin = $('[data-you]', map);
    youPin.setAttribute('transform', `translate(${x} ${y})`);
    youPin.setAttribute('display', 'inline');
    cards.forEach((c) => {
      const d = miles(coords, [Number(c.dataset.lat), Number(c.dataset.lng)]);
      c.dataset.distance = d;
      const el = $('[data-dist]', c);
      el.textContent = d < 1 ? 'Under 1 mi' : `${Math.round(d).toLocaleString('en-US')} mi`;
      el.hidden = false;
    });
    cards.sort((a, b) => a.dataset.distance - b.dataset.distance).forEach((c) => list.appendChild(c));
    const nearest = cards.find((c) => !c.classList.contains('store-card--soon') && !c.hidden) || cards[0];
    const d = Math.round(Number(nearest.dataset.distance));
    msg.className = 'st-msg is-ok';
    msg.textContent = `Nearest to ${label}${approx ? ' (approximate area)' : ''}: ${$('.store-card__city', nearest).textContent}, ${d < 1 ? 'under a mile' : d.toLocaleString('en-US') + ' miles'} away.`;
    select(nearest.dataset.store);
  };

  $('[data-st-search]').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = $('#st-q').value;
    const input = $('#st-q');
    if (!q.trim()) {
      input.setAttribute('aria-invalid', 'true');
      msg.className = 'st-msg is-error';
      msg.textContent = 'Enter a city or a 5-digit ZIP code.';
      input.focus();
      return;
    }
    const found = locate(q);
    if (!found) {
      input.setAttribute('aria-invalid', 'true');
      msg.className = 'st-msg is-error';
      msg.textContent = `We couldn’t find “${q.trim()}”. Try a nearby city or a ZIP code.`;
      return;
    }
    input.removeAttribute('aria-invalid');
    useLocation(found.coords, found.label, found.approx);
  });
  $('#st-q').addEventListener('input', () => $('#st-q').removeAttribute('aria-invalid'));

  $('[data-locate]').addEventListener('click', () => {
    if (!('geolocation' in navigator)) {
      msg.className = 'st-msg is-error';
      msg.textContent = 'Your browser can’t share your location. Enter a city or ZIP code instead.';
      return;
    }
    msg.className = 'st-msg';
    msg.textContent = 'Finding you…';
    navigator.geolocation.getCurrentPosition(
      (pos) => useLocation([pos.coords.latitude, pos.coords.longitude], 'you'),
      () => {
        msg.className = 'st-msg is-error';
        msg.textContent = 'We couldn’t get your location. Enter a city or ZIP code instead.';
      },
      { timeout: 8000, maximumAge: 600000 },
    );
  });

  /* ---------- Filters ---------- */
  let filter = 'all';
  const applyFilter = () => {
    let shown = 0;
    cards.forEach((c) => {
      const show = filter === 'all'
        || (filter === 'open' && c.dataset.open === '1')
        || (filter === 'design' && c.dataset.services.includes('Design appointments') && !c.classList.contains('store-card--soon'));
      c.hidden = !show;
      $(`[data-pin="${c.dataset.store}"]`, map).classList.toggle('is-dim', !show);
      if (show) shown += 1;
    });
    $('[data-st-empty]').hidden = shown > 0;
  };
  $$('[data-filter]').forEach((b) => b.addEventListener('click', () => {
    filter = b.dataset.filter;
    $$('[data-filter]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    applyFilter();
  }));
  $('[data-show-all]').addEventListener('click', () => $('[data-filter="all"]').click());

  /* ---------- Book a visit ---------- */
  const SLOTS = [11, 13, 15, 17];
  const buildBooking = (card) => {
    const box = $('[data-booking]', card);
    const hours = JSON.parse(card.dataset.hours);
    const { day, hour } = localNow(card.dataset.tz);
    const days = [];
    for (let i = 0; days.length < 3 && i < 10; i++) {
      const d = (day + i) % 7;
      const h = hours[d];
      if (!h) continue;
      const slots = SLOTS.filter((s) => s >= h[0] && s + 1 <= h[1] && (i > 0 || s > hour + 1));
      if (!slots.length) continue;
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({ label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }), slots });
    }
    $('[data-days]', box).innerHTML = days.map((d) => `<div class="booking__day"><p>${d.label}</p><div>${d.slots.map((s) => `<button type="button" class="slot-btn" data-slot="${d.label}, ${hr(s)}">${hr(s)}</button>`).join('')}</div></div>`).join('');
  };
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-book]');
    if (btn) {
      const card = btn.closest('.store-card');
      const box = $('[data-booking]', card);
      const open = box.hidden;
      if (open) buildBooking(card);
      box.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      if (open) $('.slot-btn', box)?.focus();
      return;
    }
    const slot = e.target.closest('[data-slot]');
    if (slot) {
      const card = slot.closest('.store-card');
      const box = $('[data-booking]', card);
      $$('.slot-btn', box).forEach((s) => s.setAttribute('aria-pressed', String(s === slot)));
      const done = $('[data-booked]', box);
      done.textContent = `Booked: ${slot.dataset.slot} at ${$('.store-card__city', card).textContent}. We’ll email you a confirmation.`;
      done.hidden = false;
      toast('Design appointment booked');
    }
  });

  renderStatus();
  applyFilter();
  setInterval(() => { renderStatus(); applyFilter(); }, 60 * 1000);
})();
