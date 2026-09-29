/* Morrow — design services: 4-step booking with live summary, and the free swatch picker.
   Front end only: send bookings and swatch orders to your scheduling / fulfilment tools in the two submit handlers. */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const form = $('[data-book-form]');
  if (!form) return;

  const toast = (msg) => window.Morrow?.toast(msg);
  const val = (id) => document.getElementById(id).value.trim();
  const setError = (id, msg) => {
    const input = document.getElementById(id);
    const err = document.getElementById(id + '-err');
    input?.setAttribute('aria-invalid', String(!!msg));
    if (err) { err.textContent = msg; err.hidden = !msg; }
    return !msg;
  };
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const hr = (h) => `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`;

  /* ======================= Booking ======================= */
  let step = 1;
  const panels = $$('[data-panel]', form);
  const stepItems = $$('[data-book-steps] li', form);
  const backBtn = $('[data-back]', form);
  const nextBtn = $('[data-next]', form);

  const service = () => $('input[name="service"]:checked', form);
  const rooms = () => $$('input[name="room"]:checked', form).map((r) => r.value);
  const day = () => $('input[name="day"]:checked', form);
  const time = () => $('input[name="time"]:checked', form);

  const showStep = (n, focus = true) => {
    step = n;
    panels.forEach((p) => { p.hidden = Number(p.dataset.panel) !== n; });
    stepItems.forEach((li, i) => {
      li.classList.toggle('is-done', i + 1 < n);
      if (i + 1 === n) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
    });
    backBtn.hidden = n === 1;
    nextBtn.textContent = n === 4 ? 'Confirm booking' : 'Continue';
    if (focus) {
      const legend = $('.book__legend', panels[n - 1]);
      legend.setAttribute('tabindex', '-1');
      legend.focus({ preventScroll: true });
      form.scrollIntoView({ block: 'nearest' });
    }
  };

  const summary = () => {
    const s = service();
    $('[data-sum-service]').textContent = s.dataset.label + (s.value === 'showroom' ? `, ${$('#bk-showroom').value}` : '');
    $('[data-sum-length]').textContent = s.dataset.length;
    $('[data-sum-price]').textContent = s.dataset.price;
    $('[data-sum-rooms]').textContent = rooms().join(', ') || 'Not chosen yet';
    $('[data-sum-when]').textContent = day() && time() ? `${day().dataset.label}, ${time().value} ET` : 'Not chosen yet';
    $('[data-showroom-field]').hidden = s.value !== 'showroom';
  };
  form.addEventListener('change', (e) => {
    if (e.target.name === 'day') renderTimes();
    if (e.target.name === 'room') setError('room', '');
    if (e.target.name === 'time') setError('time', '');
    summary();
  });

  // days: the next 10 days except Sundays
  const days = [];
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (days.length < 10) {
    if (d.getDay() !== 0) days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  $('[data-days]').innerHTML = days.map((day) => {
    const iso = day.toISOString().slice(0, 10);
    const label = day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    return `<label class="date"><input type="radio" name="day" value="${iso}" data-label="${label}"><span><small>${day.toLocaleDateString('en-US', { weekday: 'short' })}</small><strong>${day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</strong></span></label>`;
  }).join('');

  // times: 9am to 6pm; some are already taken (a stable pseudo-random pattern per day, standing in for real availability)
  const taken = (iso, h) => [...(iso + h)].reduce((a, c) => a + c.charCodeAt(0), 0) % 4 === 0;
  function renderTimes() {
    const box = $('[data-times]');
    if (!day()) {
      box.innerHTML = '<p class="times__hint">Choose a day to see available times.</p>';
      return;
    }
    const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
    const prev = time()?.value;
    box.innerHTML = hours.map((h) => {
      const off = taken(day().value, h);
      return `<label class="slot"><input type="radio" name="time" value="${hr(h)}"${off ? ' disabled' : ''}${prev === hr(h) && !off ? ' checked' : ''}><span>${hr(h)}${off ? '<small> taken</small>' : ''}</span></label>`;
    }).join('');
  }
  renderTimes();

  const validateStep = () => {
    if (step === 2 && !rooms().length) {
      setError('room', 'Choose at least one room, or “Not sure yet”.');
      $('input[name="room"]', form).focus();
      return false;
    }
    if (step === 3 && !(day() && time())) {
      setError('time', day() ? 'Choose a time.' : 'Choose a day, then a time.');
      (day() ? $('input[name="time"]:not(:disabled)', form) : $('input[name="day"]', form))?.focus();
      return false;
    }
    if (step === 4) {
      const checks = [
        ['bk-name', val('bk-name') ? '' : 'Enter your name.'],
        ['bk-email', emailOk(val('bk-email')) ? '' : 'Enter an email address like name@example.com.'],
        ['bk-phone', !val('bk-phone') || val('bk-phone').replace(/\D/g, '').length >= 10 ? '' : 'Enter a 10-digit phone number, or leave it blank.'],
      ];
      const bad = checks.filter(([id, msg]) => !setError(id, msg));
      if (bad.length) { document.getElementById(bad[0][0]).focus(); return false; }
    }
    return true;
  };
  form.addEventListener('input', (e) => {
    if (e.target.getAttribute('aria-invalid') === 'true') setError(e.target.id, '');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    if (step < 4) { showStep(step + 1); return; }
    // Replace with a call to your scheduling tool.
    const s = service();
    const where = s.value === 'call' ? 'We’ve sent a video link to' : s.value === 'showroom' ? `See you at our ${$('#bk-showroom').value} showroom. Details are on their way to` : 'Your stylist will send a short questionnaire to';
    $('[data-done-text]').textContent = `${s.dataset.label} on ${day().dataset.label} at ${time().value} ET. ${where} ${val('bk-email')}.`;
    form.hidden = true;
    const done = $('[data-book-done]');
    done.hidden = false;
    done.focus();
  });
  backBtn.addEventListener('click', () => showStep(step - 1));

  $('[data-book-again]').addEventListener('click', () => {
    form.reset();
    renderTimes();
    summary();
    $('[data-book-done]').hidden = true;
    form.hidden = false;
    showStep(1);
  });

  // "Book …" buttons on the service cards preselect that service
  $$('[data-pick-service]').forEach((a) => a.addEventListener('click', () => {
    const r = $(`input[name="service"][value="${a.dataset.pickService}"]`, form);
    r.checked = true;
    summary();
    if (!form.hidden) showStep(1, false);
  }));

  /* ======================= Swatches ======================= */
  const MAX = 6;
  const tray = $('[data-tray]');
  const trayList = $('[data-tray-list]');
  const chosen = [];

  const renderTray = () => {
    trayList.innerHTML = '';
    chosen.forEach((btn) => {
      const li = document.createElement('li');
      const chip = $('.sw__chip', btn).cloneNode(true);
      const name = document.createElement('span');
      name.textContent = btn.dataset.name.charAt(0).toUpperCase() + btn.dataset.name.slice(1);
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'line__action';
      rm.textContent = 'Remove';
      rm.setAttribute('aria-label', `Remove ${btn.dataset.name}`);
      rm.addEventListener('click', () => { toggle(btn); btn.focus(); });
      li.append(chip, name, rm);
      trayList.appendChild(li);
    });
    $('[data-sw-count]').textContent = chosen.length;
    $('[data-tray-empty]').hidden = chosen.length > 0;
    $('[data-tray-fields]').hidden = chosen.length === 0;
    $$('[data-swatch]').forEach((b) => b.setAttribute('aria-pressed', String(chosen.includes(b))));
  };
  function toggle(btn) {
    const i = chosen.indexOf(btn);
    if (i >= 0) chosen.splice(i, 1);
    else if (chosen.length >= MAX) {
      setError('tray', `You can choose up to ${MAX}. Remove one to swap it.`);
      return;
    } else chosen.push(btn);
    setError('tray', '');
    $('[data-tray-done]').hidden = true;
    renderTray();
  }
  $$('[data-swatch]').forEach((b) => b.addEventListener('click', () => toggle(b)));

  tray.addEventListener('input', (e) => {
    if (e.target.getAttribute('aria-invalid') === 'true') setError(e.target.id, '');
  });
  tray.addEventListener('submit', (e) => {
    e.preventDefault();
    const checks = [
      ['sw-name', val('sw-name') ? '' : 'Enter your name.'],
      ['sw-email', emailOk(val('sw-email')) ? '' : 'Enter an email address like name@example.com.'],
      ['sw-address', val('sw-address') ? '' : 'Enter your street address.'],
      ['sw-zip', /^\d{5}$/.test(val('sw-zip')) ? '' : 'Enter a 5-digit ZIP code.'],
    ];
    const bad = checks.filter(([id, msg]) => !setError(id, msg));
    if (bad.length) { document.getElementById(bad[0][0]).focus(); return; }

    // two working days
    const arrive = new Date();
    let add = 2;
    while (add > 0) { arrive.setDate(arrive.getDate() + 1); if (arrive.getDay() !== 0 && arrive.getDay() !== 6) add -= 1; }
    const names = chosen.map((b) => b.dataset.name);
    const done = $('[data-tray-done]');
    done.innerHTML = '<p class="tray__done-title"></p><p></p>';
    done.firstChild.textContent = `${names.length} swatch${names.length === 1 ? '' : 'es'} on the way`;
    done.lastChild.textContent = `Expected ${arrive.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}: ${names.join(', ')}.`;
    chosen.length = 0;
    tray.reset();
    renderTray();
    done.hidden = false;
    done.focus();
    toast('Swatches ordered');
  });

  summary();
  renderTray();
})();
