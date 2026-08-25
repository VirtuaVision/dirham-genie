import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminLoggedIn } from "@/lib/auth";
import slugify from "slugify";
import { notifyDealAlertSubscribers } from "@/lib/notifyDealAlerts";
import { autoPostNewProduct } from "@/lib/socialPost";
import { autoGenerateAIImageForNewProduct } from "@/lib/aiImageGenerator";

export async function GET(request) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const fieldsMode = params.get("fields"); // "list" | "social" | null (= full)
  const limit = parseInt(params.get("limit") || "0", 10); // 0 = no pagination, existing behavior
  const page = Math.max(1, parseInt(params.get("page") || "1", 10));
  const search = params.get("search");
  const source = params.get("source"); // "amazon_api" | "manual" | null
  const dateFrom = params.get("dateFrom"); // "YYYY-MM-DD"
  const dateTo = params.get("dateTo"); // "YYYY-MM-DD"
  const idsOnly = params.get("idsOnly") === "true";

  const FIELD_SETS = {
    list: "id, title, slug, image_url, price, list_price, source, is_active, is_featured, categories(name, slug)",
    social: "id, title, slug, image_url, additional_images, price, list_price, affiliate_url, is_active",
  };

  let query = supabaseAdmin
    .from("products")
    .select(
      idsOnly ? "id" : FIELD_SETS[fieldsMode] || "*, categories(name, slug)",
      limit ? { count: "exact" } : undefined
    )
    .order("created_at", { ascending: false });

  if (search) query = query.ilike("title", `%${search}%`);
  if (source === "amazon_api") query = query.eq("source", "amazon_api");
  if (source === "manual") query = query.neq("source", "amazon_api");
  if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00.000Z`);
  if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59.999Z`);

  if (limit) {
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);
  }

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    products: data,
    total: limit ? count : data.length,
    page,
    totalPages: limit ? Math.max(1, Math.ceil(count / limit)) : 1,
  });
}

export async function POST(request) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.title || !body.affiliate_url) {
    return NextResponse.json(
      { error: "Title and affiliate link are required." },
      { status: 400 }
    );
  }

  const baseSlug = slugify(body.title, { lower: true, strict: true });
  let slug = baseSlug;
  let attempt = 0;

  while (true) {
    const { data: existing } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .insert({
      title: body.title,
      slug,
      brand: body.brand || null,
      description: body.description || null,
      image_url: body.image_url || null,
      price: body.price || null,
      list_price: body.list_price || null,
      currency: body.currency || "AED",
      asin: body.asin || null,
      affiliate_url: body.affiliate_url,
      category_id: body.category_id || null,
      source: body.source || "manual",
      is_featured: !!body.is_featured,
      is_active: body.is_active !== false,
      is_lightning_deal: !!body.is_lightning_deal,
      deal_expires_at: body.deal_expires_at || null,
      coupon_code: body.coupon_code || null,
      coupon_details: body.coupon_details || null,
      rating: body.rating || null,
      review_count: body.review_count || null,
      last_synced_at: body.source === "amazon_api" ? new Date().toISOString() : null,
      in_stock: body.in_stock !== false,
      additional_images: body.additional_images || null,
      amazon_category: body.amazon_category || null,
      amazon_sales_rank: body.amazon_sales_rank || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (data.price) {
    await supabaseAdmin.from("price_history").insert({ product_id: data.id, price: data.price });
  }

  notifyDealAlertSubscribers(data);
  autoGenerateAIImageForNewProduct(data);

  const autoPostToSocial = body.autoPostToSocial === true;
  const socialResults = autoPostToSocial
    ? await autoPostNewProduct(data, true)
    : {
        facebook: { skipped: true, reason: "Not posted — the 'also post to social' box wasn't checked." },
        instagram: { skipped: true, reason: "Not posted — the 'also post to social' box wasn't checked." },
        whatsapp: { skipped: true, reason: "Not posted — the 'also post to social' box wasn't checked." },
      };

  return NextResponse.json({ product: data, socialResults });
}