/* Morrow — track your order: look up an order by number plus email or ZIP code, then show each delivery's progress,
   live van position, workshop progress, date changes, delivery notes, updates and the full history.
   Front end only: ORDERS stands in for your order API. Replace lookup() with a fetch. Links like
   track.html?order=MR-48213&zip=10002 open an order directly (use them in shipping emails). */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const form = $('[data-tk-form]');
  if (!form) return;

  const STEPS = ['Ordered', 'Being made', 'At our hub', 'Out for delivery', 'Delivered'];
  const item = (name, opt, sym, color, leg, qty = 1) => ({ name, opt, sym, color, leg, qty });

  const ORDERS = {
    'MR-48213': {
      email: 'hannah@example.com', zip: '10002', name: 'Hannah', placed: '29 September 2026',
      address: '48 Orchard Street, New York, NY 10002', phone: '(212) •••-0142',
      shipments: [
        {
          label: 'Delivery 1 of 2', status: 'booked', when: 'Fri, Oct 9', window: '5pm – 8pm', service: 'Room of choice, two-person team',
          items: [item('Lumen floor lamp', 'Natural linen', 'lamp', '#EBD9AE', '#2B2F2A'), item('Tove side table', 'Travertine', 'sidetable', '#D9CFBF', '#5C3E28'), item('Loma vase', 'Moss', 'vase', '#36402F', '#5C3E28', 2)],
          dates: ['Sep 29', 'Packed Oct 2', 'Oct 5', 'Oct 9', ''], current: 2,
          slots: [['Wed, Oct 7', '8am – 12pm'], ['Thu, Oct 8', '12pm – 4pm'], ['Fri, Oct 9', '5pm – 8pm'], ['Sat, Oct 10', '8am – 12pm'], ['Mon, Oct 12', '12pm – 4pm']],
          log: [['Oct 5, 7:42am', 'Arrived at our New Jersey hub', 'Checked for damage and ready for your delivery day.'],
            ['Oct 2, 3:10pm', 'Packed and left the warehouse', 'Three boxes, in recycled cardboard and blanket wrap.'],
            ['Sep 30, 11:05am', 'Delivery booked', 'You chose Fri, Oct 9, 5pm – 8pm.'],
            ['Sep 29, 8:31pm', 'Order placed', 'We sent a confirmation to h•••@example.com.']],
        },
        {
          label: 'Delivery 2 of 2', status: 'making', when: 'Week of Nov 16', window: 'We’ll call you to book a day', service: 'White glove, two-person team',
          items: [item('Alder 3-seat sofa', 'Cognac bouclé, 3-seat', 'sofa', '#9A6240', '#5C3E28')],
          dates: ['Sep 29', 'In progress', '', '', ''], current: 1,
          workshop: [['Frame built', 'Kiln-dried oak, glued and screwed', 'done', 'Oct 1'], ['Springs tied by hand', 'Tied in 8 places, the slow way', 'current', 'Today'], ['Covered in cognac bouclé', 'Cut and sewn to your order', '', ''], ['Checked and wrapped', 'A 40-point check, then blanket-wrapped', '', '']],
          log: [['Oct 1, 4:20pm', 'Frame finished', 'Your frame passed its load test at our Hickory workshop.'],
            ['Sep 30, 9:02am', 'Started in the workshop', 'Your sofa was given a place on the build schedule.'],
            ['Sep 29, 8:31pm', 'Order placed', 'Made to order: we build it after you buy it.']],
        },
      ],
    },
    'MR-51077': {
      email: 'sam@example.com', zip: '11215', name: 'Sam', placed: '21 September 2026',
      address: '312 7th Avenue, Brooklyn, NY 11215', phone: '(718) •••-0199',
      shipments: [
        {
          label: 'Delivery 1 of 1', status: 'out', when: 'Today', window: '1:10pm – 1:40pm', service: 'White glove, two-person team',
          items: [item('Ren lounge chair', 'Cognac leather', 'armchair', '#9A6240', '#3B2A1E'), item('Halo pendant light', 'Brass', 'pendant', '#C28E2E', '#2B2F2A')],
          dates: ['Sep 21', 'Packed Sep 25', 'Sep 28', 'Today, 8:05am', ''], current: 3,
          live: { stops: 3, total: 9, crew: 'Marcus and Jo', van: 'Van 12', minsPerStop: 25 },
          log: [['Today, 8:05am', 'Out for delivery', 'Marcus and Jo left our New Jersey hub in Van 12. You’re stop 7 of 9.'],
            ['Yesterday, 6:00pm', 'Time window confirmed', 'We texted you your 30-minute window.'],
            ['Sep 28, 10:15am', 'Arrived at our New Jersey hub', 'Checked for damage and ready for your delivery day.'],
            ['Sep 25, 2:40pm', 'Packed and left the warehouse', 'Two boxes, blanket-wrapped.'],
            ['Sep 21, 12:12pm', 'Order placed', 'We sent a confirmation to s•••@example.com.']],
        },
      ],
    },
    'MR-45502': {
      email: 'hannah@example.com', zip: '10002', name: 'Hannah', placed: '8 September 2026',
      address: '48 Orchard Street, New York, NY 10002', phone: '(212) •••-0142',
      shipments: [
        {
          label: 'Delivery 1 of 1', status: 'delivered', when: 'Mon, Sep 15', window: 'Delivered at 2:14pm', service: 'Room of choice, two-person team',
          items: [item('Halo pendant light', 'Moss', 'pendant', '#6F7A5E', '#2B2F2A', 2), item('Loma vase', 'Ochre', 'vase', '#C28E2E', '#5C3E28')],
          dates: ['Sep 8', 'Packed Sep 10', 'Sep 12', 'Sep 15', 'Sep 15, 2:14pm'], current: 5,
          delivered: { where: 'Placed in the dining room', by: 'Signed for by Hannah R.', returnBy: '15 October', packaging: 'Packaging taken away for recycling' },
          log: [['Sep 15, 2:14pm', 'Delivered', 'Placed in the dining room and signed for by Hannah R.'],
            ['Sep 15, 8:02am', 'Out for delivery', 'Luis and Dee left our New Jersey hub.'],
            ['Sep 12, 9:30am', 'Arrived at our New Jersey hub', 'Checked for damage and ready for your delivery day.'],
            ['Sep 10, 1:05pm', 'Packed and left the warehouse', 'One box.'],
            ['Sep 8, 7:48pm', 'Order placed', 'We sent a confirmation to h•••@example.com.']],
        },
      ],
    },
  };

  /* ---------- Lookup ---------- */
  const result = $('[data-tk-result]');
  const lookupSec = $('[data-tk-lookup]');
  const noInput = $('#tk-order');
  const keyInput = $('#tk-key');
  let timer = null;

  const normalise = (s) => {
    const m = s.trim().toUpperCase().replace(/\s+/g, '').match(/^(?:MR)?-?(\d{5})$/);
    return m ? `MR-${m[1]}` : null;
  };
  const setError = (id, msg) => {
    const input = document.getElementById(id);
    const err = document.getElementById(id + '-err');
    input.setAttribute('aria-invalid', String(!!msg));
    err.textContent = msg;
    err.hidden = !msg;
    return !msg;
  };
  // Replace with a request to your order API. Resolves to { order } or { error }.
  const lookup = (no, key) => {
    const o = ORDERS[no];
    if (!o) return { error: 'missing' };
    const k = key.trim().toLowerCase();
    if (k !== o.email && k.replace(/\s/g, '').slice(0, 5) !== o.zip) return { error: 'mismatch' };
    return { order: o };
  };
  form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true') setError(e.target.id, ''); $('[data-tk-alert]').hidden = true; });

  const run = (no, key, { scroll = true } = {}) => {
    const alert = $('[data-tk-alert]');
    alert.hidden = true;
    const okNo = setError('tk-order', no ? '' : 'Enter your order number, like MR-48213. It’s in your confirmation email.');
    const okKey = setError('tk-key', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key.trim()) || /^\d{5}(-\d{4})?$/.test(key.trim()) ? '' : 'Enter the email you ordered with, or the 5-digit ZIP code you’re delivering to.');
    if (!okNo || !okKey) { $(okNo ? '#tk-key' : '#tk-order').focus(); return; }
    const res = lookup(no, key);
    if (res.error) {
      $('[data-tk-alert-text]').textContent = res.error === 'missing'
        ? `We can’t find order ${no}. Check the number in your confirmation email. New orders can take up to an hour to appear.`
        : `That email or ZIP code doesn’t match order ${no}. Use the email you ordered with, or the ZIP code it’s being delivered to.`;
      alert.hidden = false;
      alert.focus();
      return;
    }
    render(no, res.order, key.trim());
    lookupSec.hidden = true;
    result.hidden = false;
    history.replaceState(null, '', `?order=${no}`);
    if (scroll) window.scrollTo({ top: 0 });
    $('[data-tk-title]').focus();
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    run(normalise(noInput.value), keyInput.value);
  });
  $$('[data-tk-demo]').forEach((b) => b.addEventListener('click', () => {
    const o = ORDERS[b.dataset.tkDemo];
    noInput.value = b.dataset.tkDemo;
    keyInput.value = o.zip;
    run(b.dataset.tkDemo, o.zip);
  }));

  /* ---------- Render ---------- */
  const thumb = (it) => `<span class="osum__thumb" style="color:${it.color};--leg:${it.leg}">${window.Morrow?.productImg(it.name) || `<svg viewBox="0 0 200 160" aria-hidden="true"><use href="#s-${it.sym}"/></svg>`}${it.qty > 1 ? `<span class="osum__qty" aria-hidden="true">${it.qty}</span>` : ''}</span>`;
  const PILL = { booked: ['pill--progress', 'Delivery booked'], making: ['pill--order', 'Being made'], out: ['tk-pill--live', 'Out for delivery'], delivered: ['pill--done', 'Delivered'] };
  const ICON = {
    change: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    note: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></svg>',
    text: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4V5Z"/></svg>',
  };

  const stepper = (s) => `<ol class="tk-steps" style="--done:${Math.min(s.current, STEPS.length - 1)}">${STEPS.map((name, i) => {
    const state = i < s.current ? 'is-done' : i === s.current ? 'is-now' : '';
    const label = i === 1 && s.status !== 'making' ? 'Packed' : name;
    const date = i === 1 && s.dates[1].startsWith('Packed') ? s.dates[1].replace('Packed ', '') : s.dates[i];
    return `<li class="${state}"${i === s.current ? ' aria-current="step"' : ''}><span class="tk-steps__dot" aria-hidden="true"></span><strong>${label}</strong><span>${date || (i === s.current ? 'Now' : '')}</span><span class="visually-hidden">${state === 'is-done' ? ', done' : state === 'is-now' ? ', current step' : ', to come'}</span></li>`;
  }).join('')}</ol>`;

  const liveBlock = (l) => {
    const pts = Array.from({ length: l.total }, (_, i) => {
      const x = 30 + (i * 540) / (l.total - 1);
      const y = 70 + Math.sin(i * 1.1) * 32;
      return [Math.round(x), Math.round(y)];
    });
    const you = l.total - 3; // your stop index (0-based)
    const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');
    return `<div class="tk-live">
        <div class="tk-live__map">
          <svg viewBox="0 0 600 150" role="img" aria-label="Route map showing the van and your stop" data-tk-map>
            <path d="M0 30 H600 M0 118 H600 M120 0 V150 M330 0 V150 M470 0 V150" class="tk-live__streets"/>
            <path d="${path}" class="tk-live__route"/>
            ${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="${i === you ? 0 : 5}" class="tk-live__stop" data-stop="${i}"/>`).join('')}
            <g transform="translate(${pts[you][0]} ${pts[you][1]})" class="tk-live__home"><circle r="16"/><path d="M-7 3v-6l7-6 7 6v6z"/></g>
            <g class="tk-live__van" data-tk-van><circle r="13"/><path d="M-7 -3h8v7h-8z M1 -1h4l2 3v2h-6z"/></g>
          </svg>
        </div>
        <div class="tk-live__info">
          <p class="tk-live__big" data-tk-stops aria-live="polite"></p>
          <p class="tk-live__eta">Arriving <strong data-tk-eta></strong></p>
          <p class="tk-live__crew">${l.crew} · ${l.van}</p>
          <div class="tk-live__actions">
            <a class="btn btn--small" href="tel:+18005550142">${ICON.phone}Call the team</a>
            <a class="btn btn--ghost btn--small-ghost" href="sms:+18005550142">${ICON.text}Text</a>
          </div>
        </div>
      </div>`;
  };

  const makingBlock = (s) => `<div class="tk-make">
      <div class="tk-make__head">
        <h4>In our Hickory workshop</h4>
        <a class="link" href="designers.html#p-hickory">Meet the makers</a>
      </div>
      <ol class="tk-make__list">${s.workshop.map(([t, d, st, when]) => `<li class="${st ? `is-${st}` : ''}"><span class="tk-make__dot" aria-hidden="true"></span><div><strong>${t}</strong><span>${d}</span></div><em>${when || 'To come'}</em></li>`).join('')}</ol>
      <p class="tk-make__note">Made to order, so it’s built for you. We’ll call you to book a day about a week before it’s ready.</p>
    </div>`;

  const bookedBlock = (s, i) => `<div class="tk-booked">
      <div class="tk-booked__actions">
        <button class="btn btn--ghost btn--small-ghost" type="button" aria-expanded="false" aria-controls="tk-change-${i}" data-tk-toggle>${ICON.change}Change date</button>
        <button class="btn btn--ghost btn--small-ghost" type="button" aria-expanded="false" aria-controls="tk-notes-${i}" data-tk-toggle>${ICON.note}Add delivery notes</button>
      </div>
      <div class="tk-panel" id="tk-change-${i}" hidden>
        <fieldset class="tk-slots">
          <legend>Choose a new day. Free to change up to 48 hours before.</legend>
          <div class="tk-slots__row">${s.slots.map(([d, w]) => `<button class="slot-btn" type="button" aria-pressed="${d === s.when ? 'true' : 'false'}" data-day="${d}" data-window="${w}"><strong>${d}</strong> <span>${w}</span></button>`).join('')}</div>
        </fieldset>
        <div class="tk-panel__foot"><button class="btn btn--small" type="button" data-tk-save-date>Confirm change</button><button class="line__action" type="button" data-tk-cancel>Cancel</button></div>
      </div>
      <div class="tk-panel" id="tk-notes-${i}" hidden>
        <div class="field">
          <label for="tk-note-${i}">Notes for the delivery team</label>
          <textarea id="tk-note-${i}" rows="3" maxlength="300" placeholder="Gate code, parking, which door to use, a tight turn on the stairs"></textarea>
        </div>
        <div class="tk-panel__foot"><button class="btn btn--small" type="button" data-tk-save-note>Save notes</button><button class="line__action" type="button" data-tk-cancel>Cancel</button></div>
      </div>
      <p class="tk-booked__note" data-tk-note-show hidden></p>
    </div>`;

  const deliveredBlock = (s) => `<div class="tk-done">
      <ul class="tk-done__facts"><li>${s.delivered.where}</li><li>${s.delivered.by}</li><li>${s.delivered.packaging}</li></ul>
      <div class="tk-rate">
        <p id="tk-rate-label">How was your delivery?</p>
        <div class="tk-rate__stars" role="radiogroup" aria-labelledby="tk-rate-label">${[1, 2, 3, 4, 5].map((n) => `<button type="button" role="radio" aria-checked="false" aria-label="${n} star${n > 1 ? 's' : ''}" data-rate="${n}">★</button>`).join('')}</div>
        <p class="tk-rate__thanks" data-tk-rate-msg aria-live="polite"></p>
      </div>
      <div class="tk-done__actions">
        <a class="btn btn--small" href="returns.html">Start a return</a>
        <a class="btn btn--ghost btn--small-ghost" href="product.html#reviews">Review your pieces</a>
      </div>
      <p class="tk-done__note">Free returns until ${s.delivered.returnBy}.</p>
    </div>`;

  const shipment = (s, i) => {
    const [pillCls, pillText] = PILL[s.status];
    const extra = { booked: () => bookedBlock(s, i), making: () => makingBlock(s), out: () => liveBlock(s.live), delivered: () => deliveredBlock(s) }[s.status]();
    return `<article class="tk-ship tk-ship--${s.status}" data-status="${s.status}">
      <header class="tk-ship__head">
        <div>
          <h3>${s.label}</h3>
          <p>${s.service}</p>
        </div>
        <p class="pill ${pillCls}">${pillText}</p>
      </header>
      <div class="tk-ship__when">
        <p class="tk-ship__day" data-tk-day>${s.status === 'making' ? 'Estimated ' + s.when.charAt(0).toLowerCase() + s.when.slice(1) : s.when}</p>
        <p class="tk-ship__window" data-tk-window>${s.window}</p>
      </div>
      ${stepper(s)}
      ${extra}
      <ul class="tk-items">${s.items.map((it) => `<li>${thumb(it)}<span><strong>${it.name}</strong><span>${it.opt}${it.qty > 1 ? `, qty ${it.qty}` : ''}</span></span></li>`).join('')}</ul>
      <details class="tk-log">
        <summary>All updates <span>${s.log.length}</span></summary>
        <ol data-tk-log>${s.log.map(([t, h, d]) => `<li><time>${t}</time><div><strong>${h}</strong><span>${d}</span></div></li>`).join('')}</ol>
      </details>
    </article>`;
  };

  function render(no, o, key) {
    clearInterval(timer);
    $('[data-tk-title]').textContent = `Order ${no}`;
    $('[data-tk-placed]').textContent = `Placed ${o.placed} · ${o.shipments.length === 1 ? 'One delivery' : `${o.shipments.length} deliveries`}`;
    $('[data-tk-address]').textContent = o.address;
    $('[data-tk-phone]').textContent = o.phone;
    $('[data-tk-greet]').textContent = headline(o);
    $('[data-tk-ships]').innerHTML = o.shipments.map(shipment).join('');
    const share = $('[data-tk-share]');
    share.dataset.url = `${location.href.split(/[?#]/)[0]}?order=${no}&zip=${o.zip}`;
    $$('[data-tk-alerts] .switch').forEach((sw) => sw.setAttribute('aria-checked', sw.dataset.default));
    bindShipments(o);
  }
  function headline(o) {
    const s = o.shipments;
    if (s.some((x) => x.status === 'out')) return `${o.name}, your delivery is on its way today.`;
    if (s.every((x) => x.status === 'delivered')) return `${o.name}, this order has been delivered.`;
    const booked = s.find((x) => x.status === 'booked');
    if (booked) return `${o.name}, your first delivery is booked for ${booked.when}.`;
    return `${o.name}, your order is being made.`;
  }

  function bindShipments(o) {
    $$('.tk-ship').forEach((card, i) => {
      const s = o.shipments[i];
      // toggled panels (change date, notes)
      $$('[data-tk-toggle]', card).forEach((b) => b.addEventListener('click', () => {
        const panel = document.getElementById(b.getAttribute('aria-controls'));
        const open = panel.hidden;
        $$('[data-tk-toggle]', card).forEach((x) => { x.setAttribute('aria-expanded', 'false'); document.getElementById(x.getAttribute('aria-controls')).hidden = true; });
        panel.hidden = !open;
        b.setAttribute('aria-expanded', String(open));
        if (open) $('button[aria-pressed="true"], textarea', panel)?.focus();
      }));
      $$('[data-tk-cancel]', card).forEach((b) => b.addEventListener('click', () => {
        const panel = b.closest('.tk-panel');
        panel.hidden = true;
        const opener = $(`[aria-controls="${panel.id}"]`, card);
        opener.setAttribute('aria-expanded', 'false');
        opener.focus();
      }));
      $$('.tk-slots .slot-btn', card).forEach((b) => b.addEventListener('click', () => {
        $$('.tk-slots .slot-btn', card).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      }));
      $('[data-tk-save-date]', card)?.addEventListener('click', () => {
        const pick = $('.tk-slots [aria-pressed="true"]', card);
        const panel = pick.closest('.tk-panel');
        if (pick.dataset.day !== s.when) {
          s.when = pick.dataset.day;
          s.window = pick.dataset.window;
          $('[data-tk-day]', card).textContent = s.when;
          $('[data-tk-window]', card).textContent = s.window;
          const li = document.createElement('li');
          li.innerHTML = `<time>Just now</time><div><strong>Delivery date changed</strong><span>Now ${s.when}, ${s.window}. We’ve emailed you a new confirmation.</span></div>`;
          $('[data-tk-log]', card).prepend(li);
          $('.tk-log summary span', card).textContent = $$('[data-tk-log] li', card).length;
          $('[data-tk-greet]').textContent = headline(o);
          window.Morrow?.toast(`Delivery moved to ${s.when}, ${s.window}`);
        } else {
          window.Morrow?.toast('That’s your current day, nothing changed');
        }
        panel.hidden = true;
        $(`[aria-controls="${panel.id}"]`, card).setAttribute('aria-expanded', 'false');
      });
      $('[data-tk-save-note]', card)?.addEventListener('click', () => {
        const ta = $('textarea', card);
        const panel = ta.closest('.tk-panel');
        const show = $('[data-tk-note-show]', card);
        const text = ta.value.trim();
        show.hidden = !text;
        show.textContent = text ? `Your note: “${text}”` : '';
        $(`[aria-controls="${panel.id}"]`, card).innerHTML = `${ICON.note}${text ? 'Edit delivery notes' : 'Add delivery notes'}`;
        panel.hidden = true;
        $(`[aria-controls="${panel.id}"]`, card).setAttribute('aria-expanded', 'false');
        window.Morrow?.toast(text ? 'Notes saved. The team will see them on the day.' : 'Notes removed');
      });
      // rating
      const stars = $$('[data-rate]', card);
      stars.forEach((b, k) => {
        b.addEventListener('click', () => {
          stars.forEach((x, j) => { x.setAttribute('aria-checked', String(j === k)); x.classList.toggle('is-on', j <= k); });
          $('[data-tk-rate-msg]', card).textContent = k >= 3 ? 'Thanks! We’ll pass that on to the team.' : 'Sorry it wasn’t better. We’ll be in touch to put it right.';
        });
        b.addEventListener('keydown', (e) => {
          const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
          if (!step) return;
          e.preventDefault();
          const n = stars[Math.min(Math.max(k + step, 0), stars.length - 1)];
          n.focus();
          n.click();
        });
      });
      // live van
      if (s.live) startLive(card, s.live);
    });
  }

  function startLive(card, l) {
    const you = l.total - 3;
    const pos = (stopsLeft) => you - stopsLeft;
    const draw = () => {
      const at = pos(l.stops);
      const stop = $(`[data-stop="${at}"]`, card);
      const van = $('[data-tk-van]', card);
      van.setAttribute('transform', `translate(${stop.getAttribute('cx')} ${stop.getAttribute('cy')})`);
      $$('[data-stop]', card).forEach((c) => c.classList.toggle('is-past', Number(c.dataset.stop) <= at));
      $('[data-tk-stops]', card).textContent = l.stops > 1 ? `${l.stops} stops before you` : 'You’re the next stop';
      const mins = l.stops * l.minsPerStop;
      $('[data-tk-eta]', card).textContent = `in about ${mins} minutes`;
    };
    draw();
    // Demo only: the van moves on every few seconds. Replace with updates from your routing system.
    timer = setInterval(() => {
      if (l.stops <= 1 || result.hidden) { clearInterval(timer); return; }
      l.stops -= 1;
      draw();
    }, 6000);
  }

  /* ---------- Order-level actions ---------- */
  $('[data-tk-share]').addEventListener('click', async (e) => {
    const url = e.currentTarget.dataset.url;
    try { await navigator.clipboard.writeText(url); window.Morrow?.toast('Tracking link copied. Anyone with it can see this order’s progress.'); } catch (err) { window.Morrow?.toast(url); }
  });
  $('[data-tk-print]').addEventListener('click', () => window.print());
  window.addEventListener('beforeprint', () => $$('.tk-log').forEach((d) => { d.open = true; })); // print the full history
  $('[data-tk-again]').addEventListener('click', () => {
    clearInterval(timer);
    result.hidden = true;
    lookupSec.hidden = false;
    form.reset();
    history.replaceState(null, '', location.pathname);
    noInput.focus();
  });
  $$('[data-tk-alerts] .switch').forEach((sw) => sw.addEventListener('click', () => {
    const on = sw.getAttribute('aria-checked') !== 'true';
    sw.setAttribute('aria-checked', String(on));
    const label = $(`#${sw.getAttribute('aria-labelledby')}`).textContent.trim().toLowerCase();
    window.Morrow?.toast(on ? `${label.charAt(0).toUpperCase() + label.slice(1)} on` : `${label.charAt(0).toUpperCase() + label.slice(1)} off`);
  }));

  /* ---------- Open from a link ---------- */
  const params = new URLSearchParams(location.search);
  const pNo = normalise(params.get('order') || '');
  if (pNo) {
    noInput.value = pNo;
    const key = params.get('zip') || params.get('email');
    if (key) { keyInput.value = key; run(pNo, key, { scroll: false }); } else keyInput.focus();
  }
})();
