/* Morrow — FAQ: search with highlighted matches, deep links, topic rail, expand all, feedback */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const list = $('[data-faq-list]');
  if (!list) return;

  const items = $$('.faq', list);
  const sections = $$('[data-sec]', list);
  const input = $('#faq-q');
  const status = $('[data-faq-status]');
  const defaultStatus = status.textContent;

  // keep the original markup so highlights can be removed cleanly
  items.forEach((it) => {
    it._q = $('.faq__q', it);
    it._a = $('.faq__text', it);
    it._qHTML = it._q.innerHTML;
    it._aHTML = it._a.innerHTML;
  });

  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // wrap matches in <mark>, touching only text nodes so links stay intact
  const highlight = (el, re) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      if (!re.test(node.nodeValue)) return;
      re.lastIndex = 0;
      const frag = document.createDocumentFragment();
      let last = 0;
      node.nodeValue.replace(re, (m, _g, i) => {
        frag.append(node.nodeValue.slice(last, i));
        const mark = document.createElement('mark');
        mark.textContent = m;
        frag.append(mark);
        last = i + m.length;
      });
      frag.append(node.nodeValue.slice(last));
      node.replaceWith(frag);
    });
  };

  let wasOpen = null; // remember which answers were open before searching
  const search = () => {
    const q = input.value.trim();
    $('[data-faq-clear]').hidden = !q;
    $('[data-popular]').hidden = !!q;
    if (q && !wasOpen) wasOpen = new Set(items.filter((i) => i.open));

    const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
    const re = words.length ? new RegExp(`(${words.map(escapeRe).join('|')})`, 'gi') : null;
    let hits = 0;
    items.forEach((it) => {
      it._q.innerHTML = it._qHTML;
      it._a.innerHTML = it._aHTML;
      if (!re) { it.hidden = false; return; }
      const text = (it._q.textContent + ' ' + it._a.textContent).toLowerCase();
      const match = words.every((w) => text.includes(w));
      it.hidden = !match;
      if (match) {
        hits += 1;
        highlight(it._q, re);
        highlight(it._a, re);
        it.open = words.some((w) => it._a.textContent.toLowerCase().includes(w));
      }
    });
    sections.forEach((s) => {
      const n = $$('.faq:not([hidden])', s).length;
      s.hidden = n === 0;
      $(`[data-sec-count="${s.dataset.sec}"]`).textContent = n;
      $(`[data-sec-link="${s.dataset.sec}"]`).classList.toggle('is-empty', n === 0);
    });
    if (!re) {
      status.textContent = defaultStatus;
      if (wasOpen) { items.forEach((it) => { it.open = wasOpen.has(it); }); wasOpen = null; }
    } else {
      status.textContent = hits ? `${hits} ${hits === 1 ? 'answer' : 'answers'} for “${q}”` : '';
    }
    $('[data-faq-empty]').hidden = !re || hits > 0;
    $('[data-faq-empty-q]').textContent = q;
    syncToggle();
    markSection();
  };
  let t;
  input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(search, 120); });
  $('[data-faq-search]').addEventListener('submit', (e) => { e.preventDefault(); search(); });
  $('[data-faq-clear]').addEventListener('click', () => { input.value = ''; search(); input.focus(); });

  /* ---------- Deep links: #faq-<id> opens that answer ---------- */
  const openFromHash = () => {
    const el = location.hash && document.getElementById(location.hash.slice(1));
    if (!el || !el.matches('.faq')) return;
    if (input.value) { input.value = ''; search(); }
    el.open = true;
    el.scrollIntoView({ block: 'start' });
    $('summary', el).focus({ preventScroll: true });
    el.classList.add('is-flash');
    setTimeout(() => el.classList.remove('is-flash'), 1600);
  };
  window.addEventListener('hashchange', openFromHash);
  // keep the address bar pointing at the answer that was opened, so it can be shared
  items.forEach((it) => it.addEventListener('toggle', () => {
    if (it.open && !input.value) history.replaceState(null, '', '#' + it.id);
    syncToggle();
  }));

  /* ---------- Topic rail: mark the section in view ---------- */
  const links = $$('[data-sec-link]');
  let ticking = false;
  const markSection = () => {
    ticking = false;
    const visible = sections.filter((s) => !s.hidden);
    const current = visible.filter((s) => s.getBoundingClientRect().top < window.innerHeight / 3).pop() || visible[0];
    links.forEach((a) => {
      if (current && a.dataset.secLink === current.dataset.sec) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(markSection); } }, { passive: true });

  /* ---------- Expand / collapse all ---------- */
  const toggleBtn = $('[data-toggle-all]');
  function syncToggle() {
    const shown = items.filter((i) => !i.hidden);
    toggleBtn.textContent = shown.length && shown.every((i) => i.open) ? 'Collapse all' : 'Expand all';
  }
  toggleBtn.addEventListener('click', () => {
    const shown = items.filter((i) => !i.hidden);
    const open = !shown.every((i) => i.open);
    shown.forEach((i) => { i.open = open; });
    syncToggle();
  });

  /* ---------- Was this helpful? ---------- */
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-vote]');
    if (!btn) return;
    const box = btn.closest('[data-helpful]');
    box.innerHTML = btn.dataset.vote === 'yes'
      ? '<span>Thanks for letting us know.</span>'
      : '<span>Sorry this didn’t help. <a class="link" href="contact.html">Ask us directly</a> and we’ll reply within one working day.</span>';
    box.setAttribute('tabindex', '-1');
    box.focus();
  });

  markSection();
  syncToggle();
  openFromHash();
})();
