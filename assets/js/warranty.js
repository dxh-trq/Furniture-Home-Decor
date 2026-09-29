/* Morrow — warranty page: coverage checker (by type and delivery date) and the claim form with photo upload.
   Cover lengths are in COVER; send claims to your help desk in the submit handler. */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const rows = $('[data-wr-rows]');
  if (!rows) return;

  // [part, years covered, detail]
  const COVER = {
    sofa: [['Frame', 10, 'Solid oak and ash, joints and fixings'], ['Springs and webbing', 10, 'Breaking or losing their tension'], ['Legs and feet', 10, 'Solid wood, and the fittings that hold them'], ['Foam and fillings', 2, 'Losing more than 15% of their height'], ['Fabric and leather', 2, 'Seams opening, zips failing, fabric wearing through']],
    table: [['Solid wood top and base', 10, 'Cracks, splits and warping'], ['Joints and fixings', 10, 'Coming loose in normal use'], ['Oil and lacquer finish', 2, 'Peeling, bubbling or cracking'], ['Stone tops', 2, 'Cracks from a defect, not from knocks']],
    storage: [['Solid wood carcass', 10, 'Cracks, splits and warping'], ['Drawer runners and hinges', 5, 'Sticking, dropping or breaking'], ['Finish', 2, 'Peeling, bubbling or cracking']],
    bed: [['Frame and slats', 10, 'Cracks, breaks and loose joints'], ['Headboard upholstery', 2, 'Seams and fabric in normal use'], ['Finish', 2, 'Peeling, bubbling or cracking']],
    lighting: [['Integrated LED', 3, 'Failing or flickering'], ['Wiring, switches and dimmers', 2, 'Stopping working'], ['Body and shade', 2, 'Finish and glass defects']],
    rug: [['Weave, pile and binding', 2, 'Unravelling or excessive shedding after the first months'], ['Backing', 2, 'Separating from the pile']],
  };
  const YEAR = 365.25 * 86400000;
  const monthYear = (d) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  /* ---------- Coverage checker ---------- */
  const dateInput = $('#wr-date');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const start = new Date(today);
  start.setFullYear(start.getFullYear() - 3);
  dateInput.value = iso(start);
  dateInput.max = iso(today);

  function renderCover() {
    const type = $('input[name="wr-type"]:checked').value;
    let delivered = dateInput.value ? new Date(dateInput.value + 'T00:00:00') : today;
    if (Number.isNaN(delivered.getTime()) || delivered > today) delivered = today;
    const elapsed = (today - delivered) / YEAR;
    const now = Math.min(elapsed, 10) * 10;
    const parts = COVER[type].map(([name, years, detail]) => {
      const until = new Date(delivered);
      until.setFullYear(until.getFullYear() + years);
      return { name, years, detail, until, on: until > today };
    });
    rows.closest('.wr-chart').style.setProperty('--now', now);
    rows.innerHTML = parts.map((p) => `
      <li class="wr-row${p.on ? '' : ' is-ended'}">
        <div class="wr-row__name"><strong>${p.name}</strong><span>${p.detail}</span></div>
        <div class="wr-row__track" aria-hidden="true"><span class="wr-row__bar" style="--w:${p.years * 10}"><span style="--used:${Math.min(1, elapsed / p.years) * 100}"></span></span><span class="wr-row__now"></span></div>
        <div class="wr-row__status"><strong>${p.years} ${p.years === 1 ? 'year' : 'years'}</strong><span>${p.on ? `Covered until ${monthYear(p.until)}` : `Ended ${monthYear(p.until)}`}</span></div>
      </li>`).join('');
    const on = parts.filter((p) => p.on);
    const age = elapsed < 1 / 12 ? 'less than a month' : elapsed < 1 ? `${Math.floor(elapsed * 12)} months` : `${Math.floor(elapsed)} ${Math.floor(elapsed) === 1 ? 'year' : 'years'}`;
    $('[data-wr-sum]').innerHTML = !on.length
      ? `After ${age}, the warranty has ended, but <a class="link" href="#parts">parts and repairs</a> are always available.`
      : on.length === parts.length
        ? `After ${age}, <strong>everything is still covered</strong>.`
        : `After ${age}, <strong>${on.length} of ${parts.length} parts are still covered</strong>, including the ${on[0].name.toLowerCase()} until ${monthYear(on[0].until)}.`;
  }
  $$('input[name="wr-type"]').forEach((r) => r.addEventListener('change', renderCover));
  dateInput.addEventListener('change', renderCover);
  renderCover();

  /* ---------- Claim form ---------- */
  const form = $('[data-wr-form]');
  const MAX_FILES = 5;
  const MAX_BYTES = 10 * 1024 * 1024;
  const setError = (id, msg) => {
    const input = document.getElementById(id);
    const err = document.getElementById(id + '-err');
    input?.setAttribute('aria-invalid', String(!!msg));
    if (err) { err.textContent = msg; err.hidden = !msg; }
    return !msg;
  };
  const val = (id) => document.getElementById(id).value.trim();

  // photos, shown as thumbnails
  const photos = $('#wr-photos');
  const thumbs = $('[data-wr-files]');
  let files = [];
  const renderFiles = () => {
    thumbs.querySelectorAll('img').forEach((img) => URL.revokeObjectURL(img.src));
    thumbs.innerHTML = '';
    files.forEach((f, i) => {
      const li = document.createElement('li');
      const img = document.createElement('img');
      img.src = URL.createObjectURL(f);
      img.alt = '';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'wr-thumbs__remove';
      btn.setAttribute('aria-label', `Remove ${f.name}`);
      btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>';
      btn.addEventListener('click', () => { files.splice(i, 1); renderFiles(); photos.focus(); });
      li.append(img, btn);
      thumbs.appendChild(li);
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
    setError('wr-photos', [...new Set(err)].join(' '));
    renderFiles();
  };
  photos.addEventListener('change', () => { addFiles(photos.files); photos.value = ''; });
  const drop = $('.upload', form);
  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('is-drag'); }));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('is-drag'); }));
  drop.addEventListener('drop', (e) => addFiles(e.dataTransfer.files));

  // issues that usually aren't covered get a friendly note
  const NOT_COVERED = ['stain', 'pet'];
  form.addEventListener('change', (e) => {
    if (e.target.name === 'wr-issue') {
      setError('wr-issue', '');
      $('[data-wr-note]').hidden = !NOT_COVERED.includes(e.target.value);
    }
    if (e.target.id === 'wr-piece') setError('wr-piece', '');
  });
  form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true') setError(e.target.id, ''); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const no = val('wr-order').toUpperCase().replace(/^MR(\d)/, 'MR-$1');
    const issue = $('input[name="wr-issue"]:checked', form);
    const checks = [
      ['wr-order', /^MR-\d{5}$/.test(no) ? '' : 'Enter your order number, like MR-45502.'],
      ['wr-email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('wr-email')) ? '' : 'Enter an email address like name@example.com.'],
      ['wr-piece', val('wr-piece') ? '' : 'Choose the piece that needs help.'],
      ['wr-issue', issue ? '' : 'Choose what’s wrong.'],
      ['wr-photos', files.length ? '' : 'Add at least one photo. It helps us fix it on the first visit.'],
      ['wr-desc', val('wr-desc').length >= 10 ? '' : 'Tell us a little about what happened.'],
    ];
    const bad = checks.filter(([id, msg]) => !setError(id, msg));
    if (bad.length) {
      const id = bad[0][0];
      (id === 'wr-issue' ? $('input[name="wr-issue"]', form) : id === 'wr-photos' ? drop : document.getElementById(id)).focus?.();
      if (id === 'wr-photos') drop.scrollIntoView({ block: 'center' });
      return;
    }
    // Replace with a POST to your help desk (include `files`).
    $('[data-wr-ref]').textContent = 'WC-' + Math.floor(10000 + Math.random() * 90000);
    const paid = NOT_COVERED.includes(issue.value);
    $('[data-wr-done-text]').textContent = paid
      ? `Thanks. Our workshop team will look at your photos of your ${val('wr-piece')} and email ${val('wr-email')} within 2 working days with the best fix and a price. Nothing is charged until you say yes.`
      : `Thanks. Our workshop team will look at your photos of your ${val('wr-piece')} and email ${val('wr-email')} within 2 working days. If it’s a part, we’ll post it; if it needs hands, we’ll book a technician at a time that suits you.`;
    form.hidden = true;
    const done = $('[data-wr-done]');
    done.hidden = false;
    done.focus();
  });

  $('[data-wr-again]').addEventListener('click', () => {
    form.reset();
    files = [];
    renderFiles();
    $('[data-wr-note]').hidden = true;
    form.hidden = false;
    $('[data-wr-done]').hidden = true;
    $('#wr-order').focus();
  });
})();
