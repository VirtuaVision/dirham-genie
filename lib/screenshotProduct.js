import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Captures a real screenshot of a product's live Amazon.ae page using
 * ScreenshotOne (https://screenshotone.com), then uploads it to Supabase
 * Storage the same way generated post images are handled — so it can be
 * fed straight into postToFacebookPage / postToInstagram / postToWhatsAppChannel.
 *
 * Deliberately captures just the top of the page (product photo, title,
 * price, deal badges) rather than the full page — that's the part that
 * actually reads well as a social post image.
 *
 * Returns null on any failure (missing key, request error, bad response)
 * so callers can fall back to the product's own stored image instead —
 * this is a nice-to-have, never something that should block a post.
 */
export async function captureAndUploadProductScreenshot(productUrl) {
  const accessKey = process.env.SCREENSHOTONE_ACCESS_KEY;
  if (!accessKey || !productUrl) return null;

  try {
    const params = new URLSearchParams({
      access_key: accessKey,
      url: productUrl,
      format: "jpg",
      image_quality: "90",
      full_page: "false",
      viewport_width: "1280",
      viewport_height: "1000",
      device_scale_factor: "1",
      block_ads: "true",
      block_cookie_banners: "true",
      block_trackers: "true",
      block_chats: "true",
      delay: "3",
      timeout: "30",
      // Amazon sometimes serves a bot-check interstitial ("Continue
      // shopping") to automated/headless requests instead of the real
      // product page. Waiting for the product title element to actually
      // appear — rather than just a fixed delay — means we only capture
      // once the real page has loaded. If it never shows up (still stuck
      // on the interstitial after the timeout), error_on_selector_not_found
      // makes the whole request fail instead of silently capturing the
      // wrong page — the caller already falls back to the product's own
      // stored image whenever this returns null.
      selector: "#productTitle",
      error_on_selector_not_found: "true",
    });

    const shotRes = await fetch(`https://api.screenshotone.com/take?${params.toString()}`);
    if (!shotRes.ok) return null;

    const buffer = Buffer.from(await shotRes.arrayBuffer());
    const filename = `shot-${Date.now()}.jpg`;

    const { error } = await supabaseAdmin.storage
      .from("social-posts")
      .upload(filename, buffer, { contentType: "image/jpeg", upsert: false });
    if (error) return null;

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
  } catch {
    return null;
  }
}