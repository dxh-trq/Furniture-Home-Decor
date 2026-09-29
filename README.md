# Furniture & Home Decor — Ecommerce Template

Planning docs:

- [Design inspiration — 10 reference websites](docs/01-inspiration.md)
- [Sitemap & page inventory](docs/02-sitemap.md)

## Pages

- `index.html` — homepage (styles in `assets/css/style.css`, scripts in `assets/js/main.js`)
- `shop.html` — product listing page (category: Living room). Filtering, sorting and load more in `assets/js/shop.js`.
  Product data lives on each card as `data-*` attributes (`data-category`, `data-price`, `data-material`, `data-colour`, `data-stock`, `data-rating`, `data-added`, `data-popularity`, `data-sale`).
  Filters can be preset from the URL, e.g. `shop.html?c=sofas`, `shop.html?sale=1`, `shop.html?new=1`.

- `product.html` — product detail page (Alder sofa). Gallery, options, delivery check, sticky add-to-cart bar and reviews in `assets/js/product.js`.
  Fabric, size and leg options are radio inputs with `data-*` values (`data-hex`, `data-price`, `data-w`/`data-d`/`data-h`, `data-stock`); the page updates price, title, dimensions, stock and illustration colours from them.

- `cart.html` — cart page with demo items. Quantities, remove with undo, save for later, delivery choice, promo codes and totals in `assets/js/cart.js`.
  Each line is an `<li class="line">` with `data-price` and `data-stock` (`in` or `order`, which decides its delivery group).
  Delivery rules and promo codes are constants at the top of `cart.js` (demo code: `WELCOME10`, 10% off). Validate codes on your server in production.

- `checkout.html` — checkout with its own minimal header and footer. Three steps (contact and address, delivery, payment) and an in-page order confirmation, in `assets/js/checkout.js`.
  Includes delivery access details (floor, elevator, narrow doorways), a delivery-day picker, card number formatting with brand detection and Luhn check, and inline validation.
  Front end only: connect your payment provider and order API in `placeOrder()`. Tax rates in `checkout.js` are demo values.

- `account.html` — customer account: overview with delivery tracking, orders, wishlist, swatches, addresses, payment methods and settings, in `assets/js/account.js`.
  Sections are linkable (`account.html#orders`). Signing out shows the sign-in / create-account forms (`account.html#sign-in`).
  Front end only: connect the forms to your auth and customer APIs.

- `wishlist.html` — saved pieces grouped into room boards, with a "See it together" room preview that draws the saved pieces in one room with their total. Logic in `assets/js/wishlist.js`.
  Each card has `data-board` (`living`, `dining`, `bedroom`), `data-price`, `data-added` and `data-drop` for price drops; the room scenes place pieces with `data-for="<card id>"`.

- `blog.html` — journal index: featured story, topic filter, search and load more, in `assets/js/blog.js`. Each card has `data-cat` and `data-title`.
- `blog-post.html` — article template (sofa sizing guide): contents list that follows the reader, doorway diagram, "Will it fit?" doorway checker, shoppable product card, author box and related articles, in `assets/js/post.js`.
  The Alder sofa dimensions used by the checker are constants at the top of the checker code.

- `about.html` — brand story: opening, founding story and timeline, a "What goes into an Alder sofa" exploded diagram (pick a layer to see materials, origin, lifespan and replacement cost, in `assets/js/about.js`), principles, sustainability, makers, team, showrooms, and careers / design call.
  Founders, team, makers and figures are placeholder content to replace with your own.

- `contact.html` — contact channels (with a live open/closed status for the phone line in New York time), a message form that adapts to the chosen topic (order number, damage photos, company name, phone), quick answers per topic, and showrooms. Logic in `assets/js/contact.js`.
  Opening hours and time zone are constants at the top of `contact.js`. Front end only: post the form to your help desk in `send()`.

- `faq.html` — help centre with 29 answers in 7 topics: search with highlighted matches, most-asked shortcuts, a topic rail that follows the reader, expand / collapse all, "Was this helpful?" feedback, and linkable answers (`faq.html#faq-pets` opens that answer). Logic in `assets/js/faq.js`.
  Includes FAQPage structured data (JSON-LD) in the page head; update it when you edit the answers.

