/* Morrow — legal pages (privacy, terms, cookies, accessibility): contents list that follows the reader, and print. */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ---------- Contents: mark the section being read ---------- */
  const links = $$('.legal__toc [data-toc]');
  const sections = links.map((a) => document.getElementById(a.dataset.toc)).filter(Boolean);
  if (sections.length) {
    let ticking = false;
    const mark = () => {
      ticking = false;
      // the last heading that has scrolled past the top third of the screen
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      const current = atEnd ? sections[sections.length - 1] : sections.filter((s) => s.getBoundingClientRect().top < window.innerHeight / 3).pop() || sections[0];
      links.forEach((a) => {
        if (a.dataset.toc === current.id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(mark); }
    }, { passive: true });
    mark();
  }

  /* ---------- Print ---------- */
  $('[data-print]')?.addEventListener('click', () => window.print());
})();
