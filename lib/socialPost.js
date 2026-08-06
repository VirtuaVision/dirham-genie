import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { formatAed, discountPercent, truncateTitle } from "@/lib/formatCurrency";
import { postToWhatsAppChannel } from "@/lib/whatsappChannel";

const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;
const SITE_URL = "https://dirham-genie.vercel.app";

/**
 * Uploads a base64 JPEG (from the canvas-generated post image) to a public
 * Supabase Storage bucket, and returns its public URL. JPEG rather than
 * PNG: Instagram's Graph API is noticeably flakier accepting PNG image_url
 * containers (intermittent "Media ID is not available" errors) even when
 * Facebook/WhatsApp accept the exact same file without issue — JPEG is
 * what Instagram's docs actually recommend, and it's smaller too, which
 * helps it propagate faster.
 *
 * After uploading, briefly polls the public URL with HEAD requests to
 * avoid a race where Instagram fetches before the file has propagated.
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
 * Two-step Graph API dance: create a media container, then publish it.
 * Retries the container-creation step up to twice more with increasing
 * delays if it fails — Instagram occasionally can't fetch a freshly-
 * uploaded image on the first try even after our own readiness check passes.
 */
export async function postToInstagram(imageUrl, caption) {
  const igUserId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
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

export async function autoPostNewProduct(product) {
  if (process.env.SOCIAL_AUTO_POST_NEW_PRODUCT === "false") return;
  if (!product?.is_active) return;
  if (!product?.image_url) return;

  try {
    const caption = buildSingleProductCaption(product);

    const [fb, ig, wa] = await Promise.allSettled([
      postToFacebookPage(product.image_url, caption),
      postToInstagram(product.image_url, caption),
      postToWhatsAppChannel(product.image_url, caption),
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

    if (wa.status === "rejected") {
      console.error(`Auto-post to WhatsApp Channel failed for product ${product.id}:`, wa.reason?.message);
    } else if (wa.value && !wa.value.ok && !wa.value.skipped) {
      console.error(`Auto-post to WhatsApp Channel failed for product ${product.id}:`, wa.value.error);
    }
  } catch (err) {
    console.error(`Auto-post on new product ${product.id} failed:`, err.message);
  }
}