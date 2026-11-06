import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Run on every request, not once at deploy time.
export const dynamic = "force-dynamic";

// Short share link: <your-site>/p/<code>
// The click passes through your site (so it's counted in your click stats)
// and is sent straight on to that product's Amazon affiliate link — on a
// phone with the Amazon app installed, Amazon normally opens it in the app.
//
// Add ?view=1 to the link to open the product page on your site instead.
// Unknown/inactive codes just land on the homepage.
export async function GET(request, { params }) {
  const code = (params.code || "").toLowerCase().trim();
  const wantsPage = request.nextUrl.searchParams.get("view") === "1";

  let product = null;
  if (code) {
    const { data } = await supabaseAdmin
      .from("products")
      .select("id, slug, affiliate_url")
      .eq("short_code", code)
      .eq("is_active", true)
      .maybeSingle();
    product = data;
  }

  if (!product) {
    return NextResponse.redirect(new URL("/", request.url), 302);
  }

  const amazonUrl = product.affiliate_url || "";
  if (!wantsPage && /^https?:\/\//i.test(amazonUrl)) {
    // Count it like a normal "Buy on Amazon" click. Never let a tracking
    // hiccup stop the shopper from reaching Amazon.
    try {
      await supabaseAdmin.from("clicks").insert({ product_id: product.id });
    } catch {}

    const res = NextResponse.redirect(amazonUrl, 302);
    res.headers.set("Cache-Control", "no-store");
    res.headers.set("X-Robots-Tag", "noindex");
    return res;
  }

  return NextResponse.redirect(new URL(`/product/${product.slug}`, request.url), 302);
}
