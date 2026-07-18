import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { formatAed, discountPercent, truncateTitle } from "@/lib/formatCurrency";

const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;
const SITE_URL = "https://dirham-genie.vercel.app";

/**
 * Uploads a base64 PNG (from the canvas-generated post image) to a public
 * Supabase Storage bucket, and returns its public URL — Facebook/Instagram's
 * API needs a real public URL, it can't accept a raw image upload directly
 * from a browser canvas.
 */
export async function uploadGeneratedImage(dataUrl) {
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  const buffer = Buffer.from(base64, "base64");
  const filename = `post-${Date.now()}.png`;

  const { error } = await supabaseAdmin.storage
    .from("social-posts")
    .upload(filename, buffer, { contentType: "image/png", upsert: false });

  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data } = supabaseAdmin.storage.from("social-posts").getPublicUrl(filename);
  return data.publicUrl;
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
 * publish it.
 */
export async function postToInstagram(imageUrl, caption) {
  const igUserId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN; // same token as the linked Facebook Page
  if (!igUserId || !token) {
    return { skipped: true, reason: "Instagram isn't configured yet (missing INSTAGRAM_BUSINESS_ACCOUNT_ID)." };
  }

  const createRes = await fetch(`${GRAPH_BASE}/${igUserId}/media`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: token }),
  });
  const createJson = await createRes.json();
  if (!createRes.ok) {
    throw new Error(createJson?.error?.message || "Instagram media creation failed.");
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
export function buildSingleProductCaption(product) {
  const price = formatAed(product.price) || "See price on Amazon";
  const discount = discountPercent(product.price, product.list_price);
  const priceLine = discount
    ? `${price} (was ${formatAed(product.list_price)}) — ${discount}% OFF 🔥`
    : price;

  return (
    `🧞‍♂️ New Deal Unlocked! 🔥\n\n` +
    `✨ ${truncateTitle(product.title)}\n` +
    `💰 ${priceLine}\n` +
    `🔗 ${product.affiliate_url}\n\n` +
    `📍 Shop more: ${SITE_URL}/\n` +
    `📲 WhatsApp: https://whatsapp.com/channel/0029VbDuCjs8F2pFx9WrrQ1b\n` +
    `👍 Facebook: https://www.facebook.com/share/1NpqYbsc6R/\n` +
    `📸 Instagram: https://www.instagram.com/dirham_genie\n\n` +
    `#DirhamGenie #UAEDeals #AmazonUAE #DubaiDeals #DealsOfTheDay\n\n` +
    `As an Amazon Associate, Dirham Genie earns from qualifying purchases.`
  );
}

/**
 * Fire-and-forget: automatically posts a newly added product straight to
 * Facebook and Instagram, using the product's own image URL directly (no
 * canvas rendering needed here, unlike the multi-product Social Post
 * Generator in the admin panel — this is one product, one photo).
 *
 * Safe to call even if Meta isn't configured yet — postToFacebookPage/
 * postToInstagram just return {skipped: true} in that case, same as the
 * manual "Post to Facebook & Instagram" button.
 *
 * Set SOCIAL_AUTO_POST_NEW_PRODUCT=false as an env var to turn this off
 * without touching code (e.g. while testing, or during a bulk import).
 */
export async function autoPostNewProduct(product) {
  if (process.env.SOCIAL_AUTO_POST_NEW_PRODUCT === "false") return;
  if (!product?.is_active) return;
  if (!product?.image_url) return; // Graph API requires a public image URL

  try {
    const caption = buildSingleProductCaption(product);

    const [fb, ig] = await Promise.allSettled([
      postToFacebookPage(product.image_url, caption),
      postToInstagram(product.image_url, caption),
    ]);

    if (fb.status === "rejected") {
      console.error(`Auto-post to Facebook failed for product ${product.id}:`, fb.reason?.message);
    } else if (fb.value && !fb.value.ok && !fb.value.skipped) {
      console.error(`Auto-post to Facebook failed for product ${product.id}:`, fb.value.error);
    }

    if (ig.status === "rejected") {
      console.error(`Auto-post to Instagram failed for product ${product.id}:`, ig.reason?.message);
    } else if (ig.value && !ig.value.ok && !ig.value.skipped) {
      console.error(`Auto-post to Instagram failed for product ${product.id}:`, ig.value.error);
    }
  } catch (err) {
    console.error(`Auto-post on new product ${product.id} failed:`, err.message);
  }
}