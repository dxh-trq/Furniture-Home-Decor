/* Morrow — article page: table of contents highlight, copy link, "will it fit" doorway checker */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const toast = (msg) => window.Morrow?.toast(msg);

  /* ---------- Table of contents: mark the section being read ---------- */
  const links = $$('[data-toc]');
  const sections = links.map((a) => document.getElementById(a.dataset.toc)).filter(Boolean);
  if (sections.length) {
    let ticking = false;
    const mark = () => {
      ticking = false;
      // the last heading that has scrolled past the top third of the screen
      const current = sections.filter((s) => s.getBoundingClientRect().top < window.innerHeight / 3).pop() || sections[0];
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

  /* ---------- Copy link ---------- */
  $('[data-copy-link]')?.addEventListener('click', async () => {
    const url = location.href.split('#')[0];
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied.');
    } catch {
      toast(`Copy this link: ${url}`);
    }
  });

  /* ---------- Will it fit? ---------- */
  // Alder cross-section when carried on its back: depth 95 cm, height 78 cm (64 cm with legs off).
  const DEPTH = 95;
  const HEIGHT = 78;
  const HEIGHT_NO_LEGS = 64;
  const CLEAR = 2; // a little room for hands and door frames
  const form = $('[data-fit]');
  if (!form) return;
  const result = $('[data-fit-result]');

  const field = (id, min, max, label) => {
    const input = document.getElementById(id);
    const err = document.getElementById(id + '-err');
    const v = Number(input.value);
    const msg = !input.value ? `Enter the ${label} in centimetres.`
      : v < min || v > max ? `Enter a ${label} between ${min} and ${max} cm.` : '';
    input.setAttribute('aria-invalid', String(!!msg));
    err.textContent = msg;
    err.hidden = !msg;
    return msg ? null : v;
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const w = field('fit-w', 40, 300, 'door width');
    const h = field('fit-h', 150, 300, 'door height');
    if (w === null || h === null) {
      result.hidden = true;
      (w === null ? $('#fit-w') : $('#fit-h')).focus();
      return;
    }
    const corner = $('#fit-size').value === 'c';
    let state;
    let title;
    let text;
    if (h < DEPTH + CLEAR) {
      state = 'no';
      title = `Too low by ${DEPTH + CLEAR - h} cm`;
      text = 'The sofa is 95 cm deep, so the door needs to be at least 97 cm tall for it to pass on its back. Talk to us about a window or balcony delivery.';
    } else if (w >= HEIGHT + CLEAR) {
      state = 'yes';
      title = 'It fits, legs on';
      text = `You have ${w - HEIGHT} cm to spare with the legs attached.`;
    } else if (w >= HEIGHT_NO_LEGS + CLEAR) {
      state = 'yes';
      title = 'It fits with the legs off';
      text = `You have ${w - HEIGHT_NO_LEGS} cm to spare once the legs are unscrewed. Our delivery team does this for you.`;
    } else {
      state = 'no';
      title = `Too tight by ${HEIGHT_NO_LEGS + CLEAR - w} cm`;
      text = 'Check whether the door can come off its hinges, which usually adds 3–4 cm. Or book a free call and we’ll look at other routes in.';
    }
    if (corner && state === 'yes') text += ' The corner sofa arrives in two pieces, and each one passes the same way.';
    result.className = `fit__result fit__result--${state}`;
    result.innerHTML = '<p class="fit__verdict"></p><p></p>';
    result.firstChild.textContent = title;
    result.lastChild.textContent = text;
    result.hidden = false;
  });
})();
