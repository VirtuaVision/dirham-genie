import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminLoggedIn } from "@/lib/auth";
import { fetchProductsByAsins, searchProductsByKeyword, rankBestProducts, chunkArray } from "@/lib/amazon";
import slugify from "slugify";

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
    if (megaDealsCategory && megaDealsToday < MAX_MEGA_DEALS_PER_DAY) {
      try {
        const dealResults = await searchProductsByKeyword(`${category.name} clearance deal sale`);
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
      const results = await searchProductsByKeyword(category.name);
      const fresh = results.filter((p) => !existingAsins.has(p.asin));
      const best = rankBestProducts(fresh, NEW_PRODUCTS_PER_CATEGORY, 0.25);

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