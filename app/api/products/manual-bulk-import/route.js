import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import slugify from "slugify";
import { pickCategoryId } from "@/lib/matchCategoryFromAmazon";

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
      coupon_code: (row.coupon_code || "").trim() || null,
      coupon_details: (row.coupon_details || "").trim() || null,
    });
  }

  if (validRows.length === 0) {
    return NextResponse.json(
      {
        error:
          "None of the rows had both a title and an affiliate_url — those two are required. Expected format: title,price,list_price,image_url,affiliate_url,brand,coupon_code,coupon_details",
      },
      { status: 400 }
    );
  }

  // Category choice from the import page:
  //   a category id -> put everything in that category
  //   "auto"        -> sort by what each product is (from its name)
  //   "none"/empty  -> leave uncategorised
  const chosenCategory = category_id && category_id !== "auto" && category_id !== "none" ? category_id : null;
  const auto = category_id === "auto";
  let allCategories = [];
  if (auto) {
    const { data } = await supabaseAdmin.from("categories").select("id, name, slug");
    allCategories = data || [];
  }

  // Rows whose affiliate_url is already on the site aren't added twice.
  // Instead they're moved back to the top of the site, get the category you
  // picked, and get the coupon if they don't have one yet.
  const urls = validRows.map((r) => r.affiliate_url);
  const { data: existingProducts } = await supabaseAdmin
    .from("products")
    .select("id, affiliate_url, title, category_id, coupon_code, is_active")
    .in("affiliate_url", urls);
  const existingByUrl = new Map();
  for (const p of existingProducts || []) {
    if (!existingByUrl.has(p.affiliate_url)) existingByUrl.set(p.affiliate_url, p);
  }
  const newRows = validRows.filter((r) => !existingByUrl.has(r.affiliate_url));
  const existingRows = validRows.filter((r) => existingByUrl.has(r.affiliate_url));

  let movedToTop = 0;
  let couponAdded = 0;
  let hiddenMoved = 0;
  let recategorised = 0;
  let imported = 0;
  let errors = 0;
  const errorMessages = [];

  // Pasted order is kept: each gets a timestamp a millisecond apart.
  const baseTime = Date.now();
  for (let start = 0; start < existingRows.length; start += 10) {
    const group = existingRows.slice(start, start + 10);
    await Promise.all(
      group.map(async (row, offset) => {
        const p = existingByUrl.get(row.affiliate_url);
        const update = { created_at: new Date(baseTime + start + offset).toISOString() };
        let newCategory = null;
        if (chosenCategory) {
          if (p.category_id !== chosenCategory) newCategory = chosenCategory;
        } else if (auto && !p.category_id) {
          newCategory = pickCategoryId(allCategories, p.title, null);
        }
        if (newCategory) update.category_id = newCategory;
        const needsCode = row.coupon_code && !(p.coupon_code || "").trim();
        if (needsCode) {
          update.coupon_code = row.coupon_code;
          update.coupon_details = row.coupon_details;
        }
        const { error } = await supabaseAdmin.from("products").update(update).eq("id", p.id);
        if (error) {
          errors += 1;
          errorMessages.push(`${row.title}: ${error.message}`);
          return;
        }
        movedToTop += 1;
        if (newCategory) recategorised += 1;
        if (needsCode) couponAdded += 1;
        if (p.is_active === false) hiddenMoved += 1;
      })
    );
  }

  for (const row of newRows) {
    try {
      const slug = await uniqueSlug(row.title);
      const rowCategory =
        chosenCategory || (auto ? pickCategoryId(allCategories, row.title, null) : null) || null;
      const { error } = await supabaseAdmin.from("products").insert({
        title: row.title,
        slug,
        image_url: row.image_url,
        price: row.price,
        list_price: row.list_price,
        affiliate_url: row.affiliate_url,
        brand: row.brand,
        coupon_code: row.coupon_code,
        coupon_details: row.coupon_details,
        category_id: rowCategory,
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
    skippedDuplicates: existingByUrl.size,
    movedToTop,
    recategorised,
    couponAdded,
    hiddenMoved,
    invalidLines,
    errors,
    details: errorMessages,
  });
}
