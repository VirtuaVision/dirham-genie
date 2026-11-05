// The address used in share links. It uses whatever domain you're browsing
// the site on right now (so it always works), and falls back to the
// vercel.app address. When you later connect a custom domain in Vercel and
// open the site on it, new links switch over automatically.
const FALLBACK_SITE_URL = "https://dirham-genie.vercel.app";

export function getSiteUrl() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return FALLBACK_SITE_URL;
}

// Short link if the product has a code, otherwise the normal product page.
export function productShareLink(product) {
  const base = getSiteUrl();
  if (product.short_code) return `${base}/p/${product.short_code}`;
  return `${base}/product/${product.slug}`;
}
