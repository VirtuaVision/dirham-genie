export default function Disclosure({ compact = false }) {
  return (
    <div
      className={`rounded-md border border-gold/25 bg-ink-light/60 text-cream/70 ${
        compact ? "text-xs px-3 py-2" : "text-sm px-4 py-3"
      }`}
    >
      <strong className="text-gold">Affiliate Disclosure:</strong> As an Amazon
      Associate, Dirham Genie earns from qualifying purchases made through
      links on this page, at no extra cost to you. Prices shown are subject to
      change on Amazon.ae.
    </div>
  );
}
