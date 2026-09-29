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

Product images are inline SVG placeholders (see the sprite at the top of `index.html`).
Replace any `<svg class="art">` with an `<img>` when you add photography.
