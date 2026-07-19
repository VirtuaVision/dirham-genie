// Save as: components/TestimonialBanner.jsx

export default function TestimonialBanner({ config = {} }) {
  if (!config.quote) return null;
  const rating = Math.min(5, Math.max(1, Number(config.rating) || 5));

  return (
    <section className="max-w-6xl mx-auto px-4 py-6">
      <div className="rounded-xl border border-gold/20 bg-ink-lighter p-6 md:p-8 flex items-center gap-5">
        {config.avatar && (
          <img src={config.avatar} alt="" className="w-14 h-14 rounded-full object-cover shrink-0" />
        )}
        <div>
          <p className="text-gold mb-1">{"★".repeat(rating)}{"☆".repeat(5 - rating)}</p>
          <p className="text-cream/90 text-base md:text-lg italic mb-2">&ldquo;{config.quote}&rdquo;</p>
          {config.customerName && <p className="text-cream/50 text-sm">— {config.customerName}</p>}
        </div>
      </div>
    </section>
  );
}