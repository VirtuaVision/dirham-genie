// Save as: lib/homepageBlocks.js
//
// Single source of truth for what block types exist, what you can name
// them, and what settings each one exposes in the Page Builder admin
// screen. Add a new block type here first, then teach BlockRenderer
// (in app/page.jsx) how to render it.

export const BLOCK_TYPES = {
  hero: {
    label: "Hero Banner",
    description: "The big title/subtitle section at the very top of the site.",
    fields: [],
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