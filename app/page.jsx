// Save as: app/page.jsx (replaces the whole file)

import { Suspense } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import RubTheLamp from "@/components/RubTheLamp";
import Disclosure from "@/components/Disclosure";
import DealAlertForm from "@/components/DealAlertForm";
import TrendingNow from "@/components/TrendingNow";
import RecentlyViewed from "@/components/RecentlyViewed";
import EmptyState from "@/components/EmptyState";
import TrustBar from "@/components/TrustBar";
import CategorySidebar from "@/components/CategorySidebar";
import FilterBar from "@/components/FilterBar";
import SearchBar from "@/components/SearchBar";
import { queryProducts } from "@/lib/queryProducts";
import { getPageBuilderConfig } from "@/lib/pageBuilder";

const PAGE_SIZE = 24;

async function getFeaturedProducts() {
  const { data } = await supabase
    .from("products")
    .select("*, categories(name, slug)")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(8);
  return data || [];
}

async function getCategories() {
  const { data } = await supabase.from("categories").select("*").order("name");
  return data || [];
}

const defaultBlocks = [
  { id: "hero", type: "hero", config: {} },
  { id: "trust", type: "trust_bar", config: {} },
  { id: "featured", type: "featured_products", config: { heading: "Genie's Picks" } },
  { id: "trending", type: "trending_now", config: {} },
  { id: "grid", type: "product_grid", config: { heading: "Freshly Unlocked", withSidebar: true, paginated: true } },
  { id: "recently_viewed", type: "recently_viewed", config: {} },
  { id: "deal_alert", type: "deal_alert_form", config: {} },
  { id: "disclosure", type: "disclosure", config: {} },
];

export default async function HomePage({ searchParams }) {
  const [config, categories] = await Promise.all([
    getPageBuilderConfig(),
    getCategories(),
  ]);

  const blocks = config?.blocks?.length ? config.blocks : defaultBlocks;

  const page = Math.max(1, parseInt(searchParams?.page || "1", 10));
  const sort = searchParams?.sort || "newest";
  const categorySlug = searchParams?.category || null;
  const minPrice = searchParams?.minPrice || null;
  const maxPrice = searchParams?.maxPrice || null;
  const minRating = searchParams?.minRating || null;

  const [featuredProducts, recentProducts, totalRecent] = await Promise.all([
    getFeaturedProducts(),
    queryProducts({
      sort,
      categorySlug,
      minPrice,
      maxPrice,
      minRating,
      page,
      pageSize: PAGE_SIZE,
    }),
    queryProducts({
      sort,
      categorySlug,
      minPrice,
      maxPrice,
      minRating,
      countOnly: true,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalRecent / PAGE_SIZE));

  function renderBlock(block) {
    const { type, config } = block;

    switch (type) {
      case "hero":
        return (
          <section key={block.id} className="relative overflow-hidden border-b border-gold/15">
            <div className="absolute inset-0 opacity-40">
              <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gold/20 blur-3xl" />
              <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-gold/10 blur-3xl" />
            </div>
            <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
              <RubTheLamp />
              <h1 className="font-display text-4xl md:text-5xl leading-tight">
                {config.heading ? (
                  <span className="block gold-gradient-text">{config.heading}</span>
                ) : (
                  <>
                    <span className="block">Unlocking the</span>
                    <span className="block gold-gradient-text">Best Deals,</span>
                    <span className="block">Every Day</span>
                  </>
                )}
              </h1>
              <p className="mt-4 text-cream/70 max-w-xl mx-auto">
                {config.subheading ||
                  "Dirham Genie finds genuine Amazon.ae discounts across the UAE, every single day. Real prices, real picks, real savings."}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/deals/lightning"
                  className="rounded-md bg-gold hover:bg-gold-bright text-ink font-semibold px-6 py-3 transition-colors"
                >
                  ⚡ Lightning Deals
                </Link>
                <Link
                  href="/deals/biggest-discounts"
                  className="rounded-md border border-gold/40 text-gold hover:bg-gold/10 font-semibold px-6 py-3 transition-colors"
                >
                  Biggest Discounts
                </Link>
              </div>
            </div>
          </section>
        );

      case "trust_bar":
        return (
          <section key={block.id} className="border-b border-gold/15">
            <TrustBar />
          </section>
        );

      case "featured_products": {
        if (featuredProducts.length === 0) return null;
        return (
          <section key={block.id} className="max-w-6xl mx-auto px-4 py-10">
            <h2 className="font-display text-2xl text-gold mb-6">{config.heading || "Genie's Picks"}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {featuredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        );
      }

      case "trending_now":
        return (
          <section key={block.id} className="max-w-6xl mx-auto px-4 pb-10">
            <TrendingNow />
          </section>
        );

      case "product_grid": {
        const grid = (
          <section>
            <div className="mb-6 card-surface rounded-lg p-4">
              <p className="text-sm text-gold font-semibold mb-2">Search our site</p>
              <SearchBar placeholder="Search products already on Dirham Genie..." mode="site" />
            </div>
            <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
              <h2 className="font-display text-2xl text-gold">{config.heading || "Freshly Unlocked"}</h2>
              <p className="text-xs text-cream/40">{totalRecent} deals total</p>
            </div>
            <Suspense fallback={null}>
              <FilterBar />
            </Suspense>

            {recentProducts.length === 0 ? (
              <EmptyState
                icon="🧞"
                title="No deals match those filters yet"
                subtitle="Try adjusting your filters, or check back soon — new deals are added daily."
                actionLabel="Clear Filters"
                actionHref="/"
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {recentProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}

            {config.paginated && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                {page > 1 && (
                  <Link
                    href={`/?page=${page - 1}${sort !== "newest" ? `&sort=${sort}` : ""}${categorySlug ? `&category=${categorySlug}` : ""}`}
                    className="rounded-md border border-gold/30 text-cream/80 hover:border-gold hover:text-gold px-4 py-2 text-sm"
                  >
                    ← Prev
                  </Link>
                )}
                <span className="text-sm text-cream/50 px-3">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/?page=${page + 1}${sort !== "newest" ? `&sort=${sort}` : ""}${categorySlug ? `&category=${categorySlug}` : ""}`}
                    className="rounded-md border border-gold/30 text-cream/80 hover:border-gold hover:text-gold px-4 py-2 text-sm"
                  >
                    Next →
                  </Link>
                )}
              </div>
            )}
          </section>
        );

        if (config.withSidebar) {
          return (
            <div key={block.id} className="max-w-6xl mx-auto px-4 py-10">
              <div className="flex flex-col md:flex-row gap-8">
                <CategorySidebar categories={categories} activeSlug={categorySlug} />
                <div className="flex-1 min-w-0">{grid}</div>
              </div>
            </div>
          );
        }
        return (
          <div key={block.id} className="max-w-6xl mx-auto px-4 py-10">
            {grid}
          </div>
        );
      }

      case "recently_viewed":
        return (
          <section key={block.id} className="max-w-6xl mx-auto px-4 pb-10">
            <RecentlyViewed />
          </section>
        );

      case "deal_alert_form":
        return (
          <section key={block.id} className="max-w-6xl mx-auto px-4 pb-10">
            <DealAlertForm />
          </section>
        );

      case "disclosure":
        return (
          <section key={block.id} className="max-w-6xl mx-auto px-4 pb-10">
            <Disclosure />
          </section>
        );

      default:
        return null;
    }
  }

  return <>{blocks.map(renderBlock)}</>;
}