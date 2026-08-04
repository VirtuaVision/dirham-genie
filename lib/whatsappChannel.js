import "server-only";

/**
 * Posts an image + caption to your WhatsApp Channel using Whapi.Cloud
 * (https://whapi.cloud). WhatsApp Channels don't have an official Meta API
 * for posting content (unlike WhatsApp Business messaging), so this uses a
 * third-party service that connects to WhatsApp on your channel's behalf.
 *
 * Setup (one-time):
 *   1. Sign up at https://whapi.cloud (free tier covers low-volume personal use)
 *   2. Create a channel/instance and scan the QR code with the WhatsApp
 *      account that owns your Dirham Genie channel, to link it
 *   3. Copy your API token from the Whapi dashboard -> WHAPI_TOKEN
 *   4. Find your Channel ID (format: 1203xxxxxxxxxx@newsletter) from the
 *      dashboard's Channels section -> WHAPI_CHANNEL_ID
 *   5. Add both as env vars in Vercel and redeploy
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

  const res = await fetch("https://gate.whapi.cloud/messages/image", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: channelId,
      media: imageUrl,
      caption,
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.message || json?.error?.message || "WhatsApp Channel post failed.");
  }
  return { ok: true, postId: json.message?.id || json.id };
}