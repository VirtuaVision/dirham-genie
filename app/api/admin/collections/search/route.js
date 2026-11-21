import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminLoggedIn } from "@/lib/auth";

const FIELDS = "id, title, image_url, price, brand, asin, is_active, category_id";

// Used by the collection editor to find products to add.
//   ?q=word          -> search product titles
//   ?asins=B0...,... -> look up products by ASIN or Amazon link (any mix,
//                       separated by spaces, commas or new lines)
export async function GET(request) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const asinsParam = searchParams.get("asins");

  if (asinsParam) {
    const asins = [
      ...new Set(
        (asinsParam.match(/[A-Za-z0-9]{10}/g) || [])
          .map((a) => a.toUpperCase())
          .filter((a) => /^B0[A-Z0-9]{8}$/.test(a) || /^\d{9}[\dX]$/.test(a))
      ),
    ].slice(0, 200);
    if (asins.length === 0) return NextResponse.json({ products: [], notFound: [] });
    const { data, error } = await supabaseAdmin.from("products").select(FIELDS).in("asin", asins);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const found = new Set((data || []).map((p) => p.asin));
    return NextResponse.json({ products: data || [], notFound: asins.filter((a) => !found.has(a)) });
  }

  const q = (searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ products: [] });
  const { data, error } = await supabaseAdmin
    .from("products")
    .select(FIELDS)
    .ilike("title", `%${q}%`)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data || [] });
}
