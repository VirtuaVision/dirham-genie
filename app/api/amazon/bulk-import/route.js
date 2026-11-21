import { NextResponse } from "next/server";
import slugify from "slugify";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminLoggedIn } from "@/lib/auth";

export async function GET(request, { params }) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: collection, error } = await supabaseAdmin
    .from("collections")
    .select("*")
    .eq("id", params.id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  const ids = collection.product_ids || [];
  let products = [];
  if (ids.length > 0) {
    const { data } = await supabaseAdmin
      .from("products")
      .select("id, title, image_url, price, brand, asin, is_active, category_id")
      .in("id", ids);
    const byId = new Map((data || []).map((p) => [String(p.id), p]));
    products = ids.map((id) => byId.get(String(id))).filter(Boolean);
  }
  return NextResponse.json({ collection, products });
}

export async function PUT(request, { params }) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const update = {};

  if ("title" in body) {
    const title = (body.title || "").trim();
    if (!title) return NextResponse.json({ error: "The title can't be empty." }, { status: 400 });
    update.title = title;
  }
  if ("slug" in body) {
    const slug = slugify(body.slug || "", { lower: true, strict: true });
    if (!slug) return NextResponse.json({ error: "The web address can't be empty." }, { status: 400 });
    update.slug = slug;
  }
  if ("description" in body) update.description = (body.description || "").trim() || null;
  if ("is_active" in body) update.is_active = !!body.is_active;
  if ("show_in_menu" in body) update.show_in_menu = !!body.show_in_menu;
  if ("product_ids" in body) {
    const seen = new Set();
    update.product_ids = (Array.isArray(body.product_ids) ? body.product_ids : [])
      .map((x) => String(x))
      .filter((x) => x && !seen.has(x) && seen.add(x))
      .slice(0, 500);
  }

  const { data, error } = await supabaseAdmin
    .from("collections")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();
  if (error) {
    const msg =
      error.code === "23505" ? "Another page already uses that web address." : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ collection: data });
}

export async function DELETE(request, { params }) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { error } = await supabaseAdmin.from("collections").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
