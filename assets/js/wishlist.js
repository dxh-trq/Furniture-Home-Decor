/* Morrow — wishlist page: room boards, sorting, remove + undo, move to cart, room preview. */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const grid = $('[data-grid]');
  if (!grid) return;

  const BOARD_NAMES = { living: 'Living room', dining: 'Dining room', bedroom: 'Bedroom' };
  const toast = (msg) => window.Morrow?.toast(msg);
  const money = (n) => '$' + n.toLocaleString('en-US');
  const setText = (sel, text) => $$(sel).forEach((el) => { el.textContent = text; });
  const nameOf = (card) => $('.card__name', card).textContent.trim();
  const cards = () => $$('.wcard', grid);
  let board = 'all';

  const sorters = {
    recent: (a, b) => b.dataset.added.localeCompare(a.dataset.added),
    drops: (a, b) => ('drop' in b.dataset) - ('drop' in a.dataset) || a.dataset.order - b.dataset.order,
    'price-asc': (a, b) => a.dataset.price - b.dataset.price,
    'price-desc': (a, b) => b.dataset.price - a.dataset.price,
  };

  const render = () => {
    const all = cards();
    const inBoard = (el) => board === 'all' || el.dataset.board === board;

    // sort the cards currently in the list (undo notes keep their place at the end)
    all.sort(sorters[$('[data-sort]').value]).forEach((c) => grid.appendChild(c));
    $$('.wl-removed', grid).forEach((n) => grid.appendChild(n));
    all.forEach((c) => { c.hidden = !inBoard(c); });
    $$('.wl-removed', grid).forEach((n) => { n.hidden = !inBoard(n); });

    // counts
    setText('[data-total-count]', all.length);
    Object.keys(BOARD_NAMES).concat('all').forEach((k) => {
      setText(`[data-board-count="${k}"]`, k === 'all' ? all.length : all.filter((c) => c.dataset.board === k).length);
    });
    const drops = all.filter((c) => 'drop' in c.dataset).length;
    $('[data-drop-alert]').hidden = drops === 0;
    $('[data-drop-text]').innerHTML = drops === 1
      ? '<strong>1 piece</strong> is cheaper than when you saved it.'
      : `<strong>${drops} pieces</strong> are cheaper than when you saved them.`;

    // empty states
    const shown = all.filter(inBoard).length;
    const empty = $('[data-empty]');
    const hasNotes = $$('.wl-removed:not([hidden])', grid).length > 0;
    empty.hidden = shown > 0;
    if (!all.length) {
      setText('[data-empty-title]', 'Nothing saved yet');
      setText('[data-empty-text]', 'Tap the heart on any piece and it will wait for you here.');
    } else if (!shown) {
      setText('[data-empty-title]', `Nothing saved for the ${BOARD_NAMES[board].toLowerCase()} yet`);
      setText('[data-empty-text]', 'Pick another room above, or browse and save a few pieces.');
    }
    $('[data-add-all]').disabled = shown === 0;
    $('.wl-layout').hidden = shown === 0 && !hasNotes;

    renderRoom(all);
  };

  /* ---------- Room preview ---------- */
  const renderRoom = (all) => {
    const present = new Set(all.map((c) => c.dataset.id));
    // "All" shows the first room that has something in it
    const sceneBoard = board !== 'all' ? board
      : Object.keys(BOARD_NAMES).find((k) => all.some((c) => c.dataset.board === k));
    const room = $('[data-room]');
    const items = all.filter((c) => c.dataset.board === sceneBoard);
    room.hidden = !sceneBoard || items.length === 0;
    if (room.hidden) return;

    $$('[data-scene]').forEach((g) => g.setAttribute('display', g.dataset.scene === sceneBoard ? 'inline' : 'none'));
    $$('[data-scene] [data-for]').forEach((el) => el.setAttribute('display', present.has(el.dataset.for) ? 'inline' : 'none'));

    const total = items.reduce((sum, c) => sum + Number(c.dataset.price), 0);
    setText('[data-room-name]', BOARD_NAMES[sceneBoard]);
    setText('[data-room-count]', items.length);
    setText('[data-room-total]', money(total));
    $('[data-room-desc]').textContent = `${BOARD_NAMES[sceneBoard]} with ${items.map(nameOf).join(', ')}.`;
  };

  /* ---------- Filters + sort ---------- */
  $$('[data-board-filter]').forEach((btn) => btn.addEventListener('click', () => {
    board = btn.dataset.boardFilter;
    $$('[data-board-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    render();
  }));
  $('[data-sort]').addEventListener('change', render);
  $('[data-show-drops]').addEventListener('click', () => {
    $('[data-sort]').value = 'drops';
    $('[data-board-filter="all"]').click();
    $('.wcard:not([hidden]) .card__name a', grid)?.focus();
  });

  /* ---------- Card actions ---------- */
  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.wcard');
    if (!card) return;

    if (e.target.closest('[data-remove]')) {
      $$('.wl-removed', grid).forEach((n) => n.remove()); // one undo at a time
      const note = document.createElement('li');
      note.className = 'wl-removed';
      note.dataset.board = card.dataset.board;
      note.innerHTML = '<p></p><button type="button" class="line__action">Undo</button>';
      note.firstChild.textContent = `Removed ${nameOf(card)}.`;
      card.replaceWith(note);
      note.lastChild.addEventListener('click', () => {
        note.replaceWith(card);
        render();
        $('.card__name a', card).focus();
      });
      render();
      note.lastChild.focus();
    }

    if (e.target.closest('[data-move]')) {
      window.Morrow?.addToCart(1);
      toast(`Moved ${nameOf(card)} to your cart`);
      const next = card.nextElementSibling?.matches('.wcard:not([hidden])') ? card.nextElementSibling : null;
      card.remove();
      render();
      (next ? $('.card__name a', next) : $('[data-sort]')).focus();
    }
  });

  /* ---------- Header actions ---------- */
  $('[data-add-all]').addEventListener('click', () => {
    const shown = cards().filter((c) => !c.hidden);
    window.Morrow?.addToCart(shown.length);
    toast(`Added ${shown.length} ${shown.length === 1 ? 'piece' : 'pieces'} to your cart. They’re still saved here too.`);
  });
  $('[data-share]').addEventListener('click', async () => {
    const url = location.href.split('#')[0];
    try {
      await navigator.clipboard.writeText(url);
      toast('Link to your wishlist copied.');
    } catch {
      toast(`Copy this link to share: ${url}`);
    }
  });

  render();
})();
