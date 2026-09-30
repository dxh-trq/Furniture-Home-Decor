/* Morrow — trade program: savings calculator (synced to the tier table) and application form.
   Tier thresholds and discounts are in TIERS; send applications to your CRM in the submit handler. */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const calc = $('[data-calc]');
  if (!calc) return;

  const TIERS = [
    { id: 'studio', name: 'Studio', min: 0, rate: 0.15 },
    { id: 'partner', name: 'Partner', min: 25000, rate: 0.2 },
    { id: 'contract', name: 'Contract', min: 100000, rate: 0.25 },
  ];
  const ORDER = TIERS.map((t) => t.id);
  const money = (n) => '$' + Math.round(n).toLocaleString('en-US');

  /* ---------- Calculator ---------- */
  const range = $('#calc-spend');
  const num = $('#calc-num');
  const max = Number(range.max);

  const render = (spend) => {
    const tier = [...TIERS].reverse().find((t) => spend >= t.min);
    const next = TIERS[TIERS.indexOf(tier) + 1];
    $('[data-calc-tier]').textContent = tier.name;
    $('[data-calc-save]').textContent = money(spend * tier.rate);
    $('[data-calc-rate]').textContent = `${Math.round(tier.rate * 100)}%`;
    $('[data-calc-next]').textContent = next
      ? `Spend ${money(next.min - spend)} more a year to reach ${next.name} (${Math.round(next.rate * 100)}%).`
      : 'You’re at our highest tier.';
    $$('[data-perk-tier]').forEach((li) => {
      li.classList.toggle('is-on', ORDER.indexOf(li.dataset.perkTier) <= ORDER.indexOf(tier.id));
    });
    // highlight the matching column in the tier table
    $$('[data-tier-table] [data-col]').forEach((th) => th.classList.toggle('is-current', th.dataset.col === tier.id));
    $$('[data-tier-table] tr').forEach((tr) => {
      [...tr.children].forEach((cellEl, i) => cellEl.classList.toggle('is-current', i > 0 && ORDER[i - 1] === tier.id));
    });
    range.setAttribute('aria-valuetext', money(spend));
    range.style.setProperty('--fill', `${(Math.min(spend, max) / max) * 100}%`);
  };

  range.addEventListener('input', () => {
    num.value = Number(range.value).toLocaleString('en-US');
    render(Number(range.value));
  });
  const fromText = () => {
    const n = Math.max(0, Math.min(10000000, Number(num.value.replace(/[^0-9]/g, '')) || 0));
    range.value = Math.min(n, max);
    render(n);
    return n;
  };
  num.addEventListener('input', fromText);
  num.addEventListener('blur', () => { num.value = fromText().toLocaleString('en-US'); });
  render(Number(range.value));

  /* ---------- Application ---------- */
  const form = $('[data-apply]');
  const setError = (id, msg) => {
    const input = document.getElementById(id);
    const err = document.getElementById(id + '-err');
    input?.setAttribute('aria-invalid', String(!!msg));
    if (err) { err.textContent = msg; err.hidden = !msg; }
    return !msg;
  };
  const val = (id) => document.getElementById(id).value.trim();

  form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true') setError(e.target.id, ''); });
  form.addEventListener('change', (e) => {
    if (e.target.name === 'biz') setError('biz', '');
    if (e.target.id === 'tr-agree') setError('tr-agree', '');
    if (e.target.id === 'tr-spend') setError('tr-spend', '');
    if (e.target.id === 'tr-cert') {
      const f = e.target.files[0];
      setError('tr-cert', f && f.size > 10 * 1024 * 1024 ? 'That file is over 10 MB. Try a smaller PDF or photo.' : '');
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const site = val('tr-site');
    const checks = [
      ['biz', $('input[name="biz"]:checked', form) ? '' : 'Choose the option that fits your business best.'],
      ['tr-first', val('tr-first') ? '' : 'Enter your first name.'],
      ['tr-last', val('tr-last') ? '' : 'Enter your last name.'],
      ['tr-email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('tr-email')) ? '' : 'Enter an email address like name@studio.com.'],
      ['tr-phone', val('tr-phone').replace(/\D/g, '').length >= 10 ? '' : 'Enter a 10-digit phone number.'],
      ['tr-company', val('tr-company') ? '' : 'Enter your business name.'],
      ['tr-site', /^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/i.test(site) ? '' : 'Enter your website or portfolio link, like studio.com.'],
      ['tr-spend', val('tr-spend') ? '' : 'Choose your expected yearly spend.'],
      ['tr-agree', $('#tr-agree').checked ? '' : 'Please agree to the trade terms to continue.'],
    ];
    const certErr = document.getElementById('tr-cert-err');
    const bad = checks.filter(([id, msg]) => !setError(id, msg));
    if (bad.length || !certErr.hidden) {
      const id = bad.length ? bad[0][0] : 'tr-cert';
      (id === 'biz' ? $('input[name="biz"]', form) : document.getElementById(id)).focus();
      return;
    }
    // Replace with a POST to your CRM or trade application inbox (include the certificate file).
    const ref = 'TR-' + Math.floor(1000 + Math.random() * 9000);
    $('[data-apply-text]').textContent = `Thanks, ${val('tr-first')}. Your reference is ${ref}. We’ll email ${val('tr-email')} within two working days. If you need pricing sooner, call the trade team on 1-800-555-0142.`;
    form.hidden = true;
    const done = $('[data-apply-done]');
    done.hidden = false;
    done.focus();
  });
})();
