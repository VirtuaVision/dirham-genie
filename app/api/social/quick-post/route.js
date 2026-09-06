import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminLoggedIn } from "@/lib/auth";
import { postToSelectedPlatforms } from "@/lib/socialPost";

// Instagram publishing (when included in `platforms`) needs to poll for up
// to ~45s before it's allowed to actually publish. 250s stays safely under
// Vercel's 300s Hobby-plan ceiling while covering that worst case plus the
// screenshot capture step.
export const maxDuration = 250;

export async function POST(request) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId, caption, platforms } = await request.json();
  if (!productId) {
    return NextResponse.json({ error: "Missing productId." }, { status: 400 });
  }

  const { data: product, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (error || !product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  // platforms: optional array of "facebook" | "instagram" | "whatsapp".
  // Omitted or empty means "all three".
  const results = await postToSelectedPlatforms(product, {
    caption: typeof caption === "string" && caption.trim() ? caption : undefined,
    platforms: Array.isArray(platforms) && platforms.length > 0 ? platforms : undefined,
  });
  return NextResponse.json({ results });
}
