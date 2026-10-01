/* Morrow — search index and engine, shared by the header search panel (main.js loads this file
   the first time search opens) and the search page (search.js).
   The catalogue below mirrors the product cards in the HTML. In production, replace it with
   results from your search service (Algolia, Typesense, Shopify search…) and keep the same shape. */
(() => {
  const P = (o) => o;

  /* ---------- Products ---------- */
  const products = [
    P({ name: 'Alder 3-seat sofa', cat: 'sofas', rooms: ['living'], price: 1890, material: 'boucle', colours: ['neutral', 'green', 'brown'], stock: 'in', rating: 4.8, reviews: 312, added: '2026-09-12', pop: 1, photo: 20337842, meta: 'Bouclé, solid oak legs', badge: 'New', swatches: [['Oat', '#DCD4C3'], ['Sage', '#8E9A7B'], ['Cognac', '#9A6240']], tags: 'couch three seater deep seat washable covers nordic calm oak' }),
    P({ name: 'Alder corner sofa', cat: 'sofas', rooms: ['living'], price: 2640, material: 'boucle', colours: ['neutral', 'green'], stock: 'order', rating: 4.7, reviews: 88, added: '2026-06-02', pop: 6, photo: 19650953, meta: 'Bouclé, solid oak legs', swatches: [['Oat', '#DCD4C3'], ['Sage', '#8E9A7B']], tags: 'couch corner l-shaped sectional modular large family oak' }),
    P({ name: 'Hale 2-seat sofa', cat: 'sofas', rooms: ['living'], price: 1420, was: 1690, material: 'linen', colours: ['green', 'neutral', 'black'], stock: 'in', rating: 4.6, reviews: 140, added: '2025-11-20', pop: 4, photo: 16825059, meta: 'Washed linen, walnut legs', swatches: [['Sage', '#8E9A7B'], ['Oat', '#DCD4C3'], ['Charcoal', '#4A4D48']], tags: 'couch loveseat two seater small space apartment warm minimal walnut' }),
    P({ name: 'Ren lounge chair', cat: 'armchairs', rooms: ['living', 'bedroom'], price: 760, material: 'leather', colours: ['brown', 'neutral'], stock: 'in', rating: 4.9, reviews: 205, added: '2026-09-01', pop: 2, photo: 20794782, meta: 'Aniline leather, walnut', badge: 'New', swatches: [['Cognac', '#9A6240'], ['Espresso', '#4A3528'], ['Sand', '#CDB592']], tags: 'armchair accent chair reading chair lounge cognac warm minimal walnut' }),
    P({ name: 'Otto armchair', cat: 'armchairs', rooms: ['living', 'bedroom'], price: 590, material: 'linen', colours: ['neutral', 'brown', 'green'], stock: 'in', rating: 4.5, reviews: 61, added: '2026-03-14', pop: 9, photo: 20337873, meta: 'Washed linen, oak legs', swatches: [['Oat', '#DCD4C3'], ['Rust', '#A4583A'], ['Moss', '#6F7A5E']], tags: 'accent chair reading chair small oak' }),
    P({ name: 'Hale lounge chair', cat: 'armchairs', rooms: ['living'], price: 640, material: 'boucle', colours: ['neutral', 'black'], stock: 'order', rating: 4.3, reviews: 22, added: '2026-09-20', pop: 14, photo: 29508373, meta: 'Bouclé, blackened oak', badge: 'New', swatches: [['Oat', '#DCD4C3'], ['Charcoal', '#4A4D48']], tags: 'armchair accent chair cane nordic calm oak' }),
    P({ name: 'Drift coffee table', cat: 'tables', rooms: ['living'], price: 690, material: 'wood', colours: ['brown', 'black'], stock: 'in', rating: 4.7, reviews: 97, added: '2026-05-08', pop: 5, photo: 27059629, meta: 'Solid oak, 120 cm', swatches: [['Natural oak', '#B08A5E'], ['Smoked oak', '#6B4A33'], ['Black oak', '#2E2B28']], tags: 'center table cocktail table low table oak travertine' }),
    P({ name: 'Tove side table', cat: 'tables', rooms: ['living', 'bedroom'], price: 280, material: 'stone', colours: ['neutral', 'brown', 'black'], stock: 'in', rating: 4.8, reviews: 176, added: '2025-10-02', pop: 3, photo: 8670505, meta: 'Honed travertine', swatches: [['Travertine', '#D9CFBF'], ['Rosso marble', '#A8715F'], ['Nero marble', '#3D3F3C']], tags: 'end table bedside table nightstand night stand marble travertine small' }),
    P({ name: 'Stilla sideboard', cat: 'storage', rooms: ['living', 'dining'], price: 1054, was: 1240, material: 'wood', colours: ['brown'], stock: 'order', rating: 4.6, reviews: 54, added: '2025-08-18', pop: 8, photo: 12277013, meta: 'Walnut veneer, 180 cm', swatches: [['Walnut', '#7A5236'], ['Natural oak', '#B08A5E']], tags: 'credenza buffet cabinet media unit tv stand console drawers walnut oak' }),
    P({ name: 'Lumen floor lamp', cat: 'lighting', rooms: ['living', 'bedroom', 'office'], price: 320, material: 'linen', colours: ['neutral', 'green'], stock: 'in', rating: 4.7, reviews: 133, added: '2026-08-21', pop: 7, photo: 34992772, meta: 'Linen shade, blackened steel', badge: 'New', swatches: [['Natural linen', '#EBD9AE'], ['Moss linen', '#6F7A5E']], tags: 'lamp standing lamp reading lamp light tripod steel metal' }),
    P({ name: 'Halo pendant light', cat: 'lighting', rooms: ['dining', 'bedroom'], price: 168, was: 210, material: 'metal', colours: ['green', 'neutral', 'ochre'], stock: 'in', rating: 4.4, reviews: 89, added: '2025-12-05', pop: 10, photo: 38278700, meta: 'Powder-coated aluminium', swatches: [['Moss', '#6F7A5E'], ['Chalk', '#E8E6DF'], ['Ochre', '#C28E2E']], tags: 'ceiling light pendant lamp hanging lamp kitchen island aluminium' }),
    P({ name: 'Mira wool rug', cat: 'rugs', rooms: ['living', 'bedroom', 'office'], price: 540, material: 'wool', colours: ['neutral', 'green', 'brown'], stock: 'in', rating: 4.6, reviews: 72, added: '2026-07-10', pop: 11, photo: 18266462, meta: 'Hand-tufted wool, 200 × 300 cm', swatches: [['Oat', '#CFC4AF'], ['Sage', '#9AA488'], ['Terracotta', '#B7775A']], tags: 'carpet area rug large soft' }),
    P({ name: 'Arc wall mirror', cat: 'decor', rooms: ['living', 'bedroom'], price: 390, was: 460, material: 'wood', colours: ['brown', 'ochre'], stock: 'in', rating: 4.8, reviews: 118, added: '2026-01-22', pop: 12, photo: 5644681, meta: 'Oak frame, 60 × 100 cm', swatches: [['Natural oak', '#B08A5E'], ['Brass', '#C9A45A']], tags: 'mirror arched hallway oak brass' }),
    P({ name: 'Loma vase', cat: 'decor', rooms: ['living', 'dining'], price: 65, material: 'ceramic', colours: ['green', 'ochre', 'neutral'], stock: 'in', rating: 4.9, reviews: 241, added: '2026-08-30', pop: 13, photo: 7674547, meta: 'Glazed stoneware, 30 cm', badge: 'New', swatches: [['Moss', '#36402F'], ['Ochre', '#C28E2E'], ['Chalk', '#E8E6DF']], tags: 'vase stoneware flowers object gift' }),
    P({ name: 'Terra planter', cat: 'decor', rooms: ['living', 'outdoor'], price: 85, material: 'ceramic', colours: ['brown', 'neutral'], stock: 'in', rating: 4.5, reviews: 39, added: '2026-04-04', pop: 15, photo: 7912988, meta: 'Unglazed terracotta, 40 cm', swatches: [['Terracotta', '#B7775A'], ['Chalk', '#EFEDE6']], tags: 'plant pot pot indoor plants terracotta' }),
    P({ name: 'Fold dining table', cat: 'tables', rooms: ['dining'], price: 1290, material: 'wood', colours: ['brown', 'black'], stock: 'in', rating: 4.8, reviews: 64, added: '2026-02-10', pop: 16, photo: 39854857, meta: 'Solid oak, seats 6', swatches: [['Natural oak', '#B08A5E'], ['Smoked oak', '#6B4A33']], tags: 'kitchen table dinner table extendable six seater oak' }),
    P({ name: 'Fold dining chair', cat: 'chairs', rooms: ['dining'], price: 240, material: 'wood', colours: ['brown', 'black'], stock: 'in', rating: 4.7, reviews: 110, added: '2026-02-10', pop: 17, photo: 39854852, meta: 'Solid oak, set of 2', swatches: [['Natural oak', '#B08A5E'], ['Smoked oak', '#6B4A33'], ['Black oak', '#2E2B28']], tags: 'kitchen chair dinner chair oak' }),
    P({ name: 'Oslo dining chair', cat: 'chairs', rooms: ['dining'], price: 240, material: 'wood', colours: ['brown'], stock: 'in', rating: 4.6, reviews: 47, added: '2025-09-15', pop: 20, photo: 39854852, meta: 'Natural oak, woven seat', swatches: [['Natural oak', '#B08A5E']], tags: 'kitchen chair dinner chair oak woven' }),
    P({ name: 'Haven bed', cat: 'beds', rooms: ['bedroom'], price: 1650, material: 'linen', colours: ['neutral'], stock: 'order', rating: 4.8, reviews: 93, added: '2026-04-18', pop: 18, photo: 12277123, meta: 'Stone linen, queen', swatches: [['Stone', '#CFC4B2'], ['Oat', '#DCD4C3']], tags: 'bed frame upholstered bed queen king headboard' }),
    P({ name: 'Linden bed', cat: 'beds', rooms: ['bedroom'], price: 1480, material: 'linen', colours: ['neutral', 'green'], stock: 'in', rating: 4.6, reviews: 51, added: '2025-10-28', pop: 21, photo: 12277123, meta: 'Oat linen, queen', swatches: [['Oat', '#DCD4C3'], ['Sage', '#8E9A7B']], tags: 'bed frame upholstered bed queen king headboard' }),
    P({ name: 'Rowe desk', cat: 'desks', rooms: ['office'], price: 890, material: 'wood', colours: ['brown'], stock: 'in', rating: 4.7, reviews: 45, added: '2026-03-02', pop: 19, photo: 12202411, meta: 'Light oak, 140 cm', swatches: [['Light oak', '#C8A477'], ['Walnut', '#7A5236']], tags: 'writing desk work desk home office table study oak' }),
    P({ name: 'Porto outdoor chair', cat: 'outdoor', rooms: ['outdoor'], price: 520, material: 'wood', colours: ['ochre', 'neutral'], stock: 'in', rating: 4.5, reviews: 28, added: '2026-05-20', pop: 22, photo: 29929810, meta: 'Ochre canvas, teak', swatches: [['Ochre', '#C28E2E'], ['Sand', '#D9CBB0']], tags: 'garden chair patio chair deck lounge teak canvas' }),
  ];

  const CATS = {
    sofas: 'Sofas', armchairs: 'Armchairs', tables: 'Tables', chairs: 'Dining chairs', beds: 'Beds', desks: 'Desks',
    storage: 'Storage', lighting: 'Lighting', rugs: 'Rugs', decor: 'Decor', outdoor: 'Outdoor',
  };
  const MATERIALS = { boucle: 'Bouclé', linen: 'Linen', leather: 'Leather', wood: 'Solid wood', stone: 'Stone', metal: 'Metal', wool: 'Wool', ceramic: 'Ceramic' };
  const COLOURS = { neutral: ['Neutral', '#DCD4C3'], green: ['Green', '#8E9A7B'], brown: ['Brown', '#7A5236'], black: ['Black', '#2E2B28'], ochre: ['Ochre', '#C28E2E'] };

  /* ---------- Shortcuts: categories, rooms, collections and shop views ---------- */
  const shortcuts = [
    { name: 'Sofas', kind: 'Category', href: 'shop.html?c=sofas', photo: 20337842, keys: 'sofa couch settee loveseat sectional' },
    { name: 'Armchairs', kind: 'Category', href: 'shop.html?c=armchairs', photo: 20794782, keys: 'armchair chair lounge chair accent chair' },
    { name: 'Coffee & side tables', kind: 'Category', href: 'shop.html?c=tables', photo: 27059629, keys: 'coffee table side table end table' },
    { name: 'Storage', kind: 'Category', href: 'shop.html?c=storage', photo: 12277013, keys: 'storage sideboard cabinet credenza' },
    { name: 'Lighting', kind: 'Category', href: 'shop.html?c=lighting', photo: 34992772, keys: 'lighting lamp light pendant' },
    { name: 'Rugs', kind: 'Category', href: 'shop.html?c=rugs', photo: 18266462, keys: 'rug carpet' },
    { name: 'Decor', kind: 'Category', href: 'shop.html?c=decor', photo: 7674547, keys: 'decor vase mirror planter object accessories' },
    { name: 'Living room', kind: 'Room', href: 'room.html#living', photo: 28744513, keys: 'living room lounge' },
    { name: 'Bedroom', kind: 'Room', href: 'room.html#bedroom', photo: 3705536, keys: 'bedroom bed' },
    { name: 'Dining room', kind: 'Room', href: 'room.html#dining', photo: 38083081, keys: 'dining room kitchen' },
    { name: 'Home office', kind: 'Room', href: 'room.html#office', photo: 12202411, keys: 'home office study work desk' },
    { name: 'Outdoor', kind: 'Room', href: 'room.html#outdoor', photo: 29929810, keys: 'outdoor garden patio deck balcony' },
    { name: 'Nordic calm', kind: 'Collection', href: 'collection.html?c=nordic-calm', photo: 15585982, keys: 'nordic calm scandinavian pale oak white' },
    { name: 'Warm minimal', kind: 'Collection', href: 'collection.html?c=warm-minimal', photo: 5824527, keys: 'warm minimal walnut brass cognac' },
    { name: 'Sale', kind: 'Offer', href: 'shop.html?sale=1', photo: 16825059, keys: 'sale discount offer deal reduced clearance' },
    { name: 'New in', kind: 'Shop', href: 'shop.html?new=1', photo: 29508373, keys: 'new in new arrivals latest' },
    { name: 'The slow season lookbook', kind: 'Lookbook', href: 'lookbook.html', photo: 27383302, keys: 'lookbook inspiration autumn winter looks' },
    { name: 'Gift cards', kind: 'Shop', href: 'gift-cards.html', photo: null, keys: 'gift card voucher present' },
  ];

  /* ---------- Journal, lookbook and guides ---------- */
  const articles = [
    { title: 'How to choose a sofa that fits your room and your doorway', kind: 'Guide', mins: 8, photo: 19650953, href: 'blog-post.html', text: 'Measure the wall, then the route in. The four measurements that decide whether a sofa works, and how to take them in ten minutes.', keys: 'sofa couch doorway measure size fit stairs' },
    { title: 'Layered lighting: three sources every living room needs', kind: 'Styling', mins: 5, photo: 13806238, href: 'blog-post.html', text: 'A ceiling light alone flattens a room. Add a floor lamp and something low, and evenings feel completely different.', keys: 'lighting lamp pendant floor lamp living room' },
    { title: 'Caring for solid wood and natural stone through the seasons', kind: 'Care', mins: 4, photo: 27059629, href: 'blog-post.html', text: 'Dry winter air and summer sun both leave marks. A short routine for oak, walnut and travertine.', keys: 'care wood oak walnut stone travertine oil clean' },
    { title: 'Bouclé, linen or leather? Choosing a fabric you’ll live with', kind: 'Guide', mins: 7, photo: 6580549, href: 'blog-post.html', text: 'Pets, children, sunlight and how often you’ll wash the covers. How each fabric holds up after two years.', keys: 'fabric boucle linen leather pets kids durable' },
    { title: 'Inside the workshop where our sofas are framed', kind: 'Makers', mins: 6, photo: 15016524, href: 'blog-post.html', text: 'Kiln-dried oak, corner blocks and 300 pocket springs. A morning with the team in North Carolina.', keys: 'workshop made sofa frame springs craft hickory' },
    { title: 'A 40 m² apartment that feels twice the size', kind: 'Home tour', mins: 6, photo: 28744513, href: 'blog-post.html', text: 'Low furniture, one big mirror and a rug that goes under everything. How Lena made a studio feel open.', keys: 'small space apartment studio mirror rug' },
    { title: 'How to size a rug (and the mistake almost everyone makes)', kind: 'Guide', mins: 5, photo: 18266462, href: 'blog-post.html', text: 'If the front legs of your sofa don’t sit on it, the rug is too small. Sizes that work for every room.', keys: 'rug carpet size measure' },
    { title: 'Styling a sideboard in five objects', kind: 'Styling', mins: 3, photo: 5824530, href: 'blog-post.html', text: 'Something tall, something low, something living, a book and a bowl. A formula that works every time.', keys: 'sideboard styling vase objects decor' },
    { title: 'Why we oil our oak instead of lacquering it', kind: 'Makers', mins: 4, photo: 11507947, href: 'blog-post.html', text: 'Lacquer looks perfect until it chips. Oil ages with the wood, and you can repair it yourself.', keys: 'oak oil lacquer finish wood care' },
    { title: 'Getting rid of water rings, scratches and wax', kind: 'Care', mins: 4, photo: 8670505, href: 'blog-post.html', text: 'Most marks on oiled wood come out with a cloth, an iron or fine steel wool. What to try first.', keys: 'stain scratch water ring wax clean wood repair' },
    { title: 'A family home in Portland built around one big table', kind: 'Home tour', mins: 7, photo: 29559675, href: 'blog-post.html', text: 'Homework, dinner and board games all happen in one place. A tour of a house designed around eating together.', keys: 'dining table family kids home tour' },
    { title: 'Mirrors that make a room lighter', kind: 'Styling', mins: 3, photo: 5644681, href: 'blog-post.html', text: 'Where to hang a mirror so it bounces daylight instead of reflecting the ceiling.', keys: 'mirror light small room hang' },
    { title: 'The five measurements to take before buying a dining table', kind: 'Guide', mins: 5, photo: 39854857, href: 'blog-post.html', text: 'Room size is only the start. Chair clearance, leg positions and how many people you really host.', keys: 'dining table measure size seats chairs' },
    { title: 'First light', kind: 'Lookbook', photo: 15585982, href: 'lookbook.html#first-light', text: 'Pale oak, white bouclé and the first sun of the day. A room that asks nothing of you before coffee.', keys: 'living room sofa boucle nordic calm' },
    { title: 'The long table', kind: 'Lookbook', photo: 38083081, href: 'lookbook.html#the-long-table', text: 'Walnut, brass and a table that seats eight when it has to. Dinner that turns into the whole evening.', keys: 'dining table pendant chairs warm minimal' },
    { title: 'Reading corner', kind: 'Lookbook', photo: 28744513, href: 'lookbook.html#reading-corner', text: 'One good chair, one good lamp, and nowhere to put your phone. The smallest room in the house.', keys: 'armchair lamp reading chair corner' },
    { title: 'Slow Sunday', kind: 'Lookbook', photo: 3705536, href: 'lookbook.html#slow-sunday', text: 'Linen that doesn’t need ironing and a bed you don’t want to leave.', keys: 'bedroom bed linen' },
    { title: 'Low light', kind: 'Lookbook', photo: 27383302, href: 'lookbook.html#low-light', text: 'Dark walls, warm pools of light and walnut that glows.', keys: 'lamp lighting sideboard armchair walnut evening' },
  ];

  /* ---------- Help: FAQ answers and service pages ---------- */
  const faq = (id, q, a, keys = '') => ({ title: q, text: a, href: `faq.html#faq-${id}`, kind: 'FAQ', keys });
  const help = [
    faq('change-order', 'Can I change or cancel my order?', 'Yes, until your piece goes into production. For made-to-order furniture that’s usually 3 days after you order; for in-stock pieces, until we book your delivery.', 'cancel change order modify'),
    faq('payment-methods', 'Which payment methods do you accept?', 'Visa, Mastercard, American Express, Apple Pay, PayPal and Klarna. We take payment when you order, including for made-to-order pieces.', 'pay payment card paypal apple pay'),
    faq('klarna', 'How does paying in 4 instalments work?', 'Choose Klarna at checkout. You pay a quarter today and the rest every two weeks, with no interest.', 'klarna finance installments instalments pay later interest free'),
    faq('price-drop', 'The price dropped after I ordered. Can I get the difference?', 'Yes, if it drops within 14 days of your order. Contact us with your order number and we’ll refund the difference.', 'price match price drop refund difference'),
    faq('tax', 'Do your prices include sales tax?', 'No. Sales tax is added at checkout based on your delivery address. Delivery is free on orders over $500.', 'tax sales tax vat'),
    faq('delivery-time', 'How long does delivery take?', 'In-stock pieces arrive in 1–2 weeks. Made-to-order furniture, such as sofas in some fabrics, takes 6–8 weeks.', 'delivery shipping how long lead time weeks'),
    faq('delivery-cost', 'How much is delivery?', 'Free on orders over $500, and $49 below that. Every delivery is carried into the room you choose by a two-person team.', 'delivery shipping cost free price white glove'),
    faq('delivery-day', 'Can I choose my delivery day?', 'Yes. You pick a day and a time window at checkout, and can change it up to 48 hours before in your account.', 'delivery date day reschedule time slot'),
    faq('split-delivery', 'Why is my order arriving in two deliveries?', 'If you order in-stock and made-to-order pieces together, we send the in-stock pieces first. You only pay delivery once.', 'split delivery two deliveries partial'),
    faq('doorway', 'Will a sofa fit through my door?', 'Measure your narrowest doorway, hallway and stair turn. Our sofa legs unscrew, so most sofas fit through an 80 cm door.', 'doorway door fit stairs measure sofa'),
    faq('outside-us', 'Do you deliver outside the US?', 'Not yet. We deliver to all 48 contiguous states. Alaska and Hawaii are available on request.', 'international canada abroad alaska hawaii ship'),
    faq('return-policy', 'What is your return policy?', 'You have 30 days from delivery to decide. We collect furniture from your home for free, and you don’t need the original packaging.', 'return refund policy 30 days'),
    faq('start-return', 'How do I start a return?', 'Go to your orders and choose Start a return, or contact us. We’ll email you a collection date within one working day.', 'return collect send back'),
    faq('custom-return', 'Can I return made-to-order furniture?', 'Yes, on the same 30-day terms. We refurbish returned pieces in our workshop and sell them as seconds.', 'return made to order custom'),
    faq('exchange', 'Can I exchange for a different color?', 'Yes. Choose exchange when you start a return. We deliver the new piece and collect the old one on the same visit.', 'exchange swap color colour'),
    faq('clean-covers', 'Can I wash the sofa covers?', 'Yes. All seat and back cushion covers unzip and wash at 30°C on a gentle cycle. Line dry and put them back on while slightly damp.', 'wash clean covers cushions washable'),
    faq('spills', 'How do I deal with spills?', 'Blot, don’t rub, with a clean damp cloth as soon as possible. For bouclé, lift fibres afterwards with a soft brush.', 'spill stain clean wine coffee'),
    faq('wood-care', 'How do I care for solid oak and walnut?', 'Dust with a dry cloth and re-oil once or twice a year with the care kit we include. Keep pieces out of strong direct sunlight.', 'wood oak walnut care oil clean'),
    faq('stone-care', 'Is travertine hard to look after?', 'It’s sealed before it leaves us. Use coasters for wine, coffee and citrus, and reseal once a year with the included sealant.', 'travertine marble stone care seal'),
    faq('swatches', 'Can I see fabrics before ordering?', 'Yes. Order up to six free swatches and they usually arrive in two days.', 'swatches samples fabric free'),
    faq('pets', 'Which fabric is best with pets?', 'Leather wipes clean and doesn’t hold hair. Tightly woven linen is a good second choice. Bouclé loops can catch on claws.', 'pets dog cat fabric scratch hair'),
    faq('solid-wood', 'Is your furniture really solid wood?', 'Frames, legs and tables are solid oak or walnut. Some large panels use birch plywood for stability, and every product page says where.', 'solid wood plywood veneer oak walnut'),
    faq('dimensions', 'Where can I find exact dimensions?', 'Every product page has a dimensions drawing and table, including seat height, seat depth and the smallest doorway the piece fits through.', 'dimensions size measurements'),
    faq('warranty-cover', 'What does the warranty cover?', '10 years on frames and springs, and 2 years on fabric, cushions and finishes, against defects in materials or making.', 'warranty guarantee cover defect'),
    faq('damaged-delivery', 'Something arrived damaged. What now?', 'Send us photos within 7 days of delivery through the contact form and we’ll send a replacement part or a technician, free.', 'damaged broken faulty delivery'),
    faq('spare-parts', 'Can I buy replacement parts?', 'Yes. Covers, cushions, legs and feet are all sold separately, even for pieces no longer in our range.', 'spare parts replacement legs covers cushions'),
    faq('need-account', 'Do I need an account to order?', 'No, you can check out as a guest. An account lets you track deliveries, change dates and keep a wishlist across devices.', 'account guest checkout sign up'),
    faq('reset-password', 'I forgot my password', 'Choose “Forgot your password?” on the sign-in page and we’ll email you a reset link.', 'password reset login sign in'),
    faq('emails', 'How do I stop marketing emails?', 'Use the unsubscribe link in any email, or switch them off in account settings.', 'unsubscribe email newsletter marketing'),
    { title: 'Track your order', text: 'Enter your order number and ZIP code to see where your order is and when it arrives.', href: 'track.html', kind: 'Page', keys: 'track order status where is my order delivery' },
    { title: 'Delivery', text: 'Delivery options, costs and lead times, and what happens on the day.', href: 'shipping.html', kind: 'Page', keys: 'delivery shipping white glove' },
    { title: 'Returns', text: 'Start a return or exchange, and see how collection and refunds work.', href: 'returns.html', kind: 'Page', keys: 'return refund exchange' },
    { title: 'Warranty', text: 'Check what’s covered on your piece and make a claim.', href: 'warranty.html', kind: 'Page', keys: 'warranty guarantee claim repair' },
    { title: 'Free design help', text: 'Book a free video or showroom call with a stylist, or order free fabric swatches.', href: 'services.html', kind: 'Page', keys: 'design service stylist interior designer help advice swatches' },
    { title: 'Showrooms', text: 'Find a showroom near you, see opening hours and book an appointment.', href: 'stores.html', kind: 'Page', keys: 'showroom store shop near me location visit' },
    { title: 'Trade program', text: 'Trade pricing and a dedicated team for interior designers, architects and hospitality projects.', href: 'trade.html', kind: 'Page', keys: 'trade designer architect business discount' },
    { title: 'Contact us', text: 'Call or text 1-800-555-0142, Monday to Saturday, 9am–6pm ET, or send us a message.', href: 'contact.html', kind: 'Page', keys: 'contact phone email call customer service help' },
    { title: 'Customer reviews', text: '4.8 out of 5 from 12,400 reviews, with photos from customers’ homes.', href: 'reviews.html', kind: 'Page', keys: 'reviews ratings customer photos' },
    { title: 'Sustainability', text: 'What our furniture is made of, where it comes from and our 2030 targets.', href: 'sustainability.html', kind: 'Page', keys: 'sustainability eco fsc recycled environment' },
    { title: 'Designers & makers', text: 'The designers and workshops behind every piece.', href: 'designers.html', kind: 'Page', keys: 'designers makers workshop craft' },
    { title: 'Careers', text: 'Open roles in our workshop, showrooms, delivery teams and studio.', href: 'careers.html', kind: 'Page', keys: 'jobs careers hiring work' },
  ];

  const popular = ['Sofa', 'Bouclé', 'Coffee table', 'Floor lamp', 'Rug', 'Sale', 'Dining table', 'Swatches'];

  /* ---------- Text helpers ---------- */
  const fold = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, '');
  const STOP = new Set(['a', 'an', 'the', 'and', 'or', 'for', 'of', 'in', 'on', 'to', 'with', 'my', 'i', 'is', 'do', 'you', 'your', 'how', 'what', 'can', 'me']);
  const stem = (w) => (w.length > 4 && w.endsWith('ies') ? w.slice(0, -3) + 'y'
    : w.length > 4 && /(ches|shes|sses|xes)$/.test(w) ? w.slice(0, -2)
    : w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w);
  const words = (s) => fold(s).split(/[^a-z0-9²]+/).filter(Boolean);
  // what people type -> words we use
  const SYN = {
    couch: ['sofa'], settee: ['sofa'], loveseat: ['sofa'], sectional: ['corner', 'sofa'], chesterfield: ['sofa'],
    nightstand: ['bedside', 'side'], credenza: ['sideboard'], buffet: ['sideboard'], cabinet: ['sideboard', 'storage'], dresser: ['storage', 'sideboard'],
    carpet: ['rug'], lamp: ['lamp', 'light'], light: ['light', 'lamp', 'lighting'], lighting: ['light', 'lamp'], ceiling: ['pendant'], chandelier: ['pendant'],
    pot: ['planter'], plant: ['planter'], marble: ['stone', 'travertine'], travertine: ['stone'], oak: ['wood'], walnut: ['wood'], teak: ['wood'],
    armchair: ['armchair', 'chair'], table: ['table'], bedside: ['side'], wool: ['wool'], velvet: ['boucle', 'linen'], cream: ['neutral', 'oat', 'white'], white: ['neutral', 'chalk'],
    grey: ['charcoal', 'black'], gray: ['charcoal', 'black'], green: ['sage', 'moss', 'green'], brown: ['cognac', 'walnut', 'brown'], shipping: ['delivery'],
    refund: ['return'], guarantee: ['warranty'], sample: ['swatch'], fabric: ['fabric', 'swatch'], cheap: ['sale'], discount: ['sale'], deal: ['sale'],
  };

  // one searchable document per item: fields with weights
  const doc = (fields) => fields.map(([text, w]) => ({ w, words: words(text || '').map(stem) }));
  const catWords = (p) => `${CATS[p.cat]} ${p.cat} ${MATERIALS[p.material]} ${p.colours.join(' ')} ${p.rooms.join(' ')}`;
  const index = {
    products: products.map((p) => doc([[p.name, 10], [catWords(p), 6], [p.tags, 5], [p.meta + ' ' + p.swatches.map((s) => s[0]).join(' '), 4]])),
    shortcuts: shortcuts.map((s) => doc([[s.name, 10], [s.keys, 6]])),
    articles: articles.map((a) => doc([[a.title, 8], [a.keys, 6], [a.kind, 3], [a.text, 2]])),
    help: help.map((h) => doc([[h.title, 8], [h.keys, 6], [h.text, 2]])),
  };
  const vocab = new Set(Object.values(index).flat().flatMap((d) => d.flatMap((f) => f.words)).filter((w) => w.length > 2));

  // score one document against query terms; every term must match somewhere (or, with any, at least one)
  const score = (d, terms, any = false) => {
    let total = 0;
    for (const t of terms) {
      let best = 0;
      for (const f of d) {
        for (const w of f.words) {
          let s = 0;
          if (t.alts.includes(w)) s = f.w * (t.exact.includes(w) ? 1 : 0.8);
          else if (t.prefix && t.raw.length >= 2 && w.startsWith(t.raw)) s = f.w * 0.7;
          if (s > best) best = s;
        }
      }
      if (!best && !any) return 0;
      total += best;
    }
    return total;
  };

  // "under $500", "below 300", "less than 1000"
  const parsePrice = (q) => {
    const m = fold(q).match(/\b(?:under|below|less than|max|up to)\s*\$?\s*([\d,]+)/);
    return m ? { max: Number(m[1].replace(/,/g, '')), text: m[0] } : null;
  };

  const terms = (q, { prefix = false } = {}) => {
    const price = parsePrice(q);
    const cleaned = price ? fold(q).replace(price.text, ' ') : q;
    const list = words(cleaned).filter((w) => !STOP.has(w));
    return {
      price,
      terms: list.map((w, i) => {
        const s = stem(w);
        const alts = [s, ...(SYN[w] || SYN[s] || []).map(stem)];
        return { raw: s, exact: [s], alts, prefix: prefix && i === list.length - 1 };
      }),
    };
  };

  const edit = (a, b) => { // Damerau-Levenshtein distance (optimal string alignment)
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const c = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
    return d[a.length][b.length];
  };
  // closest known word for each unknown word, or null if nothing changes
  const correct = (q) => {
    let changed = false;
    const out = words(q).map((w) => {
      if (STOP.has(w) || /^\d+$/.test(w) || vocab.has(stem(w)) || SYN[w]) return w;
      const max = w.length > 5 ? 2 : 1;
      let best = null; let bestD = max + 1;
      vocab.forEach((v) => {
        if (Math.abs(v.length - w.length) > max) return;
        const dist = edit(w, v);
        if (dist < bestD) { bestD = dist; best = v; }
      });
      if (best) { changed = true; return best; }
      return w;
    });
    return changed ? out.join(' ') : null;
  };

  const run = (list, docs, t, extra, any = false) => list
    .map((item, i) => { const s = score(docs[i], t.terms, any); return { item, score: s && extra ? s + extra(item) : s }; })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.item);

  /**
   * search(q) -> { products, shortcuts, articles, help, price, corrected }
   * If nothing matches, the query is spell-corrected and run again (corrected holds the new query), and
   * then, for several words, loosened to items matching some of them (partial: true).
   * prefix: treat the last word as unfinished (for search-as-you-type).
   */
  const search = (q, { prefix = false } = {}) => {
    const go = (query, any = false) => {
      const t = terms(query, { prefix });
      if (!t.terms.length && !t.price) return { products: [], shortcuts: [], articles: [], help: [], price: null };
      let prods = t.terms.length ? run(products, index.products, t, (p) => (30 - p.pop) / 30, any) : [...products].sort((a, b) => a.pop - b.pop);
      if (t.price) prods = prods.filter((p) => p.price <= t.price.max);
      return {
        products: prods,
        shortcuts: t.terms.length ? run(shortcuts, index.shortcuts, t, null, any) : [],
        articles: t.terms.length ? run(articles, index.articles, t, null, any) : [],
        help: t.terms.length ? run(help, index.help, t, null, any) : [],
        price: t.price,
      };
    };
    const found = (x) => x.products.length || x.shortcuts.length || x.articles.length || x.help.length;
    const r = go(q);
    if (found(r)) return { ...r, corrected: null, partial: false };
    const fixed = correct(q);
    if (fixed && fixed !== fold(q).trim()) {
      const r2 = go(fixed);
      if (found(r2)) return { ...r2, corrected: fixed, partial: false };
    }
    // nothing matches every word: show what matches some of them
    if (words(q).filter((w) => !STOP.has(w)).length > 1) {
      const r3 = go(fixed || q, true);
      if (found(r3)) return { ...r3, corrected: fixed, partial: true };
    }
    return { ...r, corrected: null, partial: false };
  };

  // wrap the words that match the query in <mark> (text is escaped first)
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const highlight = (text, q) => {
    const ws = words(q).filter((w) => !STOP.has(w) && w.length > 1).map((w) => stem(w));
    if (!ws.length) return esc(text);
    // same folding as fold(), but one character out for each character in, so indexes line up
    const folded = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, ' ');
    const marks = new Array(text.length).fill(false);
    folded.replace(/[a-z0-9²]+/g, (w, at) => {
      const hit = ws.map((q2) => (w.startsWith(q2) ? q2.length : stem(w) === q2 ? w.length : 0)).reduce((a, b) => Math.max(a, b), 0);
      for (let i = 0; i < hit; i++) marks[at + i] = true;
      return w;
    });
    let out = ''; let open = false;
    [...text].forEach((ch, i) => {
      if (marks[i] && !open) { out += '<mark>'; open = true; }
      if (!marks[i] && open) { out += '</mark>'; open = false; }
      out += esc(ch);
    });
    return out + (open ? '</mark>' : '');
  };

  const photo = (id, w = 400) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
  const money = (n) => '$' + n.toLocaleString('en-US');

  window.MorrowSearch = { products, shortcuts, articles, help, popular, CATS, MATERIALS, COLOURS, search, highlight, esc, photo, money, fold };
})();
