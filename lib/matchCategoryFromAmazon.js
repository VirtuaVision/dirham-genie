import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Words that show what a product is. Each entry is a regex fragment matched
// at the START of a word (so "shoe" also catches "shoes"); add \b at the end
// to require a whole word. [fragment, weight] counts extra for strong signals.
// Best-effort only: if nothing scores, the product stays uncategorised.
const RULES = [
  {
    siteName: "fashion",
    words: [
      "shoes?\\b", "sneakers?", "trainers?\\b", "sandals?", "slippers?", "boots?\\b", "heels?\\b",
      "loafers?", "footwear", "handbags?", "purses?\\b", "totes?\\b", "satchel", "clutch", "crossbody",
      "shoulder bags?", "hobo bags?", "bags?\\b", "backpacks?", "wallets?", "watch(es)?\\b",
      "dress(es)?\\b", "shirts?\\b", "t-shirts?", "jeans", "jackets?", "hoodies?", "sweaters?",
      "trousers", "shorts\\b", "leggings", "abayas?", "scarf", "scarves", "hijab", "belts?\\b",
      "sunglasses", "jewel", "necklace", "earrings?", "bracelets?", "rings?\\b", "socks?\\b",
      "underwear", "swimwear", "swimsuit", "clothing", "apparel", "men's fashion", "women's fashion",
    ],
  },
  {
    siteName: "electronic",
    words: [
      "phones?\\b", "iphone", "smartphones?", "headphones?", "earbuds?", "earphones?", "speakers?\\b",
      "laptops?", "tablets?\\b", "ipad", "cameras?\\b", "chargers?\\b", "cables?\\b", "power ?bank",
      "\\btv\\b", "televisions?", "monitors?\\b", "keyboards?", "\\bmouse\\b", "routers?\\b",
      ["smart ?watch(es)?", 3], ["fitness tracker", 3], ["smart band", 3], "gaming", "consoles?\\b",
      "playstation", "xbox", "drones?\\b", "printers?\\b", "\\busb", "bluetooth", "electronics?",
    ],
  },
  {
    siteName: "home",
    words: [
      "kitchen", "cookware", "frying pan", "saucepan", "blenders?", "air ?fryer", "vacuum", "\\bmops?\\b",
      ["storage", 2], ["organi[sz]ers?", 2], "bedding", "pillows?", "bed ?sheets?", "curtains?",
      "towels?\\b", "furniture", "lamps?\\b", "racks?\\b", "containers?", "dinner", "cutlery", "appliances?",
      "mattress", "bins?\\b", "jugs?\\b", "mugs?\\b", "glass(es)?\\b", "tumblers?", "home decor",
      "cleaning", "laundry", "comforter", "duvet", "kettle", "toaster", "cooker", "fridge",
    ],
  },
  {
    siteName: "beauty",
    words: [
      "perfumes?", "fragrance", "eau de", "creams?\\b", "serum", "lotion", "shampoo", "conditioner",
      "make-?up", "lipstick", "mascara", "skin ?care", "face mask", "hair dryer", "straightener",
      "razors?\\b", "trimmers?\\b", "toothbrush", "deodorant", "beard", "nail", "moisturi[sz]er",
      "sunscreen", "cleanser", "personal care", "beauty",
    ],
  },
  {
    siteName: "sport",
    words: [
      "dumbbells?", "yoga", "fitness", "\\bgym\\b", "resistance bands?", "treadmill", "camping", "tents?\\b",
      "bicycles?", "cycling", "football", "basketball", "tennis", "swimming", "hiking", "fishing",
      "barbell", "kettlebell", "weights?\\b", "sports?\\b", "outdoors?", "protein",
    ],
  },
  {
    siteName: "toy",
    words: [
      "toys?\\b", "lego", "puzzles?", "dolls?\\b", "board game", "building blocks?", "action figures?",
      "rc car", "plush", "playset", "magnetic tiles?", "kids game", "games?\\b",
    ],
  },
].map((rule) => ({
  ...rule,
  compiled: rule.words.map((w) => {
    const [fragment, weight] = Array.isArray(w) ? w : [w, 1];
    return { re: new RegExp(`\\b${fragment}`, "i"), weight };
  }),
}));

function scoreRule(rule, title, amazonCategory) {
  let score = 0;
  for (const { re, weight } of rule.compiled) {
    if (title && re.test(title)) score += weight;
    // Amazon's own category text is a stronger hint than the title.
    if (amazonCategory && re.test(amazonCategory)) score += weight * 2;
  }
  return score;
}

/**
 * Picks the best site category id for a product, or null if unsure.
 * 1) the site's category name appears inside Amazon's category text, else
 * 2) keyword scoring on the product title + Amazon's category text.
 * `categories` is the list of { id, name } from the categories table.
 */
export function pickCategoryId(categories, title, amazonCategory) {
  if (!categories || categories.length === 0) return null;

  if (amazonCategory) {
    const haystack = amazonCategory.toLowerCase();
    let best = null;
    for (const cat of categories) {
      const needle = cat.name.toLowerCase();
      if (needle.length < 4) continue;
      if (haystack.includes(needle) && (!best || needle.length > best.name.length)) best = cat;
    }
    if (best) return best.id;
  }

  let bestRule = null;
  let bestScore = 0;
  for (const rule of RULES) {
    const score = scoreRule(rule, title || "", amazonCategory || "");
    if (score > bestScore) {
      bestScore = score;
      bestRule = rule;
    }
  }
  if (!bestRule) return null;
  const cat = categories.find((c) => c.name.toLowerCase().includes(bestRule.siteName));
  return cat ? cat.id : null;
}

/**
 * Fetches the site's categories and picks one for this product, so imported
 * products don't sit in "Uncategorised". Returns null if nothing fits.
 */
export async function matchCategoryFromAmazon(amazonCategoryText, title) {
  const { data: categories, error } = await supabaseAdmin.from("categories").select("id, name, slug");
  if (error || !categories) return null;
  return pickCategoryId(categories, title, amazonCategoryText);
}

/**
 * Gives a category to any of these products that don't have one yet, based
 * on what the product is. Products that already have a category are never
 * touched. Used when a sale page is deleted, so its products land in the
 * right place on the main site.
 */
export async function categorizeUncategorised(productIds) {
  const ids = (productIds || []).map(String);
  const empty = { checked: 0, updated: 0, unsure: 0, byCategory: {} };
  if (ids.length === 0) return empty;

  const { data: categories } = await supabaseAdmin.from("categories").select("id, name, slug");
  if (!categories || categories.length === 0) return empty;

  const { data: products } = await supabaseAdmin
    .from("products")
    .select("id, title, amazon_category")
    .is("category_id", null)
    .in("id", ids);

  const idsByCategory = new Map();
  let unsure = 0;
  for (const p of products || []) {
    const categoryId = pickCategoryId(categories, p.title, p.amazon_category);
    if (!categoryId) {
      unsure += 1;
      continue;
    }
    if (!idsByCategory.has(categoryId)) idsByCategory.set(categoryId, []);
    idsByCategory.get(categoryId).push(p.id);
  }

  const byCategory = {};
  let updated = 0;
  for (const [categoryId, productIdsForCategory] of idsByCategory) {
    const { error } = await supabaseAdmin
      .from("products")
      .update({ category_id: categoryId })
      .in("id", productIdsForCategory);
    if (error) continue;
    const name = categories.find((c) => c.id === categoryId)?.name || "Other";
    byCategory[name] = (byCategory[name] || 0) + productIdsForCategory.length;
    updated += productIdsForCategory.length;
  }
  return { checked: (products || []).length, updated, unsure, byCategory };
}
