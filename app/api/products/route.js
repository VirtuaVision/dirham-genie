import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminLoggedIn } from "@/lib/auth";
import slugify from "slugify";
import { notifyDealAlertSubscribers } from "@/lib/notifyDealAlerts";

export async function GET() {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*, categories(name, slug)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data });
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

  notifyDealAlertSubscribers(data); // fire-and-forget, doesn't block the response

  return NextResponse.json({ product: data });
}