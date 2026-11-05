import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Public: the active site-wide codes shown in the lamp popup.
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("popup_coupon_codes")
    .select("id, code, label")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ codes: [] });

  return NextResponse.json(
    { codes: data || [] },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
  );
}
