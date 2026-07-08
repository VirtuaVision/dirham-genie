import { supabase } from "@/lib/supabaseClient";
import ProductCard from "@/components/ProductCard";
import { discountPercent } from "@/lib/formatCurrency";

export const metadata = { title: "Biggest Discounts | Dirham Genie" };
export const revalidate = 60;

export default async function BiggestDiscountsPage() {
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .not("list_price", "is", null)
    .not("price", "is", null);

  const sorted = (data || [])
    .map((p) => ({ ...p, _discount: discountPercent(p.price, p.list_price) || 0 }))
    .filter((p) => p._discount > 0)
    .sort((a, b) => b._discount - a._discount)
    .slice(0, 48);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-gold mb-2">Biggest Discounts</h1>
      <p className="text-cream/60 text-sm mb-8">The steepest price cuts right now, ranked highest first.</p>
      {sorted.length === 0 ? (
        <p className="text-cream/50 text-sm">No discounted products yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {sorted.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
