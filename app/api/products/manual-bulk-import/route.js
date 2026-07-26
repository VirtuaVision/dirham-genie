import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import slugify from "slugify";

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

function toNumberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isNaN(num) ? null : num;
}

export async function POST(request) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { rows, category_id } = body || {};
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows to import." }, { status: 400 });
  }

  // A row is only usable if it has both a title and an affiliate link —
  // those are the two fields the products table requires.
  const validRows = [];
  let invalidLines = 0;
  for (const row of rows) {
    const title = (row.title || "").trim();
    const affiliate_url = (row.affiliate_url || row.link || "").trim();
    if (!title || !affiliate_url) {
      invalidLines += 1;
      continue;
    }
    validRows.push({
      title,
      affiliate_url,
      price: toNumberOrNull(row.price),
      list_price: toNumberOrNull(row.list_price),
      image_url: (row.image_url || "").trim() || null,
      brand: (row.brand || "").trim() || null,
    });
  }

  if (validRows.length === 0) {
    return NextResponse.json(
      {
        error:
          "None of the rows had both a title and an affiliate_url — those two are required. Expected format: title,price,list_price,image_url,affiliate_url,brand",
      },
      { status: 400 }
    );
  }

  // Skip rows whose affiliate_url is already on the site.
  const urls = validRows.map((r) => r.affiliate_url);
  const { data: existingProducts } = await supabaseAdmin
    .from("products")
    .select("affiliate_url")
    .in("affiliate_url", urls);
  const existingUrls = new Set((existingProducts || []).map((p) => p.affiliate_url));
  const newRows = validRows.filter((r) => !existingUrls.has(r.affiliate_url));

  let imported = 0;
  let errors = 0;
  const errorMessages = [];

  for (const row of newRows) {
    try {
      const slug = await uniqueSlug(row.title);
      const { error } = await supabaseAdmin.from("products").insert({
        title: row.title,
        slug,
        image_url: row.image_url,
        price: row.price,
        list_price: row.list_price,
        affiliate_url: row.affiliate_url,
        brand: row.brand,
        category_id: category_id || null,
        source: "manual",
        is_active: true,
        last_synced_at: new Date().toISOString(),
      });
      if (error) throw error;
      imported += 1;
    } catch (err) {
      errors += 1;
      errorMessages.push(`${row.title}: ${err.message}`);
    }
  }

  return NextResponse.json({
    imported,
    skippedDuplicates: existingUrls.size,
    invalidLines,
    errors,
    details: errorMessages,
  });
}
