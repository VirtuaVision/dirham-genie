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
import { generateBrandedImage } from "@/lib/generateBrandedImage";

export async function getPostImage(product) {
  const screenshotUrl = await captureAndUploadProductScreenshot(product.affiliate_url);
  if (screenshotUrl) return screenshotUrl;

  const brandedUrl = await generateBrandedImage(product);
  if (brandedUrl) return brandedUrl;

  return product.image_url;
}
