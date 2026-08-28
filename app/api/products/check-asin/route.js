import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminLoggedIn } from "@/lib/auth";

export async function GET(request) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const asin = request.nextUrl.searchParams.get("asin");
  if (!asin) {
    return NextResponse.json({ error: "Missing asin." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id, title, slug, is_active")
    .eq("asin", asin)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ exists: !!data, product: data || null });
}
