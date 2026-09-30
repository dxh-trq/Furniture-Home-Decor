/* Morrow — legal pages (privacy, terms, cookies, accessibility): contents list that follows the reader, print,
   and (where the page has them) search with highlighted matches and a "summaries only" switch. */
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

  /* ---------- Summaries only ---------- */
  const body = $('[data-legal-body]');
  const shortSwitch = $('[data-legal-short]');
  shortSwitch?.addEventListener('click', () => {
    const on = shortSwitch.getAttribute('aria-checked') !== 'true';
    shortSwitch.setAttribute('aria-checked', String(on));
    body.classList.toggle('is-short', on);
  });

  /* ---------- Search with highlighted matches ---------- */
  const search = $('[data-legal-search]');
  if (search && body) {
    const count = $('[data-legal-count]');
    const prev = $('[data-legal-prev]');
    const next = $('[data-legal-next]');
    let marks = [];
    let index = -1;

    const clear = () => {
      $$('mark.legal-hit', body).forEach((m) => m.replaceWith(document.createTextNode(m.textContent)));
      body.normalize();
      marks = [];
      index = -1;
    };
    const go = (i) => {
      if (!marks.length) return;
      marks[index]?.classList.remove('is-current');
      index = (i + marks.length) % marks.length;
      const m = marks[index];
      m.classList.add('is-current');
      // matches inside a hidden full text: turn summaries off so the match is visible
      if (body.classList.contains('is-short') && m.closest('.legal__full')) shortSwitch.click();
      m.scrollIntoView({ block: 'center' });
      count.textContent = `${index + 1} of ${marks.length}`;
    };
    const find = () => {
      clear();
      const q = search.value.trim();
      if (q.length < 2) { count.textContent = ''; prev.disabled = next.disabled = true; return; }
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => (n.nodeValue.trim() && !n.parentElement.closest('.legal__num') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
      });
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach((node) => {
        const text = node.nodeValue;
        re.lastIndex = 0;
        if (!re.test(text)) return;
        const frag = document.createDocumentFragment();
        let last = 0;
        text.replace(re, (m, at) => {
          frag.append(text.slice(last, at));
          const mark = document.createElement('mark');
          mark.className = 'legal-hit';
          mark.textContent = m;
          frag.append(mark);
          last = at + m.length;
          return m;
        });
        frag.append(text.slice(last));
        node.replaceWith(frag);
      });
      marks = $$('mark.legal-hit', body);
      prev.disabled = next.disabled = marks.length < 2;
      if (marks.length) go(0);
      else count.textContent = 'No matches';
    };
    let timer;
    search.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(find, 200); });
    search.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); go(index + (e.shiftKey ? -1 : 1)); }
    });
    prev.addEventListener('click', () => go(index - 1));
    next.addEventListener('click', () => go(index + 1));
  }

  /* ---------- Print ---------- */
  $('[data-print]')?.addEventListener('click', () => window.print());
})();
