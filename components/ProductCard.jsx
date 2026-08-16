"use client";

import Link from "next/link";
import Image from "next/image";
import { formatAed, discountPercent } from "@/lib/formatCurrency";
import { timeAgo } from "@/lib/timeAgo";
import CountdownTimer from "@/components/CountdownTimer";
import StarRating from "@/components/StarRating";
import { useIsAdmin } from "@/components/AdminStatusProvider";

// Amazon image URLs carry their resolution in the filename itself
// (e.g. "._SL500_.jpg"). Bumping that number gets a noticeably sharper
// photo from Amazon's own CDN without any extra processing on our side.
function upscaleAmazonImage(url) {
  if (!url) return url;
  return url.replace(/_S[LXY]\d+_/, "_SL1000_");
}

export default function ProductCard({ product }) {
  const discount = discountPercent(product.price, product.list_price);
  const checked = timeAgo(product.last_synced_at || product.updated_at);
  const hiResImage = upscaleAmazonImage(product.image_url);
  const isAdmin = useIsAdmin();

  function handleAmazonClick(e) {
    e.stopPropagation();
    fetch("/api/clicks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id }),
      keepalive: true,
    }).catch(() => {});
  }

  async function handleShare(e) {
    e.preventDefault();
    e.stopPropagation();
    const shareData = {
      title: product.title,
      text: `${product.title} — ${formatAed(product.price) || "See price"} on Dirham Genie`,
      url: `https://dirham-genie.vercel.app/product/${product.slug}`,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled the share sheet; nothing to do
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
      alert("Link copied — your browser doesn't support the native share sheet.");
    }
  }

  return (
    <div className="card-surface rounded-lg overflow-hidden flex flex-col group border-2 border-[#C2410C]/40 hover:border-[#C2410C]/70 transition-colors">
    <Link
      href={`/product/${product.slug}`}
      className="flex flex-col flex-1"
    >
      <div className="relative aspect-square bg-white/5">
        {hiResImage ? (
          <Image
            src={hiResImage}
            alt={product.title}
            fill
            quality={90}
            sizes="(max-width: 768px) 50vw, 240px"
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-cream/30 text-sm">
            No image
          </div>
        )}
        {discount && (
          <span className="absolute top-2 left-2 bg-[#C0392B] text-white text-base font-extrabold px-3 py-1.5 rounded-md shadow-sm">
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
            style={{ filter: "brightness(0.55) saturate(1.4) contrast(1.2)" }}
          />
        </div>
        {discount && (
          <span className="text-sm font-bold text-white bg-deal-green inline-block px-2 py-0.5 rounded w-fit">
            Save {formatAed(product.list_price - product.price)} ({discount}%)
          </span>
        )}
        {product.rating && (
          <StarRating rating={product.rating} reviewCount={product.review_count} />
        )}
        {checked && (
          <span className="text-[10px] text-cream/35">Price checked {checked}</span>
        )}
      </div>
    </Link>

      <div className="px-3 pb-3 flex flex-col gap-2">
        {product.affiliate_url && (
          <a
            href={product.affiliate_url}
            target="_blank"
            rel="nofollow sponsored noopener noreferrer"
            onClick={handleAmazonClick}
            className="block text-center rounded-md bg-gold hover:bg-gold-bright text-ink font-semibold text-xs py-2 transition-colors"
          >
            Buy on Amazon &rarr;
          </a>
        )}
        <Link
          href={`/product/${product.slug}`}
          className="block text-center rounded-md border border-[#C2410C]/50 text-[#C2410C] hover:bg-[#C2410C]/10 font-semibold text-xs py-2 transition-colors"
        >
          See Product Details
        </Link>
        {isAdmin && (
          <button
            onClick={handleShare}
            className="block w-full text-center rounded-md border border-gold/40 text-gold hover:bg-gold/10 font-semibold text-xs py-2 transition-colors"
          >
            📤 Share to Social
          </button>
        )}
      </div>
    </div>
  );
}