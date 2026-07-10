const ITEMS = [
  { icon: "✓", label: "Genuine Amazon.ae Listings" },
  { icon: "🔄", label: "Prices Checked Daily" },
  { icon: "🇦🇪", label: "Built for UAE Shoppers" },
  { icon: "🔒", label: "Secure Checkout via Amazon" },
];

export default function TrustBar() {
  return (
    <div className="border-y border-gold/15 bg-ink-light/40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
        {ITEMS.map((item) => (
          <span key={item.label} className="flex items-center gap-2 text-xs text-cream/60">
            <span className="text-gold">{item.icon}</span>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}