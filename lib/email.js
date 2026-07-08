import "server-only";

/**
 * Sends a single email via Resend (https://resend.com — free tier, no card
 * required). If RESEND_API_KEY isn't set yet, this quietly does nothing so
 * the rest of the site keeps working normally.
 */
export async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "Dirham Genie <deals@dirhamgenie.com>";

  if (!apiKey) {
    console.log("[email skipped — RESEND_API_KEY not set]", { to, subject });
    return { skipped: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Email send failed: ${text}`);
  }
  return res.json();
}
