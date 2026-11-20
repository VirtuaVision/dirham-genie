import { NextResponse } from "next/server";
import slugify from "slugify";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminLoggedIn } from "@/lib/auth";

export async function GET() {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data, error } = await supabaseAdmin
    .from("collections")
    .select("id, title, slug, is_active, show_in_menu, product_ids, created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    collections: (data || []).map((c) => ({ ...c, product_count: (c.product_ids || []).length })),
  });
}

export async function POST(request) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const title = (body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Give the page a title." }, { status: 400 });

  const slug = slugify(body.slug || title, { lower: true, strict: true });
  if (!slug) return NextResponse.json({ error: "That title can't make a web address." }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("collections")
    .insert({ title, slug, description: (body.description || "").trim() || null })
    .select()
    .single();
  if (error) {
    const msg =
      error.code === "23505" ? "Another page already uses that address — try a different title." : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ collection: data });
}
