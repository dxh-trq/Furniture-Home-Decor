/* Morrow — designers & makers: directory filters, profile dialog (linkable, e.g. designers.html#p-signe-holm),
   "trace a piece" tabs, event places and the pitch form. Front end only: send pitches to your inbox in the submit handler. */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const grid = $('[data-dn-grid]');
  if (!grid) return;

  /* ---------- Directory filters ---------- */
  const cards = $$('.dn-card', grid);
  const chips = $$('[data-dn-kind]');
  const search = $('[data-dn-search]');
  let kind = 'all';
  const LABEL = { all: ['designer and workshop', 'designers and workshops'], designer: ['designer', 'designers'], maker: ['workshop', 'workshops'] };

  const filter = () => {
    const q = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    cards.forEach((c) => {
      const ok = (kind === 'all' || c.dataset.kind === kind) && q.every((w) => c.dataset.text.includes(w));
      c.hidden = !ok;
      if (ok) shown += 1;
    });
    const [one, many] = LABEL[kind];
    $('[data-dn-count]').textContent = `${shown} ${shown === 1 ? one : many}`;
    $('[data-dn-empty]').hidden = shown > 0;
  };
  const setKind = (k) => {
    kind = k;
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.dnKind === k)));
    filter();
  };
  chips.forEach((c) => c.addEventListener('click', () => setKind(c.dataset.dnKind)));
  search.addEventListener('input', filter);
  $('[data-dn-reset]').addEventListener('click', () => { search.value = ''; setKind('all'); search.focus(); });

  /* ---------- Profile dialog ---------- */
  const dialog = $('[data-dn-dialog]');
  const body = $('[data-dn-body]', dialog);
  const pos = $('[data-dn-pos]', dialog);
  let current = null;
  let opener = null;

  // browse within the people currently shown, or everyone if the profile was opened from elsewhere
  const pool = () => {
    const shown = cards.filter((c) => !c.hidden);
    return current && shown.includes(current) ? shown : cards;
  };
  const show = (card) => {
    current = card;
    body.replaceChildren($('template', card).content.cloneNode(true));
    const list = pool();
    pos.textContent = `${list.indexOf(card) + 1} of ${list.length}`;
    body.scrollTop = 0;
    dialog.scrollTop = 0;
    history.replaceState(null, '', `#${card.id}`);
  };
  const open = (id, from) => {
    const card = document.getElementById(`p-${id}`);
    if (!card) return;
    opener = from || null;
    show(card);
    if (!dialog.open) {
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    }
    $('[data-dn-close]', dialog).focus();
  };
  const close = () => dialog.close();
  dialog.addEventListener('close', () => {
    document.body.style.overflow = '';
    history.replaceState(null, '', location.pathname + location.search);
    (opener || $('.dn-card__open', current))?.focus();
    current = null;
  });
  $$('[data-dn-step]', dialog).forEach((b) => b.addEventListener('click', () => {
    const list = pool();
    const i = list.indexOf(current);
    show(list[(i + Number(b.dataset.dnStep) + list.length) % list.length]);
  }));
  dialog.addEventListener('keydown', (e) => {
    if (e.target.closest('a, input, textarea')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      $(`[data-dn-step="${e.key === 'ArrowRight' ? 1 : -1}"]`, dialog).click();
    }
  });
  $('[data-dn-close]', dialog).addEventListener('click', close);
  dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); }); // click on the backdrop
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-dn-open]');
    if (b) open(b.dataset.dnOpen, b);
  });
  const fromHash = () => {
    const m = location.hash.match(/^#p-([\w-]+)$/);
    if (m && document.getElementById(`p-${m[1]}`)) open(m[1]);
  };
  window.addEventListener('hashchange', fromHash);
  fromHash();

  /* ---------- Trace a piece ---------- */
  const tabs = $$('[data-trace]');
  const pick = (t, focus = false) => {
    tabs.forEach((x) => {
      const on = x === t;
      x.setAttribute('aria-selected', String(on));
      x.tabIndex = on ? 0 : -1;
    });
    $$('[data-trace-panel]').forEach((p) => { p.hidden = p.dataset.tracePanel !== t.dataset.trace; });
    if (focus) t.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => pick(t));
    t.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (step) { e.preventDefault(); pick(tabs[(i + step + tabs.length) % tabs.length], true); }
      if (e.key === 'Home') { e.preventDefault(); pick(tabs[0], true); }
      if (e.key === 'End') { e.preventDefault(); pick(tabs[tabs.length - 1], true); }
    });
  });

  /* ---------- Events ---------- */
  $$('[data-dn-event]').forEach((b) => {
    const idle = b.textContent;
    b.addEventListener('click', () => {
      const on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', String(on));
      b.textContent = on ? (idle === 'Remind me' ? 'Reminder set' : 'Place saved') : idle;
      window.Morrow?.toast(on
        ? `${idle === 'Remind me' ? 'We’ll email you a link before' : 'We’ve saved you a place at'} ${b.dataset.dnEvent}`
        : `Cancelled: ${b.dataset.dnEvent}`);
    });
  });

  /* ---------- Pitch form ---------- */
  const form = $('[data-dn-form]');
  const done = $('[data-dn-done]');
  const idea = $('#dn-idea');
  const ideaLabel = $('[data-dn-idea-label]');
  const prompt = (k) => (k === 'workshop' ? 'What does your workshop make, and how many people work there?' : 'What would you design for Morrow?');
  const kindVal = () => $('input[name="dn-kind"]:checked', form).value;
  $$('input[name="dn-kind"]', form).forEach((r) => r.addEventListener('change', () => { ideaLabel.textContent = prompt(kindVal()); }));
  idea.addEventListener('input', () => { $('[data-dn-idea-count]').textContent = idea.value.length.toLocaleString('en-US'); });

  const setError = (id, msg) => {
    const input = document.getElementById(id);
    const err = document.getElementById(id + '-err');
    input?.setAttribute('aria-invalid', String(!!msg));
    if (err) { err.textContent = msg; err.hidden = !msg; }
    return !msg;
  };
  const val = (id) => document.getElementById(id).value.trim();
  const isUrl = (s) => { try { return /^https?:$/.test(new URL(/^\w+:\/\//.test(s) ? s : `https://${s}`).protocol) && /\.\w{2,}/.test(s); } catch (err) { return false; } };
  form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true') setError(e.target.id, ''); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const checks = [
      ['dn-name', val('dn-name') ? '' : 'Enter your name or your studio’s name.'],
      ['dn-email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('dn-email')) ? '' : 'Enter an email address, like name@example.com.'],
      ['dn-where', val('dn-where') ? '' : 'Tell us the city and country you work in.'],
      ['dn-link', isUrl(val('dn-link')) ? '' : 'Enter a link to your work, like https://yourstudio.com.'],
      ['dn-idea', val('dn-idea').length >= 20 ? '' : 'Tell us a little more, at least a sentence or two.'],
    ];
    const bad = checks.filter(([id, msg]) => !setError(id, msg));
    if (bad.length) { document.getElementById(bad[0][0]).focus(); return; }
    // Replace with a POST to your inbox or form service.
    const who = kindVal() === 'workshop' ? 'sourcing' : 'design';
    $('[data-dn-done-text]').textContent = `Our ${who} team will read it and reply to ${val('dn-email')} within three weeks.`;
    form.hidden = true;
    done.hidden = false;
    done.focus();
  });
  $('[data-dn-again]').addEventListener('click', () => {
    form.reset();
    $('[data-dn-idea-count]').textContent = '0';
    ideaLabel.textContent = prompt('furniture');
    form.hidden = false;
    done.hidden = true;
    $('#dn-name').focus();
  });
})();
