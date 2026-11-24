import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Without this, Next.js 14 runs a plain GET route once at deploy time and
// keeps serving that frozen result — which is why codes added later never
// showed up. This makes it query the database on every request instead.
export const dynamic = "force-dynamic";
export const revalidate = 0;
// Also stops Next.js from reusing an earlier database answer for this route.
export const fetchCache = "force-no-store";

// Public: the active site-wide codes shown in the lamp popup. Never cached,
// so a code you add, edit or delete in the admin shows up on the very next tap.
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
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
