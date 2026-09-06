// Save as: lib/socialCaption.js
//
// Pure string-building logic only — deliberately has NO "server-only"
// import, unlike lib/socialPost.js, so it can be imported directly from a
// client component (the post-preview/edit modal) as well as from server
// code, without duplicating the template in two places.

import { formatAed, discountPercent, truncateTitle } from "@/lib/formatCurrency";

const SITE_URL = "https://dirham-genie.vercel.app";

export function buildSingleProductCaption(product, includeSocialLinks = true) {
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
    `📍 Shop more: ${SITE_URL}/\n\n` +
    socialLinksBlock +
    `#DirhamGenie #UAEDeals #AmazonUAE #DubaiDeals #DealsOfTheDay\n\n` +
    `As an Amazon Associate, Dirham Genie earns from qualifying purchases.`
  );
}
