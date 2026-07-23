import { formatAed, discountPercent } from "@/lib/formatCurrency";
import StarRating from "@/components/StarRating";

export default function AmazonLiveResults({ products }) {
  return (
    <section className="mt-10">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="font-display text-xl text-gold">More from Amazon.ae</h2>
        <span className="text-xs text-cream/40">(not yet added to our site)</span>
      </div>
      <p className="text-cream/50 text-xs mb-4">
        Best picks based on rating, review count, and discount &mdash; fetched
        live from Amazon.ae.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map((p) => {
          const discount = discountPercent(p.price, p.list_price);
          return (
            <a
              key={p.asin}
              href={p.affiliate_url}
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
              className="card-surface rounded-lg overflow-hidden flex flex-col hover:border-gold/50 transition-colors"
            >
              <div className="relative aspect-square bg-white/5 flex items-center justify-center">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.title}
                    className="max-h-full max-w-full object-contain p-4"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className="text-cream/30 text-sm">No image</span>
                )}
                {discount && (
                  <span className="absolute top-2 left-2 bg-deal-green text-white text-xs font-bold px-2 py-1 rounded">
                    -{discount}%
                  </span>
                )}
              </div>
              <div className="p-3 flex flex-col gap-1 flex-1">
                <h3 className="text-sm text-cream/90 line-clamp-2 leading-snug min-h-[2.5rem]">
                  {p.title}
                </h3>
                <div className="mt-auto flex items-baseline gap-2">
                  <span className="font-mono text-gold font-semibold">
                    {formatAed(p.price) || "See price"}
                  </span>
                  {discount && (
                    <span className="font-mono text-xs text-cream/40 line-through">
                      {formatAed(p.list_price)}
                    </span>
                  )}
                </div>
                {p.rating && <StarRating rating={p.rating} reviewCount={p.review_count} />}
                <span className="text-xs text-gold mt-1">View on Amazon.ae &rarr;</span>
              </div>
            </a>
          );
        })}
      </div>

      <p className="text-xs text-cream/40 mt-4">
        As an Amazon Associate, Dirham Genie earns from qualifying purchases.
      </p>
    </section>
  );
}
