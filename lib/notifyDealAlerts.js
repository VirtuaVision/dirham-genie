import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendEmail } from "@/lib/email";
import { formatAed } from "@/lib/formatCurrency";

/**
 * Fire-and-forget: emails everyone subscribed to this product's category
 * (plus anyone subscribed to "all categories") that a new deal just went
 * live. Safe to call even if RESEND_API_KEY isn't set — sendEmail() will
 * just skip in that case.
 */
export async function notifyDealAlertSubscribers(product) {
  try {
    const filter = product.category_id
      ? `category_id.eq.${product.category_id},category_id.is.null`
      : `category_id.is.null`;

    const { data: subscribers } = await supabaseAdmin
      .from("deal_alerts")
      .select("email")
      .or(filter);

    if (!subscribers || subscribers.length === 0) return;

    const price = formatAed(product.price) || "See price on site";
    const url = `https://dirhamgenie.com/product/${product.slug}`;

    for (const sub of subscribers) {
      await sendEmail({
        to: sub.email,
        subject: `New deal: ${product.title}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
            <h2 style="color:#8A6D1F;">🪔 Dirham Genie</h2>
            <p>A new deal just unlocked:</p>
            <h3>${product.title}</h3>
            ${product.image_url ? `<img src="${product.image_url}" style="max-width:200px;" />` : ""}
            <p style="font-size:20px;color:#8A6D1F;font-weight:bold;">${price}</p>
            <p><a href="${url}" style="background:#D4AF37;color:#0B0B10;padding:10px 20px;border-radius:6px;text-decoration:none;">View Deal</a></p>
            <p style="font-size:12px;color:#888;">As an Amazon Associate, Dirham Genie earns from qualifying purchases.</p>
          </div>
        `,
      });
    }
  } catch (err) {
    console.error("Deal alert notification failed:", err.message);
  }
}
