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

  const { lines, category_id } = await request.json();
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

  // Skip ASINs that already exist on the site
  const { data: existingProducts } = await supabaseAdmin
    .from("products")
    .select("asin")
    .in("asin", asins);
  const existingAsins = new Set((existingProducts || []).map((p) => p.asin));
  const newAsins = asins.filter((a) => !existingAsins.has(a));

  let imported = 0;
  let errors = 0;
  const errorMessages = [];

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
    invalidLines: invalidCount,
    errors,
    details: errorMessages,
  });
}