import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { formatAed, discountPercent, truncateTitle } from "@/lib/formatCurrency";
import { postToWhatsAppChannel } from "@/lib/whatsappChannel";
import { captureAndUploadProductScreenshot } from "@/lib/screenshotProduct";

const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;
const SITE_URL = "https://dirham-genie.vercel.app";

/**
 * Uploads a base64 JPEG (from the canvas-generated post image) to a public
 * Supabase Storage bucket, and returns its public URL — Facebook/Instagram's
 * API needs a real public URL, it can't accept a raw image upload directly
 * from a browser canvas. JPEG rather than PNG: Instagram's Graph API is
 * noticeably flakier accepting PNG image_url containers (intermittent
 * "Media ID is not available" errors) even when Facebook/WhatsApp accept
 * the exact same file without issue — JPEG is the format Instagram's docs
 * actually recommend, and it's smaller too, which helps it propagate faster.
 *
 * After uploading, briefly polls the public URL with HEAD requests — right
 * after upload, Instagram sometimes tries to fetch the image before it has
 * fully propagated, producing that same error. Waiting until the URL
 * actually resolves avoids that race.
 */
export async function uploadGeneratedImage(dataUrl) {
  const base64 = dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");
  const buffer = Buffer.from(base64, "base64");
  const filename = `post-${Date.now()}.jpg`;

  const { error } = await supabaseAdmin.storage
    .from("social-posts")
    .upload(filename, buffer, { contentType: "image/jpeg", upsert: false });

  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data } = supabaseAdmin.storage.from("social-posts").getPublicUrl(filename);
  const publicUrl = data.publicUrl;

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const headRes = await fetch(publicUrl, { method: "HEAD" });
      if (headRes.ok) break;
    } catch {
      // network hiccup — fall through to retry
    }
    await new Promise((resolve) => setTimeout(resolve, 800));
  }

  return publicUrl;
}

/** Posts a photo with a caption to your Facebook Page */
export async function postToFacebookPage(imageUrl, caption) {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!pageId || !token) {
    return { skipped: true, reason: "Facebook isn't configured yet (missing FACEBOOK_PAGE_ID / FACEBOOK_PAGE_ACCESS_TOKEN)." };
  }

  const res = await fetch(`${GRAPH_BASE}/${pageId}/photos`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: imageUrl, caption, access_token: token }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message || "Facebook post failed.");
  }
  return { ok: true, postId: json.post_id || json.id };
}

/**
 * Posts a photo with a caption to your Instagram Business account.
 * This is a two-step Graph API dance: create a media container, then
 * publish it. Retries the container-creation step up to twice more with
 * increasing delays if it fails — Instagram occasionally can't fetch a
 * freshly-uploaded image on the first try even after our own readiness
 * check passes.
 */
export async function postToInstagram(imageUrl, caption) {
  const igUserId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN; // same token as the linked Facebook Page
  if (!igUserId || !token) {
    return { skipped: true, reason: "Instagram isn't configured yet (missing INSTAGRAM_BUSINESS_ACCOUNT_ID)." };
  }

  async function createContainer() {
    const res = await fetch(`${GRAPH_BASE}/${igUserId}/media`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl, caption, access_token: token }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error?.message || "Instagram media creation failed.");
    }
    return json;
  }

  let createJson;
  try {
    createJson = await createContainer();
  } catch (err) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    try {
      createJson = await createContainer();
    } catch (err2) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      createJson = await createContainer();
    }
  }

  const publishRes = await fetch(`${GRAPH_BASE}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ creation_id: createJson.id, access_token: token }),
  });
  const publishJson = await publishRes.json();
  if (!publishRes.ok) {
    throw new Error(publishJson?.error?.message || "Instagram publish failed.");
  }
  return { ok: true, postId: publishJson.id };
}

/** Builds a ready-to-post caption for a single newly added product. */
export function buildSingleProductCaption(product, includeSocialLinks = true) {
  const price = formatAed(product.price) || "See price on Amazon";
  const discount = discountPercent(product.price, product.list_price);
  const priceLine = discount
    ? `${price} (was ${formatAed(product.list_price)}) — ${discount}% OFF 🔥`
    : price;

  const socialLinksBlock = includeSocialLinks
    ? `📲 WhatsApp: https://whatsapp.com/channel/0029VbDuCjs8F2pFx9WrrQ1b\n` +
      `👍 Facebook: https://www.facebook.com/share/1NpqYbsc6R/\n` +
      `📸 Instagram: https://www.instagram.com/dirham_genie\n\n`
    : "";

  return (
    `🧞‍♂️ New Deal Unlocked! 🔥\n\n` +
    `✨ ${truncateTitle(product.title)}\n` +
    `💰 ${priceLine}\n` +
    `🔗 ${product.affiliate_url}\n\n` +
    `📍 Shop more: ${SITE_URL}/\n\n` +
    socialLinksBlock +
    `#DirhamGenie #UAEDeals #AmazonUAE #DubaiDeals #DealsOfTheDay\n\n` +
    `As an Amazon Associate, Dirham Genie earns from qualifying purchases.`
  );
}

/**
 * Automatically posts a newly added product straight to Facebook,
 * Instagram, and WhatsApp. Prefers a real screenshot of the live Amazon
 * page over the product's own stored photo — falls back automatically if
 * the screenshot fails.
 *
 * Returns a results object ({facebook, instagram, whatsapp}, each
 * {ok/skipped/error}) so the caller (the Add Product page) can show the
 * person exactly what happened, instead of this running invisibly.
 *
 * Safe to call even if Meta/WhatsApp aren't configured yet — the individual
 * post functions return {skipped: true} in that case.
 *
 * Set SOCIAL_AUTO_POST_NEW_PRODUCT=false as an env var to turn this off
 * entirely without touching code (e.g. while testing, or during a bulk import).
 */
export async function autoPostNewProduct(product, includeSocialLinks = true) {
  if (process.env.SOCIAL_AUTO_POST_NEW_PRODUCT === "false") return null;
  if (!product?.is_active) return null;
  if (!product?.image_url) return null; // Graph API requires a public image URL

  const results = {};

  try {
    const caption = buildSingleProductCaption(product, includeSocialLinks);

    const screenshotUrl = await captureAndUploadProductScreenshot(product.affiliate_url);
    const imageUrl = screenshotUrl || product.image_url;

    const [fb, ig, wa] = await Promise.allSettled([
      postToFacebookPage(imageUrl, caption),
      postToInstagram(imageUrl, caption),
      postToWhatsAppChannel(imageUrl, caption),
    ]);

    results.facebook = fb.status === "fulfilled" ? fb.value : { ok: false, error: fb.reason?.message };
    results.instagram = ig.status === "fulfilled" ? ig.value : { ok: false, error: ig.reason?.message };
    results.whatsapp = wa.status === "fulfilled" ? wa.value : { ok: false, error: wa.reason?.message };

    if (!results.facebook.ok && !results.facebook.skipped) {
      console.error(`Auto-post to Facebook failed for product ${product.id}:`, results.facebook.error);
    }
    if (!results.instagram.ok && !results.instagram.skipped) {
      console.error(`Auto-post to Instagram failed for product ${product.id}:`, results.instagram.error);
    }
    if (!results.whatsapp.ok && !results.whatsapp.skipped) {
      console.error(`Auto-post to WhatsApp Channel failed for product ${product.id}:`, results.whatsapp.error);
    }
  } catch (err) {
    console.error(`Auto-post on new product ${product.id} failed:`, err.message);
    results.error = err.message;
  }

  return results;
}