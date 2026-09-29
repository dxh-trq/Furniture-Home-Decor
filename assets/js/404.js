/* Morrow — 404: show the missing address, suggest pages from it, and search the site */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const form = $('[data-nf-search]');
  if (!form) return;

  // Every page in the template, with words people are likely to type or have in an old link.
  const PAGES = [
    { url: 'index.html', title: 'Homepage', keys: 'home start morrow' },
    { url: 'shop.html', title: 'Living room furniture', keys: 'shop living room furniture all products catalogue collection' },
    { url: 'shop.html?c=sofas', title: 'Sofas', keys: 'sofa sofas couch couches settee sectional loveseat alder' },
    { url: 'shop.html?c=chairs', title: 'Armchairs', keys: 'chair chairs armchair armchairs lounge ren otto' },
    { url: 'shop.html?c=tables', title: 'Coffee and side tables', keys: 'table tables coffee side travertine drift tove' },
    { url: 'shop.html?c=storage', title: 'Storage and sideboards', keys: 'storage sideboard sideboards cabinet credenza stilla' },
    { url: 'shop.html?c=lighting', title: 'Lighting', keys: 'lighting light lights lamp lamps pendant floor lumen halo' },
    { url: 'shop.html?c=rugs', title: 'Rugs', keys: 'rug rugs carpet wool mira' },
    { url: 'shop.html?c=decor', title: 'Decor', keys: 'decor mirror mirrors vase vases planter plants accessories' },
    { url: 'shop.html?sale=1', title: 'Sale', keys: 'sale sales offers discount deals clearance outlet' },
    { url: 'shop.html?new=1', title: 'New in', keys: 'new arrivals latest' },
    { url: 'product.html', title: 'Alder sofa', keys: 'alder sofa product boucle linen fabric' },
    { url: 'cart.html', title: 'Your cart', keys: 'cart basket bag' },
    { url: 'checkout.html', title: 'Checkout', keys: 'checkout pay payment order' },
    { url: 'account.html', title: 'Your account', keys: 'account login log in sign in signin profile my orders' },
    { url: 'account.html#orders', title: 'Your orders and tracking', keys: 'orders order track tracking delivery status invoice' },
    { url: 'wishlist.html', title: 'Wishlist', keys: 'wishlist wish list saved favourites favorites heart' },
    { url: 'blog.html', title: 'Journal', keys: 'journal blog articles stories inspiration ideas guides' },
    { url: 'blog-post.html', title: 'How to choose a sofa that fits', keys: 'sofa guide size sizing measure doorway fit buying' },
    { url: 'about.html', title: 'About us', keys: 'about story company team sustainability makers workshop' },
    { url: 'contact.html', title: 'Contact us', keys: 'contact help support email phone call customer service' },
    { url: 'faq.html', title: 'Help and FAQs', keys: 'faq faqs help questions support' },
    { url: 'returns.html', title: 'Returns', keys: 'return returns refund refunds exchange policy' },
    { url: 'shipping.html', title: 'Delivery', keys: 'delivery deliveries shipping ship how long white glove zip dates cost' },
    { url: 'warranty.html', title: 'Warranty and repairs', keys: 'warranty guarantee repair repairs damaged broken claim parts' },
    { url: 'stores.html', title: 'Showrooms', keys: 'stores store showroom showrooms shop locations visit near me locator' },
  ];

  const words = (s) => s.toLowerCase().replace(/\.(html?|php|aspx?)$/, '').split(/[^a-z0-9]+/).filter((w) => w.length > 1);
  // score a page by how many words match its title or keywords (prefix matches count, so "sof" finds sofas)
  const rank = (terms) => PAGES.map((p) => {
    const hay = words(p.title + ' ' + p.keys);
    const score = terms.reduce((s, t) => s + (hay.includes(t) ? 3 : hay.some((h) => h.startsWith(t) || (t.length > 3 && t.startsWith(h))) ? 1 : 0), 0);
    return { ...p, score };
  }).filter((p) => p.score > 0).sort((a, b) => b.score - a.score);

  const item = (p) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = p.url;
    a.innerHTML = '<strong></strong><span></span>';
    a.firstChild.textContent = p.title;
    a.lastChild.textContent = p.url;
    li.appendChild(a);
    return li;
  };

  /* ---------- The address that was requested ---------- */
  const path = decodeURIComponent(location.pathname.replace(/^\/+/, '')) + location.search;
  const isThisFile = /(^|\/)404\.html$/i.test(path) || location.protocol === 'file:';
  if (path && !isThisFile) {
    $('[data-nf-path]').textContent = '/' + path;
    $('[data-nf-path-wrap]').hidden = false;
    const suggestions = rank(words(path)).slice(0, 3);
    if (suggestions.length) {
      suggestions.forEach((p) => $('[data-nf-suggest-list]').appendChild(item(p)));
      $('[data-nf-suggest]').hidden = false;
    }
  }

  /* ---------- Back button, only if there's somewhere to go back to ---------- */
  if (history.length > 1 && document.referrer) {
    const back = $('[data-nf-back]');
    back.hidden = false;
    back.addEventListener('click', () => history.back());
  }

  /* ---------- Site search ---------- */
  const input = $('#nf-q');
  const results = $('[data-nf-results]');
  const show = (submit) => {
    const q = input.value.trim();
    results.innerHTML = '';
    if (!q) return [];
    const found = rank(words(q)).slice(0, 5);
    if (found.length) found.forEach((p) => results.appendChild(item(p)));
    else if (submit) {
      const li = document.createElement('li');
      li.className = 'nf-results__none';
      li.innerHTML = 'Nothing matches that. Try one word, like sofa or delivery, or <a href="contact.html">ask us</a>.';
      results.appendChild(li);
    }
    return found;
  };
  let t;
  input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => show(false), 120); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const found = show(true);
    if (found.length) $('a', results).focus();
  });
})();
