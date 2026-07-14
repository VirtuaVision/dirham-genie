import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminLoggedIn } from "@/lib/auth";
import { fetchProductsByAsins, searchProductsByKeyword, rankBestProducts, chunkArray } from "@/lib/amazon";
import slugify from "slugify";

// How many brand-new products to add per category, per run. Kept small and
// conservative to stay well within Amazon's daily request allowance.
const NEW_PRODUCTS_PER_CATEGORY = 2;

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

  const { data: allCategories } = await supabaseAdmin.from("categories").select("id, name, slug");
  const megaDealsCategory = (allCategories || []).find((c) => c.slug === "mega-deals");
  const regularCategories = (allCategories || []).filter(
    (c) => c.slug !== "mega-deals" && c.slug !== "genies-choice"
  );

  const { data: existingProducts } = await supabaseAdmin.from("products").select("asin").not("asin", "is", null);
  const existingAsins = new Set((existingProducts || []).map((p) => p.asin));
  let megaDealsToday = 0;

  for (const category of regularCategories) {
    try {
      const results = await searchProductsByKeyword(category.name);
      const fresh = results.filter((p) => !existingAsins.has(p.asin));

      // Pull out anything 50%+ off for the dedicated Mega Deals tab first,
      // reusing this same search instead of making extra API calls.
      let megaPicks = [];
      if (megaDealsCategory && megaDealsToday < MAX_MEGA_DEALS_PER_DAY) {
        megaPicks = rankBestProducts(fresh, 1, 0.5);
      }

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

      // Everything else goes through the normal per-category discovery,
      // excluding whatever was just claimed by Mega Deals above.
      const remaining = fresh.filter((p) => !megaPicks.some((m) => m.asin === p.asin));
      const best = rankBestProducts(remaining, NEW_PRODUCTS_PER_CATEGORY, 0.25);

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

  return { discovered, megaDealsFound, discoveryErrors, details };
}

async function runSync() {
  let checked = 0;
  let updated = 0;
  let errors = 0;
  const errorMessages = [];

  // 1) Refresh live data for every product that came from the Amazon API,
  // batching up to 10 ASINs per request (Amazon's per-request limit).
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

  // 2) Discover brand-new products across your categories, so the site
  // grows on its own without you having to paste in links.
  const { discovered, megaDealsFound, discoveryErrors, details: discoveryDetails } = await discoverNewDeals();
  errorMessages.push(...discoveryDetails);

  // 3) Expired-deal detection: turn off lightning-deal status once the deadline passes
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
      `Discovered ${discovered} new product(s) across categories (${megaDealsFound} of them 50%+ off, into Mega Deals).\n` +
      errorMessages.join("\n") || null,
  };

  await supabaseAdmin.from("sync_logs").insert(summary);
  return summary;
}

// Called automatically by your scheduler (Vercel Cron and/or an external
// service like cron-job.org), secured with CRON_SECRET
export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const summary = await runSync();
  return NextResponse.json(summary);
}

// Called from the admin panel's "Run Sync Now" button
export async function POST() {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const summary = await runSync();
  return NextResponse.json(summary);
}