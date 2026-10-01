/* Morrow — new in: arrivals from the last six months (from each product's `added` date in
   search-index.js) grouped into this month, last month and earlier, a filter, and "notify me"
   sign-ups for pieces coming soon. */
(() => {
  const S = window.MorrowSearch;
  if (!S) return;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const KINDS = { lighting: ['lighting'], decor: ['rugs', 'decor'] };
  const kindOf = (p) => (KINDS.lighting.includes(p.cat) ? 'lighting' : KINDS.decor.includes(p.cat) ? 'decor' : 'furniture');
  const NOW = new Date('2026-10-01'); // the template's "today"; use new Date() in production
  const since = new Date(NOW); since.setMonth(since.getMonth() - 6);
  const fresh = S.products.filter((p) => new Date(p.added) >= since).sort((a, b) => b.added.localeCompare(a.added));

  const box = $('[data-nw-months]');
  const filter = $('[data-nw-filter]');
  let kind = 'all';
  const daysAgo = (p) => Math.round((NOW - new Date(`${p.added}T12:00:00`)) / 864e5);
  const GROUPS = [
    ['Just in', 'the last 30 days', (n) => n <= 30],
    ['Last month', '31 to 60 days ago', (n) => n > 30 && n <= 60],
    ['Earlier this season', 'up to six months ago', (n) => n > 60],
  ];
  const render = () => {
    const list = fresh.filter((p) => kind === 'all' || kindOf(p) === kind);
    const groups = GROUPS.map(([title, sub, test]) => ({ title, sub, items: list.filter((p) => test(daysAgo(p))) })).filter((g) => g.items.length);
    box.innerHTML = groups.length
      ? groups.map(({ title, sub, items }) => `<section class="nw-month" aria-label="${title}">
          <h3 class="nw-month__title">${title} <span>${items.length} piece${items.length === 1 ? "" : "s"}, ${sub}</span></h3>
          <ul class="plp-grid sr-grid">${items.map((p) => S.card(p)).join('')}</ul>
        </section>`).join('')
      : '<p class="nw-empty">Nothing new in this category yet. Check back soon, or see what’s <a class="link" href="#nw-soon-title">coming soon</a>.</p>';
  };
  filter.addEventListener('click', (e) => {
    const b = e.target.closest('[data-kind]');
    if (!b) return;
    kind = b.dataset.kind;
    $$('[data-kind]', filter).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    render();
  });
  S.bindCards(box);
  render();

  /* ---------- Notify me (front end only: send the address to your email platform) ---------- */
  $$('[data-nw-notify]').forEach((form) => form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('input', form);
    const msg = $('.nw-notify__msg', form);
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
    input.setAttribute('aria-invalid', String(!ok));
    msg.className = `nw-notify__msg ${ok ? 'is-success' : 'is-error'}`;
    msg.textContent = ok ? 'Thanks. We’ll email you the day it lands.' : 'Enter an email address like name@example.com.';
    if (ok) { form.classList.add('is-done'); input.disabled = true; $('button', form).disabled = true; $('button', form).textContent = 'You’re on the list'; }
  }));
})();
