// The public address shared with buyers. Set NEXT_PUBLIC_SITE_URL in Vercel
// if the domain ever changes; otherwise it uses the live custom domain.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dirhamgenie.com";

// Short link if the product has a code, otherwise the normal product page.
export function productShareLink(product) {
  if (product.short_code) return `${SITE_URL}/p/${product.short_code}`;
  return `${SITE_URL}/product/${product.slug}`;
}
