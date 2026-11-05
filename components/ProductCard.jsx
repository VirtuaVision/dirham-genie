"use client";

import { useState } from "react";
import Link from "next/link";
import { formatAed, discountPercent } from "@/lib/formatCurrency";
import { timeAgo } from "@/lib/timeAgo";
import CountdownTimer from "@/components/CountdownTimer";
import StarRating from "@/components/StarRating";
import { useIsAdmin } from "@/components/AdminStatusProvider";
import SocialPostModal from "@/components/SocialPostModal";
import CouponPopup from "@/components/CouponPopup";
import { productShareLink } from "@/lib/shortLink";

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
  const [showCouponPopup, setShowCouponPopup] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  // Amazon occasionally hands back a dead image reference for a product
  // (especially on cheaper marketplace listings), and separately, forcing
  // a higher resolution than Amazon actually generated for that image can
  // 404 even when the original size works fine. So on a load failure this
  // retries the plain, non-upscaled URL once before giving up to a "No
  // image" placeholder, instead of showing a browser broken-image icon.
  const [triedOriginal, setTriedOriginal] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const displayImage = triedOriginal ? product.image_url : hiResImage;

  function handleImageError() {
    if (!triedOriginal && product.image_url && product.image_url !== hiResImage) {
      setTriedOriginal(true);
    } else {
      setImageFailed(true);
    }
  }

  // Admin-only: copies this product's short share link (dirhamgenie.com/p/xxxx).
  async function handleCopyShortLink() {
    const link = productShareLink(product);
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const el = document.createElement("textarea");
      el.value = link;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  // The lamp opens a popup with this product's own code (if any) plus the
  // site-wide codes managed in Admin -> Coupon Popup, on every product.
  function handleLampClick(e) {
    e.preventDefault();
    e.stopPropagation();
    setShowCouponPopup(true);
  }

  function handleAmazonClick(e) {
    e.stopPropagation();
    fetch("/api/clicks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id }),
      keepalive: true,
    }).catch(() => {});
  }

  function handleOpenPostModal(e) {
    e.preventDefault();
    e.stopPropagation();
    setShowPostModal(true);
  }

  return (
    <>
    <div className="card-surface rounded-lg overflow-hidden flex flex-col group border-2 border-[#C2410C]/40 hover:border-[#C2410C]/70 transition-colors">
    <Link
      href={`/product/${product.slug}`}
      className="flex flex-col flex-1"
    >
      <div className="relative aspect-square bg-white/5">
        {displayImage && !imageFailed ? (
          <img
            key={displayImage}
            src={displayImage}
            alt={product.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            onError={handleImageError}
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
        {product.is_creators_choice && (
          <span
            className={`absolute right-2 bg-violet-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide ${
              product.is_featured ? "top-9" : "top-2"
            }`}
          >
            ✨ Creators Choice
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
          <div className="relative shrink-0">
            <button
              onClick={handleLampClick}
              aria-label="View coupon codes"
              title="Tap to view coupon codes"
              className="bg-gold/20 border border-gold/60 rounded-full p-1.5 transition-all hover:bg-gold/30 hover:scale-110 active:scale-95 cursor-pointer"
            >
              <img
                src="/lamp-icon-gold-1.png"
                alt=""
                className="w-7 h-auto"
                style={{ filter: "brightness(0.5) contrast(1.4)" }}
              />
            </button>
            {product.coupon_code && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-deal-green rounded-full border-2 border-white" />
            )}
          </div>
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
            onClick={handleOpenPostModal}
            className="block w-full text-center rounded-md border border-gold/40 text-gold hover:bg-gold/10 font-semibold text-xs py-2 transition-colors"
          >
            📤 Post to Social Media
          </button>
        )}
        {isAdmin && (
          <button
            onClick={handleCopyShortLink}
            className="block w-full text-center rounded-md border border-gold/40 text-gold hover:bg-gold/10 font-semibold text-xs py-2 transition-colors"
          >
            {linkCopied
              ? "Copied ✓"
              : product.short_code
              ? "🔗 Copy Short Link"
              : "🔗 Copy Product Link"}
          </button>
        )}
      </div>
    </div>
    {showCouponPopup && (
      <CouponPopup
        product={product}
        onClose={() => setShowCouponPopup(false)}
        onBuyClick={handleAmazonClick}
      />
    )}
    {showPostModal && (
      <SocialPostModal product={product} onClose={() => setShowPostModal(false)} />
    )}
    </>
  );
}