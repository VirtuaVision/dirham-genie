import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchProductsByAsins, chunkArray } from "@/lib/amazon";
import slugify from "slugify";

function extractAsin(input) {
  const trimmed = input.trim();
  const match = trimmed.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
  if (match) return match[1].toUpperCase();
  if (/^[A-Z0-9]{10}$/i.test(trimmed)) return trimmed.toUpperCase();
  return null;
}

async function uniqueSlug(title) {
  const base = slugify(title, { lower: true, strict: true });
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

export async function POST(request) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lines, category_id, coupon_code, coupon_details } = await request.json();
  if (!Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json({ error: "No ASINs or links provided." }, { status: 400 });
  }

  const asins = [...new Set(lines.map(extractAsin).filter(Boolean))];
  const invalidCount = lines.length - asins.length;

  if (asins.length === 0) {
    return NextResponse.json(
      { error: "None of the lines contained a valid ASIN or Amazon.ae product URL." },
      { status: 400 }
    );
  }

  // ASINs already on the site aren't fetched again. Instead they're moved
  // back to the top of the site (the "Newest" order is by created_at, so
  // refreshing that date puts them on page one again), and if you entered a
  // batch coupon code, it's added to any of them that don't have a code yet.
  const { data: existingProducts } = await supabaseAdmin
    .from("products")
    .select("id, asin, coupon_code, is_active")
    .in("asin", asins);
  const existingAsins = new Set((existingProducts || []).map((p) => p.asin));
  const newAsins = asins.filter((a) => !existingAsins.has(a));

  const batchCode = (coupon_code || "").trim();
  const batchDetails = (coupon_details || "").trim();

  // Keep the order you pasted them in: each one gets a timestamp a
  // millisecond apart, so later lines end up slightly newer (shown first),
  // just like freshly imported products.
  const byAsin = new Map();
  for (const p of existingProducts || []) {
    if (!byAsin.has(p.asin)) byAsin.set(p.asin, []);
    byAsin.get(p.asin).push(p);
  }
  const toBump = [];
  asins.forEach((asin) => {
    (byAsin.get(asin) || []).forEach((p) => toBump.push(p));
  });

  let movedToTop = 0;
  let couponAdded = 0;
  let hiddenMoved = 0;
  const baseTime = Date.now();
  const bumpErrors = [];

  for (const group of chunkArray(toBump.map((p, i) => ({ p, i })), 10)) {
    await Promise.all(
      group.map(async ({ p, i }) => {
        const update = { created_at: new Date(baseTime + i).toISOString() };
        const needsCode = batchCode && !(p.coupon_code || "").trim();
        if (needsCode) {
          update.coupon_code = batchCode;
          update.coupon_details = batchDetails || null;
        }
        const { error } = await supabaseAdmin.from("products").update(update).eq("id", p.id);
        if (error) {
          bumpErrors.push(`${p.asin}: ${error.message}`);
          return;
        }
        movedToTop += 1;
        if (needsCode) couponAdded += 1;
        if (p.is_active === false) hiddenMoved += 1;
      })
    );
  }

  let imported = 0;
  let errors = bumpErrors.length;
  const errorMessages = [...bumpErrors];

  for (const batch of chunkArray(newAsins, 10)) {
    try {
      const items = await fetchProductsByAsins(batch);
      for (const item of items) {
        try {
          const slug = await uniqueSlug(item.title);
          const { error } = await supabaseAdmin.from("products").insert({
            title: item.title,
            slug,
            description: item.description || null,
            image_url: item.image_url,
            additional_images: item.additional_images || null,
            price: item.price,
            list_price: item.list_price,
            currency: item.currency,
            asin: item.asin,
            affiliate_url: item.affiliate_url,
            category_id: category_id || null,
            coupon_code: coupon_code || null,
            coupon_details: coupon_details || null,
            source: "amazon_api",
            is_active: true,
            in_stock: item.in_stock !== false,
            amazon_category: item.amazon_category || null,
            amazon_sales_rank: item.amazon_sales_rank || null,
            rating: item.rating,
            review_count: item.review_count,
            last_synced_at: new Date().toISOString(),
          });
          if (error) throw error;
          imported += 1;
        } catch (err) {
          errors += 1;
          errorMessages.push(`${item.asin}: ${err.message}`);
        }
      }
    } catch (err) {
      errors += batch.length;
      errorMessages.push(`Batch [${batch.join(", ")}]: ${err.message}`);
    }
  }

  return NextResponse.json({
    imported,
    skippedDuplicates: existingAsins.size,
    movedToTop,
    couponAdded,
    hiddenMoved,
    invalidLines: invalidCount,
    errors,
    details: errorMessages,
  });
}