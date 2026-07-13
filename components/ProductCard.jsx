import Link from "next/link";
import Image from "next/image";
import { formatAed, discountPercent } from "@/lib/formatCurrency";
import CountdownTimer from "@/components/CountdownTimer";
import StarRating from "@/components/StarRating";

export default function ProductCard({ product }) {
  const discount = discountPercent(product.price, product.list_price);

  return (
    <Link
      href={`/product/${product.slug}`}
      className="card-surface rounded-lg overflow-hidden flex flex-col group hover:border-gold/50 transition-colors"
    >
      <div className="relative aspect-square bg-white/5">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, 240px"
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-cream/30 text-sm">
            No image
          </div>
        )}
        {discount && (
          <span className="absolute top-2 left-2 bg-deal-green text-white text-xs font-bold px-2 py-1 rounded">
            -{discount}%
          </span>
        )}
        {product.is_featured && (
          <span className="absolute top-2 right-2 bg-gold text-ink text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">
            Best Seller
          </span>
        )}
        {product.in_stock === false && (
          <div className="absolute inset-0 bg-ink/70 flex items-center justify-center">
            <span className="bg-ink text-cream text-xs font-semibold px-3 py-1.5 rounded border border-gold/30">
              Out of Stock
            </span>
          </div>
        )}
        {product.is_lightning_deal && product.deal_expires_at && (
          <span className="absolute bottom-2 left-2">
            <CountdownTimer expiresAt={product.deal_expires_at} />
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col gap-1 flex-1">
        {product.brand && (
          <span className="text-[10px] uppercase tracking-wider text-gold/70 font-semibold">
            {product.brand}
          </span>
        )}
        <h3 className="text-sm text-cream/90 line-clamp-2 leading-snug min-h-[2.5rem]">
          {product.title}
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-gold font-semibold">
              {formatAed(product.price) || "See price"}
            </span>
            {discount && (
              <span className="font-mono text-xs text-cream/40 line-through">
                {formatAed(product.list_price)}
              </span>
            )}
          </div>
          <img
            src="/lamp-icon-gold-1.png"
            alt=""
            className="w-9 h-auto shrink-0 opacity-100"
          />
        </div>
        {discount && (
          <span className="text-[11px] text-deal-green font-medium">
            Save {formatAed(product.list_price - product.price)} ({discount}%)
          </span>
        )}
        {product.rating && (
          <StarRating rating={product.rating} reviewCount={product.review_count} />
        )}
      </div>
    </Link>
  );
}