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
  flash_sale_banner: {
    label: "Flash Sale Countdown Banner",
    description: "A bold banner with a live countdown clock — great for time-limited sales.",
    fields: [
      {
        key: "theme", label: "Color theme", type: "select", default: "red",
        options: [
          { value: "red", label: "Red — urgency" },
          { value: "black", label: "Black Friday (black/gold)" },
          { value: "purple", label: "Purple" },
        ],
      },
      { key: "heading", label: "Heading", type: "text", default: "⚡ Flash Sale — Today Only!" },
      { key: "subheading", label: "Subheading", type: "text", default: "Up to 50% off across the site." },
      { key: "endDateTime", label: "Countdown end date/time — format: 2026-08-01T23:59:00", type: "text", default: "" },
      { key: "buttonText", label: "Button text", type: "text", default: "Shop the Sale" },
      { key: "link", label: "Link", type: "text", default: "/deals/lightning" },
    ],
  },
  coupon_banner: {
    label: "Coupon Code Banner",
    description: "Shows a promo code visitors can tap to copy.",
    fields: [
      {
        key: "style", label: "Style", type: "select", default: "gradient",
        options: [
          { value: "gradient", label: "Gradient Card" },
          { value: "image", label: "Full Image" },
        ],
      },
      { key: "image", label: "Banner image (used by Full Image style)", type: "image", default: "" },
      { key: "heading", label: "Heading", type: "text", default: "Extra Savings Unlocked" },
      { key: "subheading", label: "Subheading", type: "text", default: "Use this code at checkout on Amazon.ae" },
      { key: "couponCode", label: "Coupon code", type: "text", default: "" },
      { key: "buttonText", label: "Button text", type: "text", default: "Shop Now" },
      { key: "link", label: "Link", type: "text", default: "/deals/latest" },
    ],
  },
  split_banner: {
    label: "Two-Banner Row (Side by Side)",
    description: "Two square promo banners next to each other — e.g. 'Men's Deals' / 'Women's Deals'.",
    fields: [
      { key: "leftImage", label: "Left banner image", type: "image", default: "" },
      { key: "leftHeading", label: "Left heading", type: "text", default: "" },
      { key: "leftLink", label: "Left link", type: "text", default: "/category" },
      { key: "rightImage", label: "Right banner image", type: "image", default: "" },
      { key: "rightHeading", label: "Right heading", type: "text", default: "" },
      { key: "rightLink", label: "Right link", type: "text", default: "/category" },
    ],
  },
  triple_image_banner: {
    label: "Three-Banner Image Row",
    description: "Three plain image banners in a row, each with its own link — no text overlay.",
    fields: [
      { key: "image1", label: "Banner 1 image", type: "image", default: "" },
      { key: "link1", label: "Banner 1 link", type: "text", default: "/category" },
      { key: "image2", label: "Banner 2 image", type: "image", default: "" },
      { key: "link2", label: "Banner 2 link", type: "text", default: "/category" },
      { key: "image3", label: "Banner 3 image", type: "image", default: "" },
      { key: "link3", label: "Banner 3 link", type: "text", default: "/category" },
    ],
  },
  simple_image_banner: {
    label: "Simple Image Banner",
    description: "One big clickable image, edge to edge — no card, no text overlay. Just your artwork.",
    fields: [
      { key: "image", label: "Banner image — 1600×500px recommended", type: "image", default: "" },
      { key: "link", label: "Link", type: "text", default: "/deals/latest" },
      { key: "altText", label: "Alt text (for accessibility/SEO)", type: "text", default: "Promotional banner" },
    ],
  },
  whatsapp_banner: {
    label: "WhatsApp Channel Banner",
    description: "Promote your WhatsApp deal-alerts channel or group.",
    fields: [
      {
        key: "style", label: "Style", type: "select", default: "gradient",
        options: [
          { value: "gradient", label: "Gradient Card" },
          { value: "image", label: "Full Image" },
        ],
      },
      { key: "image", label: "Banner image (used by Full Image style)", type: "image", default: "" },
      { key: "heading", label: "Heading", type: "text", default: "Never Miss a Deal Again" },
      { key: "subheading", label: "Subheading", type: "text", default: "Join our WhatsApp channel for instant deal alerts." },
      { key: "buttonText", label: "Button text", type: "text", default: "Join on WhatsApp" },
      { key: "whatsappLink", label: "WhatsApp channel/group link", type: "text", default: "" },
    ],
  },
  social_follow_banner: {
    label: "Social Media Follow Banner",
    description: "A row inviting visitors to follow you on Instagram, Facebook, TikTok, etc.",
    fields: [
      { key: "heading", label: "Heading", type: "text", default: "Follow Us for Daily Deals" },
      { key: "instagramLink", label: "Instagram link (leave blank to hide)", type: "text", default: "" },
      { key: "facebookLink", label: "Facebook link (leave blank to hide)", type: "text", default: "" },
      { key: "tiktokLink", label: "TikTok link (leave blank to hide)", type: "text", default: "" },
      { key: "whatsappLink", label: "WhatsApp link (leave blank to hide)", type: "text", default: "" },
    ],
  },
  announcement_bar: {
    label: "Top Announcement Strip",
    description: "A slim colored strip for short promo text (e.g. free shipping notice, a coupon code).",
    fields: [
      {
        key: "theme", label: "Color theme", type: "select", default: "gold",
        options: [
          { value: "gold", label: "Gold" },
          { value: "red", label: "Red" },
          { value: "black", label: "Black" },
          { value: "green", label: "Green" },
        ],
      },
      { key: "text", label: "Announcement text", type: "text", default: "🎉 New deals added daily — check back often!" },
      { key: "link", label: "Link (optional — leave blank for no click-through)", type: "text", default: "" },
    ],
  },
  brand_spotlight_banner: {
    label: "Brand / Store Spotlight Banner",
    description: "Highlight a specific brand campaign, e.g. 'Anker Week' or 'Samsung Deals'.",
    fields: [
      {
        key: "style", label: "Style", type: "select", default: "gradient",
        options: [
          { value: "gradient", label: "Gradient Card" },
          { value: "image", label: "Full Image" },
        ],
      },
      { key: "image", label: "Banner image (used by Full Image style)", type: "image", default: "" },
      { key: "brandLogo", label: "Brand logo (optional, shown in Gradient style)", type: "image", default: "" },
      { key: "heading", label: "Heading", type: "text", default: "Brand Spotlight" },
      { key: "subheading", label: "Subheading", type: "text", default: "This week's featured brand — top picks, best prices." },
      { key: "buttonText", label: "Button text", type: "text", default: "Shop the Brand" },
      { key: "link", label: "Link", type: "text", default: "/category" },
    ],
  },
  seasonal_sale_banner: {
    label: "Seasonal / Holiday Sale Banner",
    description: "A festive-themed banner for Eid, National Day, Black Friday, White Friday, Ramadan, or New Year.",
    fields: [
      {
        key: "theme", label: "Occasion", type: "select", default: "black_friday",
        options: [
          { value: "eid", label: "Eid Sale" },
          { value: "national_day", label: "UAE National Day" },
          { value: "black_friday", label: "Black Friday" },
          { value: "white_friday", label: "White Friday" },
          { value: "ramadan", label: "Ramadan" },
          { value: "new_year", label: "New Year" },
        ],
      },
      { key: "image", label: "Background image (optional)", type: "image", default: "" },
      { key: "heading", label: "Heading (leave blank to use the occasion's default)", type: "text", default: "" },
      { key: "subheading", label: "Subheading", type: "text", default: "" },
      { key: "buttonText", label: "Button text", type: "text", default: "Shop the Sale" },
      { key: "link", label: "Link", type: "text", default: "/deals/latest" },
    ],
  },
  split_feature_banner: {
    label: "Image + Text Split Banner",
    description: "A big banner with an image on one side and text/button on the other — good for a featured story or campaign.",
    fields: [
      { key: "image", label: "Image", type: "image", default: "" },
      {
        key: "imagePosition", label: "Image position", type: "select", default: "left",
        options: [
          { value: "left", label: "Left" },
          { value: "right", label: "Right" },
        ],
      },
      { key: "heading", label: "Heading", type: "text", default: "" },
      { key: "subheading", label: "Subheading", type: "text", default: "" },
      { key: "buttonText", label: "Button text", type: "text", default: "Learn More" },
      { key: "link", label: "Link", type: "text", default: "/category" },
    ],
  },
  testimonial_banner: {
    label: "Customer Trust Banner",
    description: "A quote/rating banner to build trust — a customer testimonial or review highlight.",
    fields: [
      { key: "quote", label: "Quote / testimonial text", type: "textarea", default: "" },
      { key: "customerName", label: "Customer name", type: "text", default: "" },
      { key: "rating", label: "Star rating (1-5)", type: "number", default: 5 },
      { key: "avatar", label: "Customer photo (optional)", type: "image", default: "" },
    ],
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