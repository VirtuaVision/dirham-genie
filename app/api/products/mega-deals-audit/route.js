import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminLoggedIn } from "@/lib/auth";

export async function GET() {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: megaCategory } = await supabaseAdmin
    .from("categories")
    .select("id")
    .eq("slug", "mega-deals")
    .single();

  if (!megaCategory) {
    return NextResponse.json({ products: [] });
  }

  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("category_id", megaCategory.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const withDiscount = (products || []).map((p) => {
    const discount =
      p.list_price && p.price && p.list_price > p.price
        ? Math.round(((p.list_price - p.price) / p.list_price) * 100)
        : 0;
    return { ...p, computed_discount: discount, qualifies: discount >= 50 };
  });

  return NextResponse.json({ products: withDiscount });
}