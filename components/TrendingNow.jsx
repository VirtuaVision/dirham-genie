import { supabase } from "@/lib/supabaseClient";
import ProductCard from "@/components/ProductCard";

export default async function TrendingNow() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: clicks } = await supabase
    .from("clicks")
    .select("product_id")
    .gte("created_at", sevenDaysAgo);

  if (!clicks || clicks.length === 0) return null;

  const counts = {};
  for (const c of clicks) {
    if (!c.product_id) continue;
    counts[c.product_id] = (counts[c.product_id] || 0) + 1;
  }

  const topIds = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id]) => id);

  if (topIds.length === 0) return null;

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .in("id", topIds)
    .eq("is_active", true);

  if (!products || products.length === 0) return null;

  // Keep them ordered by popularity, not by whatever order Supabase returned them in
  const ordered = topIds.map((id) => products.find((p) => p.id === id)).filter(Boolean);

  return (
    <section className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="font-display text-2xl text-gold mb-4">🔥 Trending Now</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {ordered.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
