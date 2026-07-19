// Save as: lib/homepageBlocks.js
//
// Single source of truth for what block types exist, what you can name
// them, and what settings each one exposes in the Page Builder admin
// screen. Add a new block type here first, then teach BlockRenderer
// (in app/page.jsx) how to render it.

export const BLOCK_TYPES = {
  prime_banner: {
    label: "Prime Promo Banner",
    description: "The blue 'Join Amazon Prime' promo banner — or repurpose it for any sale.",
    fields: [
      {
        key: "style", label: "Style", type: "select", default: "gradient",
        options: [
          { value: "gradient", label: "Gradient Card (text + button)" },
          { value: "image", label: "Full Image (your own banner artwork)" },
        ],
      },
      { key: "image", label: "Banner image (used by Full Image style) — 1200×400px, wide banner (3:1)", type: "image", default: "" },
      { key: "eyebrow", label: "Small label text", type: "text", default: "Amazon Prime" },
      { key: "heading", label: "Heading", type: "text", default: "Start your Prime journey" },
      { key: "subheading", label: "Subheading", type: "text", default: "Enjoy fast delivery, exclusive deals & much more with Amazon Prime." },
      { key: "buttonText", label: "Button text", type: "text", default: "Join Prime & Save" },
      { key: "link", label: "Link (leave blank to use your saved Amazon Prime affiliate link)", type: "text", default: "" },
    ],
  },
  category_banner: {
    label: "Category / Sale Banner",
    description: "A promo banner you can point at any category or sale — swap the image, text, and link here, no code needed.",
    fields: [
      {
        key: "style", label: "Style", type: "select", default: "gradient",
        options: [
          { value: "gradient", label: "Gradient Card (text + button)" },
          { value: "image", label: "Full Image (your own banner artwork)" },
        ],
      },
      { key: "image", label: "Banner image (used by Full Image style) — 1200×400px, wide banner (3:1)", type: "image", default: "" },
      { key: "eyebrow", label: "Small label text", type: "text", default: "Limited Time" },
      { key: "heading", label: "Heading", type: "text", default: "This Week's Category Sale" },
      { key: "subheading", label: "Subheading", type: "text", default: "Big discounts on your favorite categories — while stocks last." },
      { key: "buttonText", label: "Button text", type: "text", default: "Shop the Sale" },
      { key: "link", label: "Link — where the banner sends people (e.g. /category/electronics)", type: "text", default: "/category" },
    ],
  },
  trending_carousel: {
    label: "Trending Finds Carousel",
    description: "Rotating spotlight banner cycling through your featured products.",
    fields: [],
  },
  feature_cards: {
    label: "Feature Cards",
    description: "The 3-card row: Daily Deals, Top Categories, Limited Time Offers.",
    fields: [
      { key: "card1_image", label: "Daily Deals image (optional) — 600×300px, landscape (2:1)", type: "image", default: "" },
      { key: "card1_link", label: "Daily Deals link", type: "text", default: "/deals/latest" },
      { key: "card2_image", label: "Top Categories image (optional) — 600×300px, landscape (2:1)", type: "image", default: "" },
      { key: "card2_link", label: "Top Categories link", type: "text", default: "/category" },
      { key: "card3_image", label: "Limited Time image (optional) — 600×300px, landscape (2:1)", type: "image", default: "" },
      { key: "card3_link", label: "Limited Time link", type: "text", default: "/deals/lightning" },
    ],
  },
  category_strip: {
    label: "Category Icon Strip",
    description: "Row of circular category icons for quick browsing.",
    fields: [],
  },
  hero: {
    label: "Hero Banner",
    description: "The big title/subtitle section at the very top of the site.",
    fields: [
      { key: "backgroundImage", label: "Background image (optional) — 1920×860px, wide landscape", type: "image", default: "" },
      {
        key: "style", label: "Style", type: "select", default: "default",
        options: [
          { value: "default", label: "Default — everyday layout" },
          { value: "sale", label: "Sale Mode — big centered banner + badge" },
        ],
      },
      { key: "saleBadge", label: "Sale badge text (Sale Mode only, e.g. '60% OFF STOREWIDE')", type: "text", default: "" },
      { key: "heading", label: "Heading (leave blank for the default title)", type: "text", default: "" },
      { key: "subheading", label: "Subheading (leave blank for the default text)", type: "text", default: "" },
      { key: "buttonText", label: "Button text", type: "text", default: "Explore Today's Deals" },
      { key: "buttonLink", label: "Button link", type: "text", default: "/deals/latest" },
    ],
  },
  featured_products: {
    label: "Featured Products",
    description: "A hand-picked grid — shows products marked 'Featured' in Add Product.",
    fields: [
      { key: "heading", label: "Section heading", type: "text", default: "Genie's Picks" },
      { key: "limit", label: "How many products", type: "number", default: 8 },
    ],
  },
  product_grid: {
    label: "Product Grid",
    description: "Your most recent active products, paginated.",
    fields: [
      { key: "heading", label: "Section heading", type: "text", default: "Freshly Unlocked" },
      { key: "withSidebar", label: "Show category sidebar", type: "boolean", default: true },
      { key: "paginated", label: "Show pagination", type: "boolean", default: true },
    ],
  },
  banners: {
    label: "Banner Strip",
    description: "Shows your active homepage banners (managed in Banners).",
    fields: [
      { key: "limit", label: "Max banners to show", type: "number", default: 3 },
    ],
  },
  trust_bar: {
    label: "Trust Bar",
    description: "The row of trust badges (free returns, genuine prices, etc.).",
    fields: [],
  },
  recently_viewed: {
    label: "Recently Viewed",
    description: "Shows the visitor's own recently viewed products.",
    fields: [],
  },
  trending: {
    label: "Trending Now",
    description: "Your most-clicked products recently.",
    fields: [],
  },
  newsletter: {
    label: "Newsletter Signup",
    description: "The email subscribe form.",
    fields: [
      { key: "heading", label: "Section heading", type: "text", default: "" },
    ],
  },
  text_block: {
    label: "Text Block",
    description: "A simple heading + paragraph — for announcements, promos, etc.",
    fields: [
      { key: "heading", label: "Heading", type: "text", default: "" },
      { key: "body", label: "Body text", type: "textarea", default: "" },
      { key: "image", label: "Image (optional) — 1200×600px, landscape (2:1)", type: "image", default: "" },
    ],
  },
};

export function defaultConfigFor(type) {
  const def = BLOCK_TYPES[type];
  if (!def) return {};
  const config = {};
  for (const field of def.fields) {
    config[field.key] = field.default;
  }
  return config;
}