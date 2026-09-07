// Save as: lib/postImage.js
//
// Single place that decides what image a social post uses, so every
// posting flow (quick-post button, category spotlight, deal auto-post,
// etc.) behaves the same way instead of each reimplementing its own
// fallback chain:
//
//   1. Try a live Amazon screenshot (captureAndUploadProductScreenshot)
//   2. If that fails (bot-check page, timeout, ScreenshotOne error),
//      generate a branded card from the product's own data instead of
//      falling straight back to the plain stored photo
//   3. If even that fails for some reason, use the plain stored photo
//      as the last resort so a post never goes out with no image at all

import "server-only";
import { captureAndUploadProductScreenshot } from "@/lib/screenshotProduct";

// NOTE: the branded-image fallback (lib/generateBrandedImage.js) is
// temporarily disabled — text wasn't rendering on Vercel's serverless
// environment (no fonts installed by default for @napi-rs/canvas), so
// posts were going out with a broken-looking blank band instead of a
// plain product photo. Re-enable once a bundled font is wired in.
export async function getPostImage(product) {
  const screenshotUrl = await captureAndUploadProductScreenshot(product.affiliate_url);
  if (screenshotUrl) return screenshotUrl;

  return product.image_url;
}
