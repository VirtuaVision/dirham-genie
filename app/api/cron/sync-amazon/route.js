import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminLoggedIn } from "@/lib/auth";
import { fetchProductsByAsins, searchProductsByKeyword, rankBestProducts, chunkArray } from "@/lib/amazon";
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
  return supabaseAdmin.from("products").insert({
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
  });
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
  let megaDealsToday = 0;

  for (const category of regularCategories) {
    if (megaDealsCategory && megaDealsToday < MAX_MEGA_DEALS_PER_DAY) {
      try {
        await sleep(1000);
        const dealResults = await searchWithPacing(`${category.name} clearance deal sale`, SEARCH_PAGE);
        const freshDeals = dealResults.filter((p) => !existingAsins.has(p.asin));
        const megaPicks = rankBestProducts(freshDeals, 1, 0.5);

        for (const item of megaPicks) {
          try {
            const { error } = await insertDiscoveredProduct(item, megaDealsCategory.id);
            if (error) throw error;
            existingAsins.add(item.asin);
            megaDealsToday += 1;
            megaDealsFound += 1;
            discovered += 1;
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

    try {
      await sleep(1000);
      const results = await searchWithPacing(`${category.name}${KEYWORD_SUFFIX}`, SEARCH_PAGE);
      const fresh = results.filter((p) => !existingAsins.has(p.asin));
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
      details.push(`Discovery search (${category.name}): ${err.message}`);
    }
  }

  // Custom keywords the admin typed in — searched directly, independent of
  // any category, so this works even for things that don't map neatly to
  // an existing category. Landed in Genie's Choice as a catch-all.
  for (const keyword of customKeywords) {
    try {
      await sleep(1000);
      const results = await searchWithPacing(keyword, SEARCH_PAGE);
      const fresh = results.filter((p) => !existingAsins.has(p.asin));
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
  const errorMessages = [];

  const { data: products } = await supabaseAdmin
    .from("products")
    .select("id, asin, price")
    .eq("source", "amazon_api")
    .eq("is_active", true)
    .not("asin", "is", null);

  const byAsin = new Map((products || []).map((p) => [p.asin, p]));
  const asinBatches = chunkArray([...byAsin.keys()], 10);

  for (const batch of asinBatches) {
    checked += batch.length;
    try {
      const freshItems = await fetchProductsByAsins(batch);

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
          })
          .eq("id", product.id);

        if (priceChanged) {
          await supabaseAdmin
            .from("price_history")
            .insert({ product_id: product.id, price: fresh.price });
          updated += 1;
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
      `Discovered ${discovered} new product(s) across categories (${megaDealsFound} of them 50%+ off, into Mega Deals). ${demoted} product(s) moved out of Mega Deals as they no longer qualify.\n` +
      errorMessages.join("\n") || null,
  };

  await supabaseAdmin.from("sync_logs").insert(summary);
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