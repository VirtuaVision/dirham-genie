import { supabase } from "@/lib/supabaseClient";
import ProductCard from "@/components/ProductCard";

export const metadata = { title: "Lightning Deals | Dirham Genie" };
export const revalidate = 30;

export default async function LightningDealsPage() {
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("is_lightning_deal", true)
    .order("deal_expires_at", { ascending: true });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-gold mb-2">⚡ Lightning Deals</h1>
      <p className="text-cream/60 text-sm mb-8">
        Time-limited offers &mdash; grab them before the countdown ends.
      </p>
      {!data || data.length === 0 ? (
        <p className="text-cream/50 text-sm">No lightning deals live right now. Check back soon!</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {data.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
