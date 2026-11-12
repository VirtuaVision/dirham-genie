import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { postToAutoSharePlatforms } from "@/lib/socialPost";
import { getAutoShareSettings } from "@/lib/autoShareSettings";
import { captureAndUploadProductScreenshot } from "@/lib/screenshotProduct";

const SITE_URL = "https://dirham-genie.vercel.app";
const REPOST_COOLDOWN_DAYS = 5;

function buildCaption(coupon) {
  const codeLine = coupon.code ? `\n🎟️ Code: ${coupon.code}` : "";
  const descLine = coupon.description ? `\n${coupon.description}` : "";
  const linkLine = coupon.affiliate_url ? `\n🔗 ${coupon.affiliate_url}` : "";

  return (
    `💸 Coupon Alert! 💸\n\n` +
    `${coupon.title}${codeLine}${descLine}${linkLine}\n\n` +
    `📍 More coupons: ${SITE_URL}/coupons\n\n` +
    `#DirhamGenie #UAEDeals #AmazonUAE #DubaiDeals #CouponCode`
  );
}

async function pickCoupon() {
  const now = new Date().toISOString();
  const cooldownCutoff = new Date(
    Date.now() - REPOST_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: coupons } = await supabaseAdmin
    .from("coupons")
    .select("*")
    .eq("is_active", true)
    .eq("auto_share_social", true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .or(`last_social_posted_at.is.null,last_social_posted_at.lt.${cooldownCutoff}`)
    .order("last_social_posted_at", { ascending: true, nullsFirst: true })
    .limit(1);

  return coupons && coupons.length > 0 ? coupons[0] : null;
}

// Coupons don't have their own photo, so if the coupon links to a product
// already in our catalog, borrow that product's image for the post.
async function findImageForCoupon(coupon) {
  if (coupon.affiliate_url) {
    const { data: product } = await supabaseAdmin
      .from("products")
      .select("image_url, affiliate_url")
      .eq("affiliate_url", coupon.affiliate_url)
      .maybeSingle();
    if (product?.image_url) return product.image_url;

    const screenshotUrl = await captureAndUploadProductScreenshot(coupon.affiliate_url);
    if (screenshotUrl) return screenshotUrl;
  }
  // Fall back to the site logo so the post always has some image.
  return `${SITE_URL}/logo-dirham-genie.png`;
}

export async function autoPostCouponHighlight() {
  if (process.env.SOCIAL_AUTO_POST_COUPON === "false") {
    return { skipped: true, reason: "Coupon highlight auto-posting is turned off (SOCIAL_AUTO_POST_COUPON=false)." };
  }

  const enabled = await getAutoShareSettings();
  if (!enabled.facebook && !enabled.instagram && !enabled.whatsapp) {
    return { skipped: true, reason: "All platforms are switched off in Auto-sharing settings." };
  }

  const coupon = await pickCoupon();
  if (!coupon) {
    return { skipped: true, reason: "No eligible active coupon found today." };
  }

  const caption = buildCaption(coupon);
  const imageUrl = await findImageForCoupon(coupon);

  const results = await postToAutoSharePlatforms(imageUrl, caption, enabled);

  await supabaseAdmin
    .from("coupons")
    .update({ last_social_posted_at: new Date().toISOString() })
    .eq("id", coupon.id);

  return { couponId: coupon.id, title: coupon.title, results };
}
