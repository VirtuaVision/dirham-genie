import "server-only";

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";

/**
 * Drafts a short, friendly coupon description/terms line from whatever
 * details are already known (title, code, product link). Used by the
 * "✨ Auto-write" button on the Coupons admin page — always editable
 * afterward, this is just a starting draft, not a final say.
 */
export async function generateCouponDescription({ title, code, affiliate_url }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY isn't configured yet — add it in Vercel's Environment Variables.");
  }
  if (!title) {
    throw new Error("Add a coupon title first, then generate a description.");
  }

  const prompt =
    `Write one short, friendly line (max 20 words) describing this Amazon.ae coupon deal for a UAE shopping site. ` +
    `No hashtags, no emojis, no quotation marks — just plain descriptive text a shopper would read under the coupon title.\n\n` +
    `Coupon title: ${title}\n` +
    (code ? `Coupon code: ${code}\n` : "") +
    (affiliate_url ? `Product link: ${affiliate_url}\n` : "");

  const response = await fetch(OPENAI_CHAT_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 60,
      temperature: 0.7,
    }),
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.error?.message || "OpenAI request failed.");
  }

  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("OpenAI didn't return any text.");
  return text.replace(/^"|"$/g, ""); // strip stray wrapping quotes if any
}
