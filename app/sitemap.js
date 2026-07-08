import { supabase } from "@/lib/supabaseClient";

export default async function sitemap() {
  const base = "https://dirhamgenie.com";

  const staticPages = [
    "", "about", "disclaimer", "privacy", "terms", "cookie-policy", "dmca",
    "contact", "blog", "coupons", "deals/latest", "deals/lightning",
    "deals/biggest-discounts", "wishlist", "compare",
  ].map((path) => ({
    url: `${base}/${path}`,
    lastModified: new Date(),
  }));

  const [{ data: products }, { data: categories }, { data: posts }] = await Promise.all([
    supabase.from("products").select("slug, updated_at").eq("is_active", true),
    supabase.from("categories").select("slug"),
    supabase.from("posts").select("slug, published_at").eq("is_published", true),
  ]);

  const productPages = (products || []).map((p) => ({
    url: `${base}/product/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
  }));

  const categoryPages = (categories || []).map((c) => ({
    url: `${base}/category/${c.slug}`,
    lastModified: new Date(),
  }));

  const postPages = (posts || []).map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: p.published_at ? new Date(p.published_at) : new Date(),
  }));

  return [...staticPages, ...productPages, ...categoryPages, ...postPages];
}
