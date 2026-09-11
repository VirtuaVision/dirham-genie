export default function Disclosure({ compact = false }) {
  return (
    <div
      className={`rounded-md border border-gold/25 bg-ink-light/60 text-cream/70 ${
        compact ? "text-xs px-3 py-2" : "text-sm px-4 py-3"
      }`}
    >
      <p>
        <strong className="text-gold">Affiliate Disclosure:</strong> As an
        Amazon Associate, Dirham Genie earns from qualifying purchases made
        through links on this page, at no extra cost to you. Prices shown
        are subject to change on Amazon.ae.
      </p>
      {!compact && (
        <p className="mt-1.5 text-cream/50">
          Certain content on this page (images, titles, pricing) comes from
          Amazon and is provided &quot;as is.&quot;
        </p>
      )}
      <a
        href="/disclaimer"
        className="mt-1.5 inline-block text-gold/90 underline underline-offset-2 hover:text-gold"
      >
        Read all affiliate and content disclosures →
      </a>
    </div>
  );
}
