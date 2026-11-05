import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Run on every request, not once at deploy time.
export const dynamic = "force-dynamic";

// Short share link: dirhamgenie.com/p/<code>
// Opens that product's page on your site first. The "Buy on Amazon" button
// on that page then sends the shopper straight to Amazon with your
// affiliate tag. Unknown/inactive codes just land on the homepage.
export async function GET(request, { params }) {
  const code = (params.code || "").toLowerCase().trim();

  let target = "/";
  if (code) {
    const { data } = await supabaseAdmin
      .from("products")
      .select("slug")
      .eq("short_code", code)
      .eq("is_active", true)
      .maybeSingle();
    if (data?.slug) target = `/product/${data.slug}`;
  }

  return NextResponse.redirect(new URL(target, request.url), 302);
}
