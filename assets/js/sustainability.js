/* Morrow — sustainability page: footprint breakdown (select a stage) and the "keep it longer" comparison.
   Footprint figures live in the page (the bar and its <template data-stage> notes); lifespan assumptions are below. */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const detail = $('[data-su-detail]');
  if (!detail) return;

  /* ---------- Footprint breakdown ---------- */
  const stages = $$('template[data-stage]');
  const total = stages.reduce((s, t) => s + Number(t.dataset.kg), 0);
  const select = (id) => {
    const t = stages.find((s) => s.dataset.stage === id);
    $('[data-su-kg]').textContent = t.dataset.kg;
    $('[data-su-pct]').textContent = `· ${Math.round((Number(t.dataset.kg) / total) * 100)}% of the total`;
    $('[data-su-label]').textContent = t.dataset.label;
    $('[data-su-text]').replaceChildren(t.content.cloneNode(true));
    $$('[data-seg]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.seg === id)));
  };
  $$('[data-seg]').forEach((b) => {
    b.addEventListener('click', () => select(b.dataset.seg));
    b.addEventListener('mouseenter', () => { if (matchMedia('(hover: hover)').matches) select(b.dataset.seg); });
  });
  select($('.su-key[aria-pressed="true"]').dataset.seg);

  /* ---------- Keep it longer ---------- */
  const OURS = total; // kg CO2e for one Alder sofa
  const COVERS = 30; // kg for a new set of covers
  const COVERS_EVERY = 10; // years
  const TYPICAL = 240; // kg for a typical sofa
  const TYPICAL_LIFE = 7; // years
  const range = $('#su-years');

  const render = () => {
    const years = Number(range.value);
    const refreshes = Math.floor((years - 1) / COVERS_EVERY);
    const ours = OURS + refreshes * COVERS;
    const sofas = Math.ceil(years / TYPICAL_LIFE);
    const theirs = sofas * TYPICAL;
    const perOurs = ours / years;
    const perTheirs = theirs / years;
    const max = Math.max(perOurs, perTheirs);
    $('[data-su-years]').textContent = `${years} years`;
    range.setAttribute('aria-valuetext', `${years} years`);
    range.style.setProperty('--fill', `${((years - 5) / 25) * 100}%`);
    $('[data-su-ours]').textContent = Math.round(perOurs);
    $('[data-su-them]').textContent = Math.round(perTheirs);
    $('[data-su-ours-bar]').style.width = `${(perOurs / max) * 100}%`;
    $('[data-su-them-bar]').style.width = `${(perTheirs / max) * 100}%`;
    $('[data-su-ours-note]').textContent = refreshes ? `${ours} kg in total, with ${refreshes} set${refreshes > 1 ? 's' : ''} of new covers` : `${ours} kg in total`;
    $('[data-su-them-note]').textContent = `${sofas} sofa${sofas > 1 ? 's' : ''}, ${theirs.toLocaleString('en-US')} kg in total`;
    const saved = theirs - ours;
    $('[data-su-result]').innerHTML = saved > 0
      ? `Over ${years} years that’s <strong>${saved.toLocaleString('en-US')} kg less CO₂e</strong>, about the same as ${Math.round(saved / 0.4).toLocaleString('en-US')} miles in an average car, and ${sofas - 1 || 'no'} fewer sofa${sofas - 1 === 1 ? '' : 's'} in landfill.`
      : `Over just ${years} years, a well-made sofa costs slightly more carbon up front. Its footprint drops below a typical sofa’s once you keep it past ${TYPICAL_LIFE} years.`;
  };
  range.addEventListener('input', render);
  render();

  /* ---------- Report (placeholder link) ---------- */
  $('[data-su-report]')?.addEventListener('click', (e) => {
    if (e.currentTarget.getAttribute('href') !== '#') return;
    e.preventDefault();
    window.Morrow?.toast('The 2026 report will be available to download soon.');
  });
})();