- `stores.html` — showroom locator: search by city or ZIP, or use the browser's location, to sort showrooms by distance; an illustrated map with pins (select a pin or a card); live open / closed status in each showroom's time zone; filters; and design-appointment booking. Logic in `assets/js/stores.js`.
  Each card has `data-lat`, `data-lng`, `data-tz` and `data-hours` (JSON, Sunday first). City and ZIP lookup uses a small built-in table; replace `locate()` with a geocoding API for full coverage.

- `404.html` — page-not-found: an empty room with a "Sofa not found" outline, the address that was requested, page suggestions based on it (e.g. `/sofas-old` suggests Sofas), site search, quick links and popular products. Logic in `assets/js/404.js` (the `PAGES` list is the search index; add new pages there).
  Hosting: most static hosts (Netlify, Vercel, GitHub Pages, Cloudflare Pages) serve `404.html` automatically. On Apache add `ErrorDocument 404 /404.html`; on nginx `error_page 404 /404.html;`.
  A missing page can be requested at any depth (e.g. `/lighting/old`), so `404.html` resolves links from the site root when served over http(s). If the site lives in a subfolder, set `SITE_ROOT` in the small script at the top of `404.html` to that path (e.g. `/Furniture-Home-Decor/`).

- `services.html` — design services: three service options, how it works, a 4-step booking form (service, room, time, details) with a live summary and confirmation, and the free swatch picker at `services.html#swatches` (up to 6 from 14 fabrics). Logic in `assets/js/services.js`.
  Available times are simulated; connect your scheduling tool and swatch fulfilment in the two submit handlers.

- `trade.html` — trade program: benefits, a savings calculator (yearly spend → tier, discount, savings and unlocked perks, synced with the tier table), contract specifications, project case studies, an application form with resale-certificate upload, and trade FAQs. Logic in `assets/js/trade.js`; tier thresholds and discounts are in `TIERS`.

- `returns.html` — returns: the 30-day policy, how it works, a 3-step "Start a return" tool (find order → choose items, reasons and refund type → home collection day or label / showroom drop-off → confirmation), a table of what can be returned, exchanges, damage and refund timing, and return FAQs. Logic in `assets/js/returns.js`.
  Front end only: `DEMO_ORDER` stands in for your order API (replace `lookup()` and the final submit). The return window and store-credit bonus are `WINDOW_DAYS` and `CREDIT_BONUS`. Items with `finalSale: true` can't be picked; items with `furniture: true` need a collection day.

- `shipping.html` — delivery (kept at the address the footer already links to): a ZIP delivery checker (nearest of seven hubs on the map, earliest date or made-to-order window, days you could choose, evening availability, and the cost with white glove and the free-delivery threshold), a comparison of the two services, a delivery-day timeline, lead times for in-stock and made-to-order pieces, a "get ready" checklist remembered on the device, and delivery FAQs. Logic in `assets/js/delivery.js`.
  Prices and lead times are constants at the top (`FREE_OVER`, `STANDARD`, `WHITE_GLOVE`, `DISPATCH_DAYS`, `MADE_WEEKS`); keep them in step with `cart.js` and `checkout.js`. Hubs are the `data-hub` pins in the map. ZIP lookup is a rough table by ZIP prefix; use your carrier's API in production.

- `warranty.html` — warranty: cover summary, a "What's covered on your piece" checker (choose a furniture type and delivery date to see each part's cover on a 10-year timeline, with what's still covered today), covered / not covered lists, how a claim works, a claim form with photo thumbnails and a note for issues that usually aren't covered, parts and repairs beyond the warranty, and warranty FAQs. Logic in `assets/js/warranty.js`.
  Cover lengths per part are in `COVER`. Front end only: send claims (with `files`) to your help desk in the submit handler.

Product images are inline SVG placeholders (see the sprite at the top of `index.html`).
Replace any `<svg class="art">` with an `<img>` when you add photography.
