import Image from "next/image";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Disclosure from "@/components/Disclosure";
import { formatAed, discountPercent } from "@/lib/formatCurrency";
import ProductCard from "@/components/ProductCard";
import BuyButton from "@/components/BuyButton";
import WishlistButton from "@/components/WishlistButton";
import CompareButton from "@/components/CompareButton";
import ShareButtons from "@/components/ShareButtons";
import PriceHistory from "@/components/PriceHistory";
import CountdownTimer from "@/components/CountdownTimer";
import RecordView from "@/components/RecordView";
import StarRating from "@/components/StarRating";

export const revalidate = 60;

async function getProduct(slug) {
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return data;
}

async function getRelated(categoryId, excludeId) {
  if (!categoryId) return [];
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .neq("id", excludeId)
    .limit(4);
  return data || [];
}

export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug);
  if (!product) return { title: "Product not found | Dirham Genie" };

  const description = product.description?.slice(0, 150) || `${product.title} — see today's price on Dirham Genie.`;

  return {
    title: `${product.title} | Dirham Genie`,
    description,
    openGraph: {
      title: product.title,
      description,
      images: product.image_url ? [{ url: product.image_url, width: 800, height: 800 }] : undefined,
      type: "website",
      siteName: "Dirham Genie",
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description,
      images: product.image_url ? [product.image_url] : undefined,
    },
  };
}

export default async function ProductPage({ params }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const related = await getRelated(product.category_id, product.id);
  const discount = discountPercent(product.price, product.list_price);
  const pageUrl = `https://dirhamgenie.com/product/${product.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.image_url ? [product.image_url] : undefined,
    description: product.description || undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency || "AED",
      price: product.price || undefined,
      url: pageUrl,
      availability: "https://schema.org/InStock",
    },
    aggregateRating: product.rating
      ? {
          "@type": "AggregateRating",
          ratingValue: product.rating,
          reviewCount: product.review_count || 1,
        }
      : undefined,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RecordView product={product} />

      <div className="grid md:grid-cols-2 gap-8">
        <div className="relative aspect-square card-surface rounded-lg">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 100vw, 480px"
              className="object-contain p-8"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-cream/30">
              No image available
            </div>
          )}
          {discount && (
            <span className="absolute top-3 left-3 bg-deal-green text-white text-sm font-bold px-3 py-1 rounded">
              Save {discount}%
            </span>
          )}
          {product.is_lightning_deal && product.deal_expires_at && (
            <span className="absolute bottom-3 left-3">
              <CountdownTimer expiresAt={product.deal_expires_at} />
            </span>
          )}
        </div>

        <div>
          {product.brand && (
            <p className="text-xs text-cream/40 uppercase tracking-wide mb-1">{product.brand}</p>
          )}
          <h1 className="font-display text-2xl md:text-3xl text-cream leading-snug">
            {product.title}
          </h1>

          {product.rating && (
            <div className="mt-2">
              <StarRating rating={product.rating} reviewCount={product.review_count} size="text-base" />
              <span className="text-cream/40 text-xs ml-1">on Amazon.ae</span>
            </div>
          )}

          <div className="flex items-baseline gap-3 mt-4">
            <span className="font-mono text-3xl text-gold font-bold">
              {formatAed(product.price) || "Check price on Amazon"}
            </span>
            {discount && (
              <span className="font-mono text-cream/40 line-through">
                {formatAed(product.list_price)}
              </span>
            )}
          </div>

          {product.coupon_code && (
            <p className="mt-2 text-sm">
              <span className="font-mono bg-gold/15 text-gold px-2 py-1 rounded border border-dashed border-gold/40">
                {product.coupon_code}
              </span>
              {product.coupon_details && (
                <span className="text-cream/50 text-xs ml-2">{product.coupon_details}</span>
              )}
            </p>
          )}

          <p className="text-xs text-cream/40 mt-1">
            Price last checked at time of listing. Actual price on Amazon.ae may vary.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <BuyButton productId={product.id} affiliateUrl={product.affiliate_url} />
            <WishlistButton product={product} />
            <CompareButton product={product} />
          </div>

          <div className="mt-4">
            <ShareButtons title={product.title} url={pageUrl} />
          </div>

          {product.description && (
            <div className="mt-8">
              <h2 className="text-gold font-semibold mb-2 text-sm uppercase tracking-wide">
                Highlights
              </h2>
              <p className="text-cream/70 text-sm leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          <PriceHistory productId={product.id} />

          <div className="mt-8">
            <Disclosure />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-xl text-gold mb-4">You might also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
