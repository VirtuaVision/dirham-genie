import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminLoggedIn } from "@/lib/auth";
import { fetchProductsByAsins, searchProductsByKeyword, rankBestProducts, chunkArray } from "@/lib/amazon";
import { sendEmail } from "@/lib/email";
import { notifyDealAlertSubscribers } from "@/lib/notifyDealAlerts";
import slugify from "slugify";

// The pacing added below (to avoid Amazon's Creators API rate limit) adds
// real wall-clock time to this run, so give it plenty of headroom — this
// endpoint checks and discovers products, which is slow. 300s is the max
// on Vercel's Pro plan; on Hobby it'll be clamped to Hobby's own cap (60s)
// automatically, so this is safe to set high regardless of plan.
export const maxDuration = 300;

const NEW_PRODUCTS_PER_CATEGORY = 4;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function looksLikeRateLimit(err) {
  const msg = (err?.message || "").toLowerCase();
  return msg.includes("rate limit") || msg.includes("429") || msg.includes("too many requests");
}

// Amazon's searchItems always returns the same top-10 for an identical
// keyword+page. Without rotating something, discovery finds everything it's
// ever going to find within the first ~week and then permanently returns 0
// new products, which is what was happening. Rotating the page (1-5) and a
// keyword modifier by day of year means each day's run looks at a
// different slice of results instead of re-asking the same question.
const DAY_OF_YEAR = Math.floor(
  (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
);
const SEARCH_PAGE = (DAY_OF_YEAR % 5) + 1; // pages 1-5
const KEYWORD_VARIANTS = ["", " deals", " bestsellers", " new arrivals", " top rated"];
const KEYWORD_SUFFIX = KEYWORD_VARIANTS[DAY_OF_YEAR % KEYWORD_VARIANTS.length];

// A bare category name ("Electronics") is broad and tends to return the
// same generic, repetitive results. Specific product terms turn up far
// more varied, relevant items. One gets picked per category per day
// (rotating, so different terms get their turn across the week) instead
// of always searching the raw category name.
const CATEGORY_KEYWORD_POOL = {
  electronics: [
    "wireless earbuds",
    "bluetooth speaker",
    "power bank",
    "smart watch",
    "phone charger",
    "laptop bag",
    "gaming headset",
    "webcam",
  ],
  "home-kitchen": [
    "air fryer",
    "coffee maker",
    "kitchen knife set",
    "storage organizer",
    "bedding set",
    "vacuum cleaner",
    "blender",
    "cookware set",
  ],
  "beauty-personal-care": [
    "skincare set",
    "hair dryer",
    "electric shaver",
    "makeup brush set",
    "perfume",
    "hair straightener",
    "face serum",
    "electric toothbrush",
  ],
  fashion: [
    "running shoes",
    "backpack",
    "sunglasses",
    "wallet",
    "watch",
    "handbag",
    "sneakers",
    "jacket",
  ],
  "toys-games": [
    "building blocks",
    "board game",
    "remote control car",
    "puzzle",
    "action figure",
    "kids bicycle",
    "outdoor play set",
    "educational toy",
  ],
  "sports-outdoors": [
    "yoga mat",
    "camping tent",
    "resistance bands",
    "water bottle",
    "cycling helmet",
    "dumbbell set",
    "hiking backpack",
    "fitness tracker",
  ],
};

// Amazon pays wildly different commission rates by category (Fashion/
// Apparel/Shoes/Watches ~50%, Beauty ~19%, Home/Kitchen/Sports ~12%,
// Toys ~10%, Electronics ~4% — the lowest tier). Searching every category
// with equal effort ignores that. This weights discovery toward the
// categories that actually pay: high-commission categories get searched
// with more keyword picks per day; low-commission ones get skipped on
// some days entirely to make room, rather than blowing up total run time.
const CATEGORY_WEIGHT = {
  fashion: { picks: 3, everyNDays: 1 }, // Apparel/Shoes/Watches — 50%
  "beauty-personal-care": { picks: 2, everyNDays: 1 }, // Beauty — 19%
  "home-kitchen": { picks: 1, everyNDays: 1 }, // Home/Kitchen — 12%
  "sports-outdoors": { picks: 1, everyNDays: 1 }, // Sporting Goods — 12%
  "toys-games": { picks: 1, everyNDays: 2 }, // Toys — 10%
  electronics: { picks: 1, everyNDays: 3 }, // Electronics/Wireless — ~4%, lowest
};
const DEFAULT_WEIGHT = { picks: 1, everyNDays: 1 };

/** Returns the list of keywords to search for this category today (can be
 *  more than one for high-commission categories, or empty if today is a
 *  skip day for a low-commission one). */
function keywordsForCategoryToday(category) {
  const weight = CATEGORY_WEIGHT[category.slug] || DEFAULT_WEIGHT;
  if (DAY_OF_YEAR % weight.everyNDays !== 0) return [];

  const pool = CATEGORY_KEYWORD_POOL[category.slug];
  if (!pool || pool.length === 0) return [`${category.name}${KEYWORD_SUFFIX}`];

  const picks = [];
  for (let i = 0; i < weight.picks; i++) {
    picks.push(pool[(DAY_OF_YEAR + i) % pool.length]);
  }
  return picks;
}

/**
 * Amazon's Creators API throttles requests per second. Firing a search per
 * category back-to-back (as this discovery loop does) reliably trips that
 * limit after the first few categories, silently killing discovery for the
 * rest of the run. This wraps a search call with pacing + one retry after a
 * longer backoff if it does get rate-limited.
 */
async function searchWithPacing(keyword, page = 1) {
  try {
    return await searchProductsByKeyword(keyword, page);
  } catch (err) {
    if (!looksLikeRateLimit(err)) throw err;
    await sleep(3000);
    return await searchProductsByKeyword(keyword, page);
  }
}

const FILLER_WORDS = new Set([
  "the", "a", "an", "with", "for", "and", "of", "to", "in", "on",
  "pack", "set", "pcs", "piece", "pieces", "new", "premium",
]);

/** Reduces a title to a comparable set of meaningful words — strips
 *  punctuation, casing, and common filler/marketing words so that near-
 *  identical listings ("Wireless Earbuds Bluetooth 5.3" vs "Bluetooth
 *  Wireless Earbuds V5.3, New") are recognized as duplicates. */
function titleTokens(title) {
  return new Set(
    (title || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !FILLER_WORDS.has(w))
  );
}

function tokenOverlap(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let shared = 0;
  for (const w of setA) if (setB.has(w)) shared += 1;
  return shared / Math.min(setA.size, setB.size);
}

/** True if this item is a near-duplicate of something already in the same
 *  category (same product, slightly different listing/title) — catches
 *  cases the ASIN-based dedupe misses because it's a different ASIN
 *  entirely (different seller/variant of the same item). */
function isNearDuplicate(item, existingTitlesByCategory, categoryId) {
  const candidates = existingTitlesByCategory.get(categoryId) || [];
  const itemTokens = titleTokens(item.title);
  return candidates.some((tokens) => tokenOverlap(itemTokens, tokens) >= 0.75);
}

async function uniqueSlug(title) {
  const base = slugify(title, { lower: true, strict: true }) || "product";
  let slug = base;
  let attempt = 0;
  while (true) {
    const { data: existing } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) return slug;
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
}

async function insertDiscoveredProduct(item, categoryId) {
  const slug = await uniqueSlug(item.title);
  return supabaseAdmin
    .from("products")
    .insert({
      title: item.title,
      slug,
      brand: item.brand,
      description: item.description || null,
      image_url: item.image_url,
      additional_images: item.additional_images || null,
      price: item.price,
      list_price: item.list_price,
      currency: item.currency,
      asin: item.asin,
      affiliate_url: item.affiliate_url,
      category_id: categoryId,
      source: "amazon_api",
      is_active: true,
      in_stock: item.in_stock !== false,
      amazon_category: item.amazon_category || null,
      amazon_sales_rank: item.amazon_sales_rank || null,
      rating: item.rating,
      review_count: item.review_count,
      last_synced_at: new Date().toISOString(),
    })
    .select()
    .single();
}

const MAX_MEGA_DEALS_PER_DAY = 6;

async function discoverNewDeals() {
  let discovered = 0;
  let megaDealsFound = 0;
  let discoveryErrors = 0;
  const details = [];

  const { data: settingsRows } = await supabaseAdmin
    .from("site_settings")
    .select("key, value")
    .in("key", ["discovery_enabled", "discovery_keywords"]);
  const settings = {};
  (settingsRows || []).forEach((row) => (settings[row.key] = row.value));

  // Default to enabled if the setting has never been saved.
  const discoveryEnabled = settings.discovery_enabled !== "false";
  const customKeywords = (settings.discovery_keywords || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  if (!discoveryEnabled) {
    return {
      discovered: 0,
      megaDealsFound: 0,
      discoveryErrors: 0,
      details: ["Auto-discovery is paused (toggle it back on in Sync Logs to resume)."],
    };
  }

  const { data: allCategories } = await supabaseAdmin.from("categories").select("id, name, slug");
  const megaDealsCategory = (allCategories || []).find((c) => c.slug === "mega-deals");
  const genieChoiceCategory = (allCategories || []).find((c) => c.slug === "genies-choice");
  const regularCategories = (allCategories || []).filter(
    (c) => c.slug !== "mega-deals" && c.slug !== "genies-choice"
  );

  const { data: existingProducts } = await supabaseAdmin.from("products").select("asin").not("asin", "is", null);
  const existingAsins = new Set((existingProducts || []).map((p) => p.asin));

  // For near-duplicate detection: existing product titles, tokenized and
  // grouped by category, so a listing that slipped past the ASIN check
  // (different seller/variant of the same item) still gets caught.
  const { data: titleRows } = await supabaseAdmin
    .from("products")
    .select("title, category_id")
    .eq("is_active", true);
  const existingTitlesByCategory = new Map();
  (titleRows || []).forEach((row) => {
    if (!row.category_id) return;
    const list = existingTitlesByCategory.get(row.category_id) || [];
    list.push(titleTokens(row.title));
    existingTitlesByCategory.set(row.category_id, list);
  });

  // Smarter discovery: give one bonus keyword pick today to whichever
  // category has driven the most affiliate clicks in the last 30 days —
  // actual visitor interest, not just Amazon's commission table, gets a
  // say in where discovery effort goes.
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentClicks } = await supabaseAdmin
    .from("clicks")
    .select("product_id")
    .gte("created_at", thirtyDaysAgo);
  let topPerformingCategoryId = null;
  if (recentClicks && recentClicks.length > 0) {
    const clickedProductIds = [...new Set(recentClicks.map((c) => c.product_id).filter(Boolean))];
    if (clickedProductIds.length > 0) {
      const { data: clickedProducts } = await supabaseAdmin
        .from("products")
        .select("id, category_id")
        .in("id", clickedProductIds);
      const categoryClickCounts = {};
      const productCategory = new Map((clickedProducts || []).map((p) => [p.id, p.category_id]));
      recentClicks.forEach((c) => {
        const catId = productCategory.get(c.product_id);
        if (!catId) return;
        categoryClickCounts[catId] = (categoryClickCounts[catId] || 0) + 1;
      });
      const ranked = Object.entries(categoryClickCounts).sort((a, b) => b[1] - a[1]);
      if (ranked.length > 0) topPerformingCategoryId = ranked[0][0];
    }
  }

  let megaDealsToday = 0;

  for (const category of regularCategories) {
    let todaysKeywords = keywordsForCategoryToday(category);

    // Click-performance bonus: today's top-clicked category gets one extra
    // keyword pick, even on an otherwise skipped/low-frequency day.
    if (category.id === topPerformingCategoryId) {
      const pool = CATEGORY_KEYWORD_POOL[category.slug];
      const bonusKeyword = pool ? pool[(DAY_OF_YEAR + 7) % pool.length] : `${category.name} popular`;
      if (todaysKeywords.length === 0) {
        details.push(`${category.name}: normally skipped today, but ran anyway — it's your top-clicked category this month.`);
      }
      todaysKeywords = [...todaysKeywords, bonusKeyword];
    }

    if (todaysKeywords.length === 0) {
      details.push(`${category.name}: skipped today (lower-commission category, runs less often).`);
      continue;
    }

    if (megaDealsCategory && megaDealsToday < MAX_MEGA_DEALS_PER_DAY) {
      try {
        await sleep(1000);
        const dealResults = await searchWithPacing(`${todaysKeywords[0]} clearance deal sale`, SEARCH_PAGE);
        const freshDeals = dealResults
          .filter((p) => !existingAsins.has(p.asin))
          .filter((p) => !isNearDuplicate(p, existingTitlesByCategory, megaDealsCategory.id));
        const megaPicks = rankBestProducts(freshDeals, 1, 0.5);

        for (const item of megaPicks) {
          try {
            const { data: inserted, error } = await insertDiscoveredProduct(item, megaDealsCategory.id);
            if (error) throw error;
            existingAsins.add(item.asin);
            megaDealsToday += 1;
            megaDealsFound += 1;
            discovered += 1;
            // A mega deal (50%+ off) is exciting enough to tell subscribers
            // about right away, rather than waiting for them to browse in.
            if (inserted) notifyDealAlertSubscribers(inserted).catch(() => {});
          } catch (err) {
            discoveryErrors += 1;
            details.push(`Mega deal insert (${category.name}): ${err.message}`);
          }
        }
      } catch (err) {
        discoveryErrors += 1;
        details.push(`Mega deal search (${category.name}): ${err.message}`);
      }
    }

    // Higher-commission categories (Fashion, Beauty) search multiple
    // keywords per day here; lower-commission ones search just one.
    for (const keyword of todaysKeywords) {
      try {
        await sleep(1000);
        const results = await searchWithPacing(keyword, SEARCH_PAGE);
        const fresh = results
          .filter((p) => !existingAsins.has(p.asin))
          .filter((p) => !isNearDuplicate(p, existingTitlesByCategory, category.id));
        const best = rankBestProducts(fresh, NEW_PRODUCTS_PER_CATEGORY, 0.1);

        for (const item of best) {
          try {
            const { error } = await insertDiscoveredProduct(item, category.id);
            if (error) throw error;
            existingAsins.add(item.asin);
            discovered += 1;
          } catch (err) {
            discoveryErrors += 1;
            details.push(`Discovery insert (${category.name}): ${err.message}`);
          }
        }
      } catch (err) {
        discoveryErrors += 1;
        details.push(`Discovery search (${category.name}, "${keyword}"): ${err.message}`);
      }
    }
  }

  // Custom keywords the admin typed in — searched directly, independent of
  // any category, so this works even for things that don't map neatly to
  // an existing category. Landed in Genie's Choice as a catch-all.
  for (const keyword of customKeywords) {
    try {
      await sleep(1000);
      const results = await searchWithPacing(keyword, SEARCH_PAGE);
      const fresh = results
        .filter((p) => !existingAsins.has(p.asin))
        .filter((p) => !isNearDuplicate(p, existingTitlesByCategory, genieChoiceCategory?.id));
      const best = rankBestProducts(fresh, NEW_PRODUCTS_PER_CATEGORY, 0.1);

      for (const item of best) {
        try {
          const { error } = await insertDiscoveredProduct(item, genieChoiceCategory?.id || null);
          if (error) throw error;
          existingAsins.add(item.asin);
          discovered += 1;
        } catch (err) {
          discoveryErrors += 1;
          details.push(`Custom keyword insert ("${keyword}"): ${err.message}`);
        }
      }
    } catch (err) {
      discoveryErrors += 1;
      details.push(`Custom keyword search ("${keyword}"): ${err.message}`);
    }
  }

  return { discovered, megaDealsFound, discoveryErrors, details };
}

async function demoteStaleMegaDeals() {
  const { data: cats } = await supabaseAdmin.from("categories").select("id, slug");
  const megaDeals = (cats || []).find((c) => c.slug === "mega-deals");
  const fallback = (cats || []).find((c) => c.slug === "genies-choice");
  if (!megaDeals || !fallback) return 0;

  const { data: members } = await supabaseAdmin
    .from("products")
    .select("id, price, list_price")
    .eq("category_id", megaDeals.id);

  let demoted = 0;
  for (const p of members || []) {
    const discount =
      p.list_price && p.price && p.list_price > p.price
        ? (p.list_price - p.price) / p.list_price
        : 0;
    if (discount < 0.5) {
      await supabaseAdmin.from("products").update({ category_id: fallback.id }).eq("id", p.id);
      demoted += 1;
    }
  }
  return demoted;
}

async function runSync() {
  let checked = 0;
  let updated = 0;
  let errors = 0;
  let deactivated = 0;
  const errorMessages = [];

  const { data: products } = await supabaseAdmin
    .from("products")
    .select("id, asin, price, title, sync_miss_count")
    .eq("source", "amazon_api")
    .eq("is_active", true)
    .not("asin", "is", null);

  const byAsin = new Map((products || []).map((p) => [p.asin, p]));
  const asinBatches = chunkArray([...byAsin.keys()], 10);

  for (const batch of asinBatches) {
    checked += batch.length;
    try {
      const freshItems = await fetchProductsByAsins(batch);
      const foundAsins = new Set(freshItems.map((f) => f.asin));

      for (const fresh of freshItems) {
        const product = byAsin.get(fresh.asin);
        if (!product) continue;

        const priceChanged = fresh.price && fresh.price !== product.price;

        await supabaseAdmin
          .from("products")
          .update({
            price: fresh.price,
            list_price: fresh.list_price,
            image_url: fresh.image_url,
            additional_images: fresh.additional_images || null,
            rating: fresh.rating,
            review_count: fresh.review_count,
            in_stock: fresh.in_stock !== false,
            amazon_category: fresh.amazon_category || null,
            amazon_sales_rank: fresh.amazon_sales_rank || null,
            last_synced_at: new Date().toISOString(),
            sync_miss_count: 0,
          })
          .eq("id", product.id);

        if (priceChanged) {
          await supabaseAdmin
            .from("price_history")
            .insert({ product_id: product.id, price: fresh.price });
          updated += 1;
        }
      }

      // Anything requested but not returned this run is either delisted or
      // had a transient hiccup. Track consecutive misses per product and
      // only deactivate after 3 in a row, so one flaky API response
      // doesn't take a live product off the site.
      for (const asin of batch) {
        if (foundAsins.has(asin)) continue;
        const product = byAsin.get(asin);
        if (!product) continue;

        const missCount = (product.sync_miss_count || 0) + 1;
        if (missCount >= 3) {
          await supabaseAdmin
            .from("products")
            .update({ is_active: false, sync_miss_count: missCount, last_synced_at: new Date().toISOString() })
            .eq("id", product.id);
          deactivated += 1;
          errorMessages.push(
            `Deactivated "${product.title}" (${asin}) — not found on Amazon 3 syncs in a row, likely delisted.`
          );
        } else {
          await supabaseAdmin.from("products").update({ sync_miss_count: missCount }).eq("id", product.id);
        }
      }
    } catch (err) {
      errors += batch.length;
      errorMessages.push(`Batch [${batch.join(", ")}]: ${err.message}`);
    }
  }

  const demoted = await demoteStaleMegaDeals();

  const { discovered, megaDealsFound, discoveryErrors, details: discoveryDetails } = await discoverNewDeals();
  errorMessages.push(...discoveryDetails);

  const nowIso = new Date().toISOString();
  await supabaseAdmin
    .from("products")
    .update({ is_lightning_deal: false })
    .lt("deal_expires_at", nowIso)
    .eq("is_lightning_deal", true);

  await supabaseAdmin
    .from("coupons")
    .update({ is_active: false })
    .lt("expires_at", nowIso)
    .eq("is_active", true);

  const summary = {
    products_checked: checked,
    products_updated: updated,
    new_products_discovered: discovered,
    errors: errors + discoveryErrors,
    details:
      `Discovered ${discovered} new product(s) across categories (${megaDealsFound} of them 50%+ off, into Mega Deals). ${demoted} product(s) moved out of Mega Deals as they no longer qualify. ${deactivated} product(s) auto-deactivated as delisted.\n` +
      errorMessages.join("\n") || null,
  };

  await supabaseAdmin.from("sync_logs").insert(summary);

  // Fire-and-forget: sendEmail() itself no-ops quietly if RESEND_API_KEY or
  // ADMIN_NOTIFICATION_EMAIL aren't set, so this is safe either way.
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (adminEmail) {
    sendEmail({
      to: adminEmail,
      subject: `Dirham Genie sync: ${discovered} new, ${updated} updated, ${summary.errors} errors`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
          <h2 style="color:#8A6D1F;">🪔 Daily Sync Summary</h2>
          <ul style="line-height:1.8;">
            <li>Checked: ${checked}</li>
            <li>Prices updated: ${updated}</li>
            <li>New products discovered: ${discovered} (${megaDealsFound} mega deals)</li>
            <li>Deactivated (delisted): ${deactivated}</li>
            <li>Errors: ${summary.errors}</li>
          </ul>
          <p style="font-size:12px;color:#888;">See full details in Sync Logs.</p>
        </div>
      `,
    }).catch(() => {});
  }

  return summary;
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const summary = await runSync();
  return NextResponse.json(summary);
}

export async function POST() {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const summary = await runSync();
  return NextResponse.json(summary);
}