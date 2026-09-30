/* Morrow — reviews: filter by product type, star rating, topic, photos and search; sort; show more; read more;
   helpful votes; photo gallery that jumps to its review; and the "review your order" flow.
   Front end only: reviews are plain HTML in the page. Load them from your reviews service, and send new
   reviews (and reports) to it in the handlers marked below. */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const list = $('[data-rw-list]');
  if (!list) return;

  const toast = (m) => window.Morrow?.toast(m);
  const reviews = $$('.rw', list);
  const PAGE = 8;
  const state = { cat: 'all', stars: new Set(), topic: '', photos: false, q: '', sort: 'helpful', shown: PAGE };
  const TOPIC = Object.fromEntries($$('[data-rw-topic]').map((b) => [b.dataset.rwTopic, $('strong', b).textContent]));
  const CAT = Object.fromEntries($$('[data-rw-cat]').map((b) => [b.dataset.rwCat, b.firstChild.textContent.trim()]));

  /* ---------- Filter, sort and paginate ---------- */
  const matches = (r) => (state.cat === 'all' || r.dataset.cat === state.cat)
    && (!state.stars.size || state.stars.has(r.dataset.rating))
    && (!state.topic || r.dataset.topics.split(' ').includes(state.topic))
    && (!state.photos || Number(r.dataset.photos) > 0)
    && state.q.split(/\s+/).filter(Boolean).every((w) => r.dataset.text.includes(w));
  const SORTS = {
    helpful: (a, b) => b.dataset.helpful - a.dataset.helpful,
    newest: (a, b) => b.dataset.date.localeCompare(a.dataset.date),
    high: (a, b) => b.dataset.rating - a.dataset.rating || b.dataset.date.localeCompare(a.dataset.date),
    low: (a, b) => a.dataset.rating - b.dataset.rating || b.dataset.date.localeCompare(a.dataset.date),
  };

  const render = () => {
    const hits = reviews.filter(matches).sort(SORTS[state.sort]);
    hits.forEach((r) => list.append(r));
    reviews.forEach((r) => { r.hidden = true; });
    hits.slice(0, state.shown).forEach((r) => { r.hidden = false; });
    const shown = Math.min(state.shown, hits.length);
    $('[data-rw-count]').textContent = hits.length
      ? `Showing ${shown} of ${hits.length} review${hits.length === 1 ? '' : 's'}`
      : 'No reviews';
    $('[data-rw-empty]').hidden = hits.length > 0;
    const more = $('[data-rw-more-btn]');
    more.hidden = shown >= hits.length;
    more.textContent = `Show more reviews (${hits.length - shown} more)`;
    drawActive();
    fitMore();
  };
  // only offer "Read more" where the text is actually cut off at this width
  function fitMore() {
    $$('[data-rw-more]', list).forEach((b) => {
      const rw = b.closest('.rw');
      if (rw.hidden || b.getAttribute('aria-expanded') === 'true') return;
      const body = $('[data-rw-body]', rw);
      b.hidden = body.scrollHeight <= body.clientHeight + 1;
    });
  }
  let resizing;
  window.addEventListener('resize', () => { clearTimeout(resizing); resizing = setTimeout(fitMore, 150); });
  document.fonts?.ready.then(fitMore);
  const update = (fn) => { fn(); state.shown = PAGE; render(); };

  // active filter pills
  function drawActive() {
    const pills = [];
    if (state.cat !== 'all') pills.push(['cat', CAT[state.cat]]);
    [...state.stars].sort().reverse().forEach((s) => pills.push([`star-${s}`, `${s} star`]));
    if (state.topic) pills.push(['topic', `Mentions ${TOPIC[state.topic].toLowerCase()}`]);
    if (state.photos) pills.push(['photos', 'With photos']);
    if (state.q) pills.push(['q', `“${state.q}”`]);
    const box = $('[data-rw-active]');
    box.hidden = !pills.length;
    box.innerHTML = '';
    pills.forEach(([k, label]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'rw-pill';
      b.dataset.clear = k;
      b.setAttribute('aria-label', `Remove filter: ${label}`);
      b.innerHTML = '<span></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>';
      b.firstChild.textContent = label;
      box.append(b);
    });
    if (pills.length > 1) {
      const all = document.createElement('button');
      all.type = 'button';
      all.className = 'rw-pill rw-pill--all';
      all.dataset.clear = 'all';
      all.textContent = 'Clear all';
      box.append(all);
    }
    // keep the controls in step with the state
    $$('[data-rw-cat]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.rwCat === state.cat)));
    $$('[data-rw-star]').forEach((b) => b.setAttribute('aria-pressed', String(state.stars.has(b.dataset.rwStar))));
    $$('[data-rw-topic]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.rwTopic === state.topic)));
    $('[data-rw-with-photos]').checked = state.photos;
    if ($('[data-rw-search]').value.trim().toLowerCase() !== state.q) $('[data-rw-search]').value = state.q;
  }
  $('[data-rw-active]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-clear]');
    if (!b) return;
    const k = b.dataset.clear;
    update(() => {
      if (k === 'all') clearAll();
      else if (k === 'cat') state.cat = 'all';
      else if (k.startsWith('star-')) state.stars.delete(k.slice(5));
      else if (k === 'topic') state.topic = '';
      else if (k === 'photos') state.photos = false;
      else if (k === 'q') state.q = '';
    });
    $('[data-rw-active] button, [data-rw-search]')?.focus();
  });
  const clearAll = () => { state.cat = 'all'; state.stars.clear(); state.topic = ''; state.photos = false; state.q = ''; };
  const toList = () => $('#all-reviews').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });

  $$('[data-rw-cat]').forEach((b) => b.addEventListener('click', () => update(() => { state.cat = b.dataset.rwCat; })));
  $$('[data-rw-star]').forEach((b) => b.addEventListener('click', () => {
    update(() => { const s = b.dataset.rwStar; if (state.stars.has(s)) state.stars.delete(s); else state.stars.add(s); });
    if (state.stars.size) toList();
  }));
  $$('[data-rw-topic]').forEach((b) => b.addEventListener('click', () => {
    update(() => { state.topic = state.topic === b.dataset.rwTopic ? '' : b.dataset.rwTopic; });
    if (state.topic) toList();
  }));
  $('[data-rw-with-photos]').addEventListener('change', (e) => update(() => { state.photos = e.target.checked; }));
  $('[data-rw-photos-only]').addEventListener('click', () => { update(() => { state.photos = true; }); toList(); });
  let typing;
  $('[data-rw-search]').addEventListener('input', (e) => {
    clearTimeout(typing);
    typing = setTimeout(() => update(() => { state.q = e.target.value.trim().toLowerCase(); }), 150);
  });
  $('[data-rw-sort]').addEventListener('change', (e) => update(() => { state.sort = e.target.value; }));
  $('[data-rw-clear]').addEventListener('click', () => update(clearAll));
  $('[data-rw-more-btn]').addEventListener('click', () => {
    const before = reviews.filter((r) => !r.hidden).length;
    state.shown += PAGE;
    render();
    // move focus to the first newly shown review
    const next = [...list.children].filter((r) => !r.hidden)[before];
    if (next) { next.tabIndex = -1; next.focus(); }
  });

  /* ---------- Each review ---------- */
  list.addEventListener('click', (e) => {
    const more = e.target.closest('[data-rw-more]');
    if (more) {
      const body = $('[data-rw-body]', more.closest('.rw'));
      const open = more.getAttribute('aria-expanded') !== 'true';
      body.classList.toggle('is-clamped', !open);
      more.setAttribute('aria-expanded', String(open));
      more.textContent = open ? 'Show less' : 'Read more';
      return;
    }
    const help = e.target.closest('.rv__helpful');
    if (help) {
      const on = help.getAttribute('aria-pressed') !== 'true';
      help.setAttribute('aria-pressed', String(on));
      $('span', help).textContent = Number(help.dataset.count) + (on ? 1 : 0);
      return;
    }
    const rep = e.target.closest('[data-rw-report]');
    if (rep) {
      // Send to your moderation queue.
      rep.disabled = true;
      rep.textContent = 'Reported';
      toast('Thanks. Our team will check this review within a day.');
      return;
    }
    const ph = e.target.closest('[data-rw-photo]');
    if (ph) ph.classList.toggle('is-big');
  });

  /* ---------- Gallery jumps to its review ---------- */
  $$('[data-rw-goto]').forEach((b) => b.addEventListener('click', () => {
    const r = document.getElementById(b.dataset.rwGoto);
    if (r.hidden) {
      update(clearAll);
      if (r.hidden) { state.shown = reviews.length; render(); }
    }
    r.tabIndex = -1;
    r.scrollIntoView({ block: 'center' });
    r.focus({ preventScroll: true });
    r.classList.remove('is-flash');
    void r.offsetWidth; // restart the highlight
    r.classList.add('is-flash');
  }));

  // Link to a review: reviews.html#review-12
  const fromHash = () => {
    const r = /^#review-\d+$/.test(location.hash) && document.querySelector(location.hash);
    if (!r) return;
    if (r.hidden) { state.shown = reviews.length; render(); }
    r.scrollIntoView({ block: 'center' });
    r.classList.add('is-flash');
  };
  render();
  fromHash();
  window.addEventListener('hashchange', fromHash);

  /* ---------- Review your order ---------- */
  const find = $('[data-rw-find]');
  const form = $('[data-rw-form]');
  const done = $('[data-rw-done]');
  const setError = (id, msg) => {
    const input = document.getElementById(id);
    const err = document.getElementById(id + '-err');
    input?.setAttribute('aria-invalid', String(!!msg));
    if (err) { err.textContent = msg; err.hidden = !msg; }
    return !msg;
  };
  const val = (id) => document.getElementById(id).value.trim();

  find.addEventListener('submit', (e) => {
    e.preventDefault();
    const m = val('rw-order').toUpperCase().replace(/\s+/g, '').match(/^(?:MR)?-?(\d{5})$/);
    if (!m) { setError('rw-order', 'Enter your order number, like MR-48213.'); $('#rw-order').focus(); return; }
    // Replace with a lookup of the signed-in customer's order.
    if (m[1] !== '48213') { setError('rw-order', `We can’t find MR-${m[1]}. Check your confirmation email, or try the demo order MR-48213.`); $('#rw-order').focus(); return; }
    setError('rw-order', '');
    find.hidden = true;
    form.hidden = false;
    $('input[name="rw-piece"]:checked', form).focus();
  });
  $('#rw-order').addEventListener('input', () => setError('rw-order', ''));

  // star input
  const WORDS = ['', 'Poor', 'Not great', 'OK', 'Good', 'Excellent'];
  const rateBtns = $$('[data-rw-rate]', form);
  let rating = 0;
  const setRate = (n, focus = false) => {
    rating = n;
    rateBtns.forEach((b, i) => {
      b.setAttribute('aria-checked', String(i + 1 === n));
      b.classList.toggle('is-on', i < n);
      b.tabIndex = (n ? i + 1 === n : i === 0) ? 0 : -1;
      if (focus && i + 1 === n) b.focus();
    });
    $('[data-rw-rate-word]', form).textContent = WORDS[n];
    if (n) setError('rw-rate', '');
  };
  rateBtns.forEach((b, i) => {
    b.addEventListener('click', () => setRate(i + 1));
    b.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      setRate(Math.min(Math.max((rating || i + 1) + (rating ? step : 0), 1), 5), true);
    });
  });

  const body = $('#rw-body');
  body.addEventListener('input', () => { $('[data-rw-body-count]', form).textContent = body.value.trim().length; });
  form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true') setError(e.target.id, ''); });

  // photos
  const photos = $('#rw-photos');
  const FILE_TEXT = $('[data-rw-file-text]').innerHTML;
  photos.addEventListener('change', () => {
    const files = [...photos.files];
    const ok = files.filter((f) => /^image\/(jpeg|png)$/.test(f.type) && f.size <= 10 * 1024 * 1024).slice(0, 4);
    const thumbs = $('[data-rw-thumbs]');
    thumbs.querySelectorAll('img').forEach((img) => URL.revokeObjectURL(img.src));
    thumbs.innerHTML = '';
    ok.forEach((f) => {
      const li = document.createElement('li');
      const img = document.createElement('img');
      img.src = URL.createObjectURL(f);
      img.alt = f.name;
      li.append(img);
      thumbs.append(li);
    });
    const skipped = files.length - ok.length;
    $('[data-rw-file-text]').innerHTML = files.length
      ? `<strong>${ok.length} photo${ok.length === 1 ? '' : 's'} added</strong>${skipped ? `. ${skipped} skipped: JPG or PNG under 10 MB, up to 4.` : '. Choose again to change them.'}`
      : FILE_TEXT;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const checks = [
      ['rw-rate', rating ? '' : 'Choose a star rating.'],
      ['rw-title', val('rw-title').length >= 3 ? '' : 'Add a short title.'],
      ['rw-body', val('rw-body').length >= 40 ? '' : `Tell us a little more: at least 40 characters (you have ${val('rw-body').length}).`],
      ['rw-name', val('rw-name') ? '' : 'Add the name to show with your review, like Hannah R.'],
    ];
    const bad = checks.filter(([id, msg]) => !setError(id, msg));
    if (bad.length) {
      const first = bad[0][0] === 'rw-rate' ? rateBtns.find((b) => b.tabIndex === 0) : document.getElementById(bad[0][0]);
      first.focus();
      return;
    }
    // Replace with a POST to your reviews service.
    const piece = $('input[name="rw-piece"]:checked', form).value;
    $('[data-rw-done-text]', done).textContent = `Your ${rating}-star review of the ${piece} will appear within 48 hours. We’ll email you when it’s live${rating <= 3 ? ', and someone from our team will be in touch about what went wrong' : ''}.`;
    form.hidden = true;
    done.hidden = false;
    done.focus();
  });
  const resetForm = () => {
    form.reset();
    setRate(0);
    $('[data-rw-body-count]', form).textContent = '0';
    $('[data-rw-thumbs]').innerHTML = '';
    $('[data-rw-file-text]').innerHTML = FILE_TEXT;
    $$('.field__error', form).forEach((x) => { x.hidden = true; });
    $$('[aria-invalid]', form).forEach((x) => x.removeAttribute('aria-invalid'));
  };
  $('[data-rw-another]').addEventListener('click', () => {
    resetForm();
    done.hidden = true;
    form.hidden = false;
    $('input[name="rw-piece"]:checked', form).focus();
  });
  $('[data-rw-restart]').addEventListener('click', () => {
    resetForm();
    form.hidden = true;
    find.hidden = false;
    $('#rw-order').value = '';
    $('#rw-order').focus();
  });
})();
