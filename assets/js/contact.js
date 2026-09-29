/* Morrow — contact page: topic routing, quick answers, live phone hours, photo upload, validation.
   Front end only: post the form to your help desk in send(). */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const form = $('[data-contact]');
  if (!form) return;

  const TZ = 'America/New_York';
  const OPEN = 9;   // 9am ET
  const CLOSE = 18; // 6pm ET
  const OPEN_DAYS = [1, 2, 3, 4, 5, 6]; // Monday to Saturday
  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MAX_FILES = 3;
  const MAX_BYTES = 10 * 1024 * 1024;

  /* ---------- Phone line: open now? ---------- */
  const nowInET = () => {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
      timeZone: TZ, weekday: 'short', hour: 'numeric', hour12: false, minute: 'numeric',
    }).formatToParts(new Date()).map((p) => [p.type, p.value]));
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
    return { day, hour: Number(parts.hour) % 24 + Number(parts.minute) / 60 };
  };
  const nextOpenDay = (day) => {
    for (let i = 1; i <= 7; i++) {
      const d = (day + i) % 7;
      if (OPEN_DAYS.includes(d)) return { d, i };
    }
    return { d: 1, i: 1 };
  };
  const renderStatus = () => {
    const { day, hour } = nowInET();
    const el = $('[data-open-status]');
    const openToday = OPEN_DAYS.includes(day);
    let text;
    let open = false;
    if (openToday && hour >= OPEN && hour < CLOSE) {
      open = true;
      text = 'Open now, until 6pm ET';
    } else if (openToday && hour < OPEN) {
      text = 'Closed now. Opens today at 9am ET';
    } else {
      const { d, i } = nextOpenDay(day);
      text = `Closed now. Opens ${i === 1 ? 'tomorrow' : DAY_NAMES[d]} at 9am ET`;
    }
    el.classList.toggle('is-open', open);
    $('[data-open-text]').textContent = text;
  };
  renderStatus();
  setInterval(renderStatus, 60 * 1000);

  // when we'll reply: end of the next working day (or today, if it's early on a working day)
  const replyBy = () => {
    const { day, hour } = nowInET();
    if (OPEN_DAYS.includes(day) && hour < 12) return 'the end of today';
    const { d, i } = nextOpenDay(day);
    return i === 1 ? 'the end of tomorrow' : `the end of ${DAY_NAMES[d]}`;
  };

  /* ---------- Topic routing ---------- */
  const TOPIC_NAMES = { order: 'order or delivery', return: 'returns', damage: 'damaged item', product: 'product and design', trade: 'trade and business', other: 'other' };
  const topic = () => $('input[name="topic"]:checked', form).value;
  const reply = () => $('input[name="reply"]:checked', form).value;

  const syncFields = () => {
    const t = topic();
    const active = [t, reply() === 'phone' ? 'phone-reply' : ''];
    $$('[data-show-for]', form).forEach((f) => {
      const show = f.dataset.showFor.split(' ').some((k) => active.includes(k));
      f.hidden = !show;
    });
    $$('[data-answers]').forEach((g) => { g.hidden = g.dataset.answers !== t; });
    $('[data-topic-name]').textContent = TOPIC_NAMES[t];
  };
  form.addEventListener('change', (e) => {
    if (e.target.name === 'topic' || e.target.name === 'reply') syncFields();
  });

  /* ---------- Message counter ---------- */
  const msg = $('#ct-message');
  msg.addEventListener('input', () => { $('[data-count]').textContent = msg.value.length; });

  /* ---------- Photos ---------- */
  const photos = $('#ct-photos');
  const fileList = $('[data-files]');
  let files = [];
  const renderFiles = () => {
    fileList.innerHTML = '';
    files.forEach((f, i) => {
      const li = document.createElement('li');
      li.innerHTML = '<span></span><button type="button" class="line__action">Remove</button>';
      li.firstChild.textContent = `${f.name} (${Math.max(1, Math.round(f.size / 1024))} KB)`;
      li.lastChild.setAttribute('aria-label', `Remove ${f.name}`);
      li.lastChild.addEventListener('click', () => { files.splice(i, 1); renderFiles(); photos.focus(); });
      fileList.appendChild(li);
    });
  };
  const addFiles = (list) => {
    const err = [];
    [...list].forEach((f) => {
      if (!f.type.startsWith('image/')) err.push(`${f.name} isn’t an image.`);
      else if (f.size > MAX_BYTES) err.push(`${f.name} is over 10 MB.`);
      else if (files.length >= MAX_FILES) err.push(`You can add up to ${MAX_FILES} photos.`);
      else files.push(f);
    });
    setError('ct-photos', [...new Set(err)].join(' '));
    renderFiles();
  };
  photos.addEventListener('change', () => { addFiles(photos.files); photos.value = ''; });
  const drop = $('.upload', form);
  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('is-drag'); }));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('is-drag'); }));
  drop.addEventListener('drop', (e) => addFiles(e.dataTransfer.files));

  /* ---------- Validation ---------- */
  function setError(id, message) {
    const input = document.getElementById(id);
    const err = document.getElementById(id + '-err');
    input.setAttribute('aria-invalid', String(!!message));
    err.textContent = message;
    err.hidden = !message;
    return !message;
  }
  const val = (id) => document.getElementById(id).value.trim();
  const shown = (id) => !document.getElementById(id).closest('[data-show-for]')?.hidden;

  const validate = () => {
    const checks = [
      ['ct-name', () => (val('ct-name') ? '' : 'Enter your name.')],
      ['ct-email', () => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('ct-email')) ? '' : 'Enter an email address like name@example.com.')],
      ['ct-order', () => (!shown('ct-order') || /^MR-?\d{5}$/i.test(val('ct-order')) ? '' : 'Enter your order number, like MR-48213.')],
      ['ct-company', () => (!shown('ct-company') || val('ct-company') ? '' : 'Enter your company or studio name.')],
      ['ct-photos', () => (!shown('ct-photos') || files.length ? '' : 'Add at least one photo of the damage.')],
      ['ct-message', () => (val('ct-message').length >= 10 ? '' : 'Tell us a little more, at least a sentence.')],
      ['ct-phone', () => (!shown('ct-phone') || val('ct-phone').replace(/\D/g, '').length >= 10 ? '' : 'Enter a 10-digit phone number.')],
    ];
    const bad = checks.filter(([id, rule]) => !setError(id, rule()));
    if (bad.length) {
      const el = document.getElementById(bad[0][0]);
      (el.type === 'file' ? $('.upload', form) : el).scrollIntoView({ block: 'center' });
      el.focus({ preventScroll: true });
    }
    return !bad.length;
  };
  form.addEventListener('input', (e) => {
    if (e.target.getAttribute('aria-invalid') === 'true') setError(e.target.id, '');
  });

  /* ---------- Send ---------- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) return;
    send();
  });
  function send() {
    // Replace with a POST to your help desk (include `files` for photo uploads).
    $('[data-sent-name]').textContent = val('ct-name').split(' ')[0];
    $('[data-sent-ref]').textContent = 'CS-' + Math.floor(10000 + Math.random() * 90000);
    $('[data-sent-how]').textContent = reply() === 'phone' ? 'call you' : 'email you';
    $('[data-sent-when]').textContent = replyBy();
    form.hidden = true;
    const sent = $('[data-sent]');
    sent.hidden = false;
    sent.focus();
  }
  $('[data-another]').addEventListener('click', () => {
    form.reset();
    files = [];
    renderFiles();
    $('[data-count]').textContent = '0';
    syncFields();
    $('[data-sent]').hidden = true;
    form.hidden = false;
    $('input[name="topic"]:checked', form).focus();
  });

  syncFields();
})();
