// Save as: lib/socialCaption.js
//
// Pure string-building logic only — deliberately has NO "server-only"
// import, unlike lib/socialPost.js, so it can be imported directly from a
// client component (the post-preview/edit modal) as well as from server
// code, without duplicating the template in two places.

import { formatAed, discountPercent, truncateTitle } from "@/lib/formatCurrency";

const SITE_URL = "https://dirham-genie.vercel.app";

// "🎟️ Coupon code: SAVE20" / "🎟️ Coupon codes: SAVE20, EXTRA10" — empty if none.
export function buildCouponLine(codes) {
  const list = (codes || []).map((c) => String(c).trim()).filter(Boolean);
  if (list.length === 0) return "";
  return list.length === 1
    ? `🎟️ Coupon code: ${list[0]}`
    : `🎟️ Coupon codes: ${list.join(", ")}`;
}

// Swaps the coupon line inside an already-written (and possibly hand-edited)
// caption, leaving everything else you typed alone. Pass "" to remove it.
export function applyCouponLine(caption, newLine) {
  let text = caption.replace(/^🎟️ Coupon codes?:.*\n\n?/m, "").replace(/^🎟️ Coupon codes?:.*$/m, "");
  if (!newLine) return text;
  const anchor = text.indexOf("📍");
  if (anchor !== -1) return text.slice(0, anchor) + newLine + "\n\n" + text.slice(anchor);
  const tags = text.indexOf("#DirhamGenie");
  if (tags !== -1) return text.slice(0, tags) + newLine + "\n\n" + text.slice(tags);
  return text.trimEnd() + "\n\n" + newLine;
}

export function buildSingleProductCaption(product, includeSocialLinks = true, couponCodes = []) {
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
    (buildCouponLine(couponCodes) ? `${buildCouponLine(couponCodes)}\n\n` : "") +
    `📍 Shop more: ${SITE_URL}/\n\n` +
    socialLinksBlock +
    `#DirhamGenie #UAEDeals #AmazonUAE #DubaiDeals #DealsOfTheDay\n\n` +
    `As an Amazon Associate, Dirham Genie earns from qualifying purchases.`
  );
}
