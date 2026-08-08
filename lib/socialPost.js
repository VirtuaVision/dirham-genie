
import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { formatAed, discountPercent, truncateTitle } from "@/lib/formatCurrency";
import { postToWhatsAppChannel } from "@/lib/whatsappChannel";
import { captureAndUploadProductScreenshot } from "@/lib/screenshotProduct";

const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;
const SITE_URL = "https://dirham-genie.vercel.app";

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
      const e = json?.error;
      throw new Error(e ? `${e.message}${e.error_subcode ? ` (subcode ${e.error_subcode})` : ""}` : "Instagram media creation failed.");
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
    const e = publishJson?.error;
    throw new Error(e ? `${e.message}${e.error_subcode ? ` (subcode ${e.error_subcode})` : ""}` : "Instagram publish failed.");
  }
  return { ok: true, postId: publishJson.id };
}

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

export async function autoPostNewProduct(product, includeSocialLinks = true) {
  if (process.env.SOCIAL_AUTO_POST_NEW_PRODUCT === "false") {
    return { facebook: { skipped: true, reason: "Auto-posting is turned off (SOCIAL_AUTO_POST_NEW_PRODUCT=false)." } };
  }
  if (!product?.is_active) {
    return { facebook: { skipped: true, reason: "Product isn't marked Active, so it wasn't posted." } };
  }
  if (!product?.image_url) {
    return { facebook: { skipped: true, reason: "Product has no image, so it wasn't posted." } };
  }

  const results = {
    facebook: { ok: false, error: "Did not run (unexpected early failure)." },
    instagram: { ok: false, error: "Did not run (unexpected early failure)." },
    whatsapp: { ok: false, error: "Did not run (unexpected early failure)." },
  };

  try {
    const caption = buildSingleProductCaption(product, includeSocialLinks);

    const screenshotUrl = await captureAndUploadProductScreenshot(product.affiliate_url);
    const imageUrl = screenshotUrl || product.image_url;

    const [fb, ig, wa] = await Promise.allSettled([
      postToFacebookPage(imageUrl, caption),
      postToInstagram(imageUrl, caption),
      postToWhatsAppChannel(imageUrl, caption),
    ]);

    results.facebook = fb.status === "fulfilled" ? fb.value : { ok: false, error: fb.reason?.message || "Unknown error" };
    results.instagram = ig.status === "fulfilled" ? ig.value : { ok: false, error: ig.reason?.message || "Unknown error" };
    results.whatsapp = wa.status === "fulfilled" ? wa.value : { ok: false, error: wa.reason?.message || "Unknown error" };

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
    results.facebook = { ok: false, error: `Setup failed before posting: ${err.message}` };
    results.instagram = { ok: false, error: `Setup failed before posting: ${err.message}` };
    results.whatsapp = { ok: false, error: `Setup failed before posting: ${err.message}` };
  }

  return results;
}