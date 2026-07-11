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

async function discoverNewDeals() {
  let discovered = 0;
  let discoveryErrors = 0;
  const details = [];

  const { data: categories } = await supabaseAdmin.from("categories").select("id, name, slug");
  const { data: existingProducts } = await supabaseAdmin.from("products").select("asin").not("asin", "is", null);
  const existingAsins = new Set((existingProducts || []).map((p) => p.asin));

  for (const category of categories || []) {
    try {
      const results = await searchProductsByKeyword(category.name);
      const best = rankBestProducts(
        results.filter((p) => !existingAsins.has(p.asin)),
        NEW_PRODUCTS_PER_CATEGORY
      );

      for (const item of best) {
        try {
          const slug = await uniqueSlug(item.title);
          const { error } = await supabaseAdmin.from("products").insert({
            title: item.title,
            slug,
            brand: item.brand,
            description: item.description || null,
            image_url: item.image_url,
            price: item.price,
            list_price: item.list_price,
            currency: item.currency,
            asin: item.asin,
            affiliate_url: item.affiliate_url,
            category_id: category.id,
            source: "amazon_api",
            is_active: true,
            rating: item.rating,
            review_count: item.review_count,
            last_synced_at: new Date().toISOString(),
          });
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

  return { discovered, discoveryErrors, details };
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
            rating: fresh.rating,
            review_count: fresh.review_count,
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

  const { discovered, discoveryErrors, details: discoveryDetails } = await discoverNewDeals();
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
    details: `Discovered ${discovered} new product(s) across categories.\n` + errorMessages.join("\n") || null,
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