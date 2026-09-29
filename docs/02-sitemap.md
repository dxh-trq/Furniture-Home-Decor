# Sitemap — Furniture & Home Decor Ecommerce Template

## Visual overview

```
Home
├── Shop
│   ├── Shop All
│   ├── Shop by Room
│   │   ├── Living Room
│   │   ├── Bedroom
│   │   ├── Dining Room
│   │   ├── Home Office
│   │   ├── Kids' Room
│   │   ├── Bathroom
│   │   └── Outdoor
│   ├── Shop by Category
│   │   ├── Furniture   → Sofas, Chairs, Tables, Beds, Storage, Desks
│   │   ├── Lighting    → Pendants, Floor Lamps, Table Lamps, Wall Lights
│   │   ├── Decor       → Mirrors, Wall Art, Vases, Candles, Clocks
│   │   ├── Textiles    → Rugs, Cushions, Throws, Curtains, Bedding
│   │   └── Kitchen & Dining → Tableware, Glassware, Serveware
│   ├── Collections (curated sets, e.g. "Nordic Calm", "Warm Minimal")
│   ├── New Arrivals
│   ├── Best Sellers
│   ├── Sale / Clearance
│   └── Gift Cards
│
├── Product Listing Page (PLP) — filters, sort, grid/list view
│   └── Product Detail Page (PDP) — gallery, variants, dimensions, reviews, related
│
├── Inspiration
│   ├── Lookbooks (shoppable room scenes)
│   ├── Journal / Blog
│   │   └── Blog Post
│   ├── Style Guides (Scandinavian, Boho, Industrial, Japandi…)
│   └── Customer Homes (UGC gallery)
│
├── Services
│   ├── Free Design Consultation
│   ├── Room Planner / 3D Configurator
│   ├── Free Fabric & Material Swatches
│   ├── Trade / B2B Program
│   └── Financing
│
├── About
│   ├── Our Story
│   ├── Designers & Makers
│   │   └── Designer Profile
│   ├── Sustainability
│   ├── Showrooms / Store Locator
│   ├── Careers
│   └── Press
│
├── Help Center
│   ├── FAQ
│   ├── Shipping & Delivery
│   ├── Returns & Exchanges
│   ├── Warranty
│   ├── Care & Assembly Guides
│   ├── Track Order
│   └── Contact Us
│
├── Account
│   ├── Login / Register / Forgot Password
│   ├── Dashboard
│   ├── Orders & Order Detail
│   ├── Addresses
│   ├── Payment Methods
│   ├── Wishlist
│   ├── Saved Designs / Swatches
│   └── Account Settings
│
├── Cart (+ slide-out mini cart)
├── Checkout
│   ├── Shipping Information
│   ├── Delivery Options (standard / white-glove / assembly)
│   ├── Payment
│   └── Order Confirmation
│
├── Search Results (+ no-results state)
│
└── Utility / Legal
    ├── Privacy Policy
    ├── Terms & Conditions
    ├── Cookie Policy
    ├── Accessibility Statement
    ├── Newsletter Signup
    ├── 404 Page
    └── Coming Soon / Maintenance
```

## Page inventory (template deliverables)

| Priority | Page | Template file | Key sections |
|----------|------|---------------|--------------|
| P1 | Home (2–3 variants) | `index.html`, `home-2.html`, `home-3.html` | Hero, shop by room, new arrivals, lookbook hotspots, USP bar, testimonials, journal, newsletter |
| P1 | Product Listing | `shop.html` | Breadcrumb, category banner, filter sidebar/drawer, sort, product grid, pagination/load more |
| P1 | Product Detail | `product.html` | Gallery + zoom/AR, variants, price, delivery estimate, dimensions, swatches CTA, tabs (details, care, shipping), reviews, complete the look |
| P1 | Cart | `cart.html` | Line items, quantity, save for later, order summary, promo code, upsells |
| P1 | Checkout | `checkout.html` | Steps, delivery options, payment, summary |
| P1 | Order Confirmation | `order-success.html` | Order summary, next steps, account prompt |
| P2 | Shop by Room | `room.html` | Room hero, categories, shoppable scene |
| P2 | Collection | `collection.html` | Story intro, curated product set |
| P2 | Search Results | `search.html` | Results, suggestions, empty state |
| P2 | Wishlist | `wishlist.html` | Saved items, move to cart |
| P2 | Account pages | `account-*.html` | Login/register, dashboard, orders, addresses, settings |
| P2 | Lookbook | `lookbook.html` | Full-bleed scenes with product hotspots |
| P2 | Blog list / post | `blog.html`, `blog-post.html` | Featured post, categories, related products in posts |
| P3 | About / Our Story | `about.html` | Story, values, team, sustainability |
| P3 | Designer Profile | `designer.html` | Bio, products by designer |
| P3 | Store Locator | `stores.html` | Map, store list, hours |
| P3 | Design Services | `services.html` | Consultation booking form |
| P3 | Contact | `contact.html` | Form, info, map |
| P3 | FAQ / Help | `faq.html` | Accordion by topic |
| P3 | Policy pages | `policy.html` | Shared legal layout |
| P3 | 404 / Coming Soon | `404.html`, `coming-soon.html` | Error state, countdown |

## Global components

- **Header:** announcement bar, logo, mega menu (Room / Category / Inspiration), search, account, wishlist, cart count
- **Footer:** shop links, help links, about links, newsletter, social, payment icons, country/currency selector
- **Shared UI:** product card (hover image swap, swatches, quick view, wishlist), quick-view modal, mini cart drawer, filter drawer (mobile), breadcrumbs, reviews block, newsletter popup, cookie banner
