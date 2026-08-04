import "server-only";

/**
 * Posts an image + caption to your WhatsApp Channel using Whapi.Cloud
 * (https://whapi.cloud). WhatsApp Channels don't have an official Meta API
 * for posting content (unlike WhatsApp Business messaging), so this uses a
 * third-party service that connects to WhatsApp on your channel's behalf.
 */
export async function postToWhatsAppChannel(imageUrl, caption) {
  const token = process.env.WHAPI_TOKEN;
  const channelId = process.env.WHAPI_CHANNEL_ID;

  if (!token || !channelId) {
    return {
      skipped: true,
      reason: "WhatsApp Channel isn't configured yet (missing WHAPI_TOKEN / WHAPI_CHANNEL_ID).",
    };
  }

  // Whapi's /messages/image endpoint expects multipart/form-data — sending
  // raw JSON returns a 400 "Wrong request parameters" even with a valid
  // payload shape. The "media" field accepts either an uploaded file or,
  // as here, a plain public HTTPS URL string.
  const form = new FormData();
  form.append("to", channelId);
  form.append("media", imageUrl);
  form.append("caption", caption);

  const res = await fetch("https://gate.whapi.cloud/messages/image", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      // No content-type header — fetch sets the multipart boundary itself.
    },
    body: form,
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.message || json?.error?.message || "WhatsApp Channel post failed.");
  }
  return { ok: true, postId: json.message?.id || json.id };
}