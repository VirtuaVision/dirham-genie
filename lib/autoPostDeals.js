import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { postToFacebookPage, buildSingleProductCaption } from "@/lib/socialPost";
import { postToWhatsAppChannel } from "@/lib/whatsappChannel";
import { captureAndUploadProductScreenshot } from "@/lib/screenshotProduct";

// Don't re-post the same product again until this many days have passed.
const REPOST_COOLDOWN_DAYS = 3;

async function pickDeal() {
  const cooldownCutoff = new Date(
    Date.now() - REPOST_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  // 1) Prefer a live lightning deal that hasn't been posted recently.
  const { data: lightning } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("is_lightning_deal", true)
    .gt("deal_expires_at", new Date().toISOString())
    .or(`last_social_posted_at.is.null,last_social_posted_at.lt.${cooldownCutoff}`)
    .order("last_social_posted_at", { ascending: true, nullsFirst: true })
    .limit(1);

  if (lightning && lightning.length > 0) return lightning[0];

  // 2) Otherwise fall back to the most-clicked product in the last 7 days.
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: clicks } = await supabaseAdmin
    .from("clicks")
    .select("product_id")
    .gte("created_at", sevenDaysAgo);

  if (!clicks || clicks.length === 0) return null;

  const counts = {};
  for (const c of clicks) {
    if (!c.product_id) continue;
    counts[c.product_id] = (counts[c.product_id] || 0) + 1;
  }

  const orderedIds = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);

  if (orderedIds.length === 0) return null;

  const { data: trendingProducts } = await supabaseAdmin
    .from("products")
    .select("*")
    .in("id", orderedIds)
    .eq("is_active", true);

  if (!trendingProducts || trendingProducts.length === 0) return null;

  const eligible = orderedIds
    .map((id) => trendingProducts.find((p) => p.id === id))
    .filter((p) => p && (!p.last_social_posted_at || p.last_social_posted_at < cooldownCutoff));

  return eligible[0] || null;
}

export async function autoPostTrendingOrLightningDeal() {
  if (process.env.SOCIAL_AUTO_POST_DEALS === "false") {
    return {
      skipped: true,
      reason: "Auto-posting deals is turned off (SOCIAL_AUTO_POST_DEALS=false).",
    };
  }

  const product = await pickDeal();
  if (!product) {
    return {
      skipped: true,
      reason: "No eligible lightning deal or trending product found to post today.",
    };
  }

  const caption = buildSingleProductCaption(product, true);
  const screenshotUrl = await captureAndUploadProductScreenshot(product.affiliate_url);
  const imageUrl = screenshotUrl || product.image_url;

  const [fb, wa] = await Promise.allSettled([
    postToFacebookPage(imageUrl, caption),
    postToWhatsAppChannel(imageUrl, caption),
  ]);

  const results = {
    facebook: fb.status === "fulfilled" ? fb.value : { ok: false, error: fb.reason?.message || "Unknown error" },
    whatsapp: wa.status === "fulfilled" ? wa.value : { ok: false, error: wa.reason?.message || "Unknown error" },
  };

  // Mark it posted regardless of individual platform failures, so a broken
  // Facebook token doesn't cause the same product to be picked every day.
  await supabaseAdmin
    .from("products")
    .update({ last_social_posted_at: new Date().toISOString() })
    .eq("id", product.id);

  return { productId: product.id, title: product.title, results };
}