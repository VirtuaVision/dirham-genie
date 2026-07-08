import { supabase } from "@/lib/supabaseClient";
import { formatAed } from "@/lib/formatCurrency";

export default async function PriceHistory({ productId }) {
  const { data } = await supabase
    .from("price_history")
    .select("price, recorded_at")
    .eq("product_id", productId)
    .order("recorded_at", { ascending: true })
    .limit(20);

  if (!data || data.length < 2) return null;

  const prices = data.map((d) => d.price).filter(Boolean);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  return (
    <div className="mt-6">
      <h2 className="text-gold font-semibold mb-2 text-sm uppercase tracking-wide">
        Price History
      </h2>
      <div className="flex items-end gap-1 h-16">
        {data.map((point, i) => {
          const heightPct = ((point.price - min) / range) * 80 + 20;
          return (
            <div
              key={i}
              title={`${formatAed(point.price)} on ${new Date(point.recorded_at).toLocaleDateString()}`}
              className="flex-1 bg-gold/40 hover:bg-gold rounded-sm transition-colors"
              style={{ height: `${heightPct}%` }}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-cream/40 mt-1">
        <span>Lowest: {formatAed(min)}</span>
        <span>Highest: {formatAed(max)}</span>
      </div>
    </div>
  );
}
