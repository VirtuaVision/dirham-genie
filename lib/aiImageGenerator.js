import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const OPENAI_IMAGE_EDIT_URL = "https://api.openai.com/v1/images/edits";

// Which model does the actual background replacement. Override with
// OPENAI_IMAGE_MODEL in Vercel if you want to pin a different version.
const MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5";

// Only ever fetch source product photos from hosts we trust — same allow-list
// used by /api/proxy-image, plus our own Supabase storage.
const ALLOWED_HOSTS = [
  "m.media-amazon.com",
  "images-eu.ssl-images-amazon.com",
  "images-na.ssl-images-amazon.com",
];

function isHostAllowed(hostname) {
  return ALLOWED_HOSTS.includes(hostname) || hostname.endsWith(".supabase.co");
}

/** The default "premium lifestyle" prompt, same one you gave us — kept as the
 *  fallback used whenever an admin doesn't type a custom prompt. */
export const DEFAULT_PROMPT_TEMPLATE =
  "Create a premium Amazon promotional image. Keep the product exactly the same " +
  "as the original. Replace the white background with a modern luxury UAE " +
  "shopping environment. Add soft lighting, realistic shadows, and a clean, " +
  "high-end advertisement style. Do not alter the product's shape, color, " +
  "branding, or packaging.";

/** Downloads a product photo from an allow-listed host and returns its raw bytes. */
async function fetchSourceImage(imageUrl) {
  let parsed;
  try {
    parsed = new URL(imageUrl);
  } catch {
    throw new Error("That image URL isn't valid.");
  }
  if (parsed.protocol !== "https:") {
    throw new Error("Image URL must use https.");
  }
  if (!isHostAllowed(parsed.hostname)) {
    throw new Error(`Image host not allowed: ${parsed.hostname}`);
  }

  const upstream = await fetch(parsed.toString());
  if (!upstream.ok) {
    throw new Error("Couldn't download the source product image.");
  }
  const contentType = upstream.headers.get("content-type") || "image/jpeg";
  if (!contentType.startsWith("image/")) {
    throw new Error("That URL didn't return an image.");
  }
  const arrayBuffer = await upstream.arrayBuffer();
  if (arrayBuffer.byteLength > 15 * 1024 * 1024) {
    throw new Error("Source image is too large (max 15MB).");
  }
  return { buffer: Buffer.from(arrayBuffer), contentType };
}

/**
 * Sends a product photo + prompt to OpenAI's image edit endpoint and gets
 * back a premium, background-replaced version. Returns a data: URL so the
 * caller can preview it immediately and/or upload it to storage.
 */
export async function generatePremiumProductImage({ imageUrl, prompt, size = "1024x1024" }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY isn't configured yet — add it in Vercel's Environment Variables.");
  }
  if (!imageUrl) {
    throw new Error("A product image is required.");
  }

  const { buffer, contentType } = await fetchSourceImage(imageUrl);
  const ext = contentType.includes("png") ? "png" : "jpg";

  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", (prompt || DEFAULT_PROMPT_TEMPLATE).slice(0, 4000));
  form.append("size", size);
  form.append("n", "1");
  form.append("image", new Blob([buffer], { type: contentType }), `product.${ext}`);

  const res = await fetch(OPENAI_IMAGE_EDIT_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.error?.message || "OpenAI image generation failed.");
  }

  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI didn't return an image.");
  return `data:image/png;base64,${b64}`;
}

/** Uploads a generated (base64 PNG) image to a public Supabase Storage bucket. */
export async function uploadAIImage(dataUrl, filenamePrefix = "ai-product") {
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  const buffer = Buffer.from(base64, "base64");
  const filename = `${filenamePrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;

  const { error } = await supabaseAdmin.storage
    .from("ai-product-images")
    .upload(filename, buffer, { contentType: "image/png", upsert: false });

  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data } = supabaseAdmin.storage.from("ai-product-images").getPublicUrl(filename);
  return data.publicUrl;
}

/**
 * Fire-and-forget: automatically generates the premium AI lifestyle image for
 * a newly added product and saves it to products.ai_image_url. Off by
 * default (this costs a small amount per image) — set
 * AI_IMAGE_AUTO_GENERATE=true in Vercel to turn it on. Badge/logo overlay and
 * per-platform resizing still happen in the AI Image Studio admin tab, since
 * that compositing runs in the browser (same approach as the Social Post
 * Generator) rather than on the server.
 */
export async function autoGenerateAIImageForNewProduct(product) {
  if (process.env.AI_IMAGE_AUTO_GENERATE !== "true") return;
  if (!product?.image_url) return;

  try {
    const dataUrl = await generatePremiumProductImage({
      imageUrl: product.image_url,
      prompt: DEFAULT_PROMPT_TEMPLATE,
    });
    const publicUrl = await uploadAIImage(dataUrl, `ai-${product.slug || product.id}`);
    await supabaseAdmin
      .from("products")
      .update({ ai_image_url: publicUrl })
      .eq("id", product.id);
  } catch (err) {
    console.error(`Auto AI image generation failed for product ${product.id}:`, err.message);
  }
}