// Save as: app/page.jsx (replaces the whole file)

import { supabase } from "@/lib/supabaseClient";
import ProductCard from "@/components/ProductCard";
import RubTheLamp from "@/components/RubTheLamp";
import Disclosure from "@/components/Disclosure";
import DealAlertForm from "@/components/DealAlertForm";
import TrendingNow from "@/components/TrendingNow";
import RecentlyViewed from "@/components/RecentlyViewed";
import EmptyState from "@/components/EmptyState";
import TrustBar from "@/components/TrustBar";
import CategorySidebar from "@/components/CategorySidebar";
import BannerStrip from "@/components/BannerStrip";
import Pagination from "@/components/Pagination";
import { getLocale, t } from "@/lib/i18n";

export const revalidate = 60;

const PER_PAGE = 40;

async function getData(page) {
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  const [{ data: featured }, { data: recent, count }, { data: categories }, { data: banners }, { data: blocks }] =
    await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("products")
        .select("*", { count: "exact" })
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .range(from, to),
      supabase.from("categories").select("name, slug").order("name"),
      supabase.from("banners").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("homepage_blocks").select("*").eq("is_visible", true).order("sort_order"),
    ]);

  return {
    featured: featured || [],
    recent: recent || [],
    totalRecent: count || 0,
    categories: categories || [],
    banners: banners || [],
    // Fallback layout if the Page Builder table is empty/not set up yet —
    // matches the site's original fixed layout so nothing breaks.
    blocks: blocks?.length
      ? blocks
      : [
          { id: "hero", type: "hero", config: {} },
          { id: "featured", type: "featured_products", config: { heading: "Genie's Picks", limit: 8 } },
          { id: "grid", type: "product_grid", config: { heading: "Freshly Unlocked", withSidebar: true, paginated: true } },
          { id: "trust", type: "trust_bar", config: {} },
          { id: "recent", type: "recently_viewed", config: {} },
          { id: "trending", type: "trending", config: {} },
          { id: "newsletter", type: "newsletter", config: {} },
        ],
  };
}

export default async function HomePage({ searchParams }) {
  const page = Math.max(1, parseInt(searchParams?.page) || 1);
  const { featured, recent, totalRecent, categories, banners, blocks } = await getData(page);
  const locale = getLocale();
  const totalPages = Math.ceil(totalRecent / PER_PAGE);

  const context = { featured, recent, totalRecent, categories, banners, page, totalPages, locale };

  return (
    <div>
      {blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} context={context} />
      ))}

      <div className="max-w-6xl mx-auto px-4 py-4">
        <Disclosure compact />
      </div>
    </div>
  );
}

function BlockRenderer({ block, context }) {
  const { featured, recent, totalRecent, categories, banners, page, totalPages, locale } = context;
  const config = block.config || {};

  switch (block.type) {
    case "hero":
      return (
        <section className="relative overflow-hidden border-b border-gold/15">
          <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <p className="uppercase tracking-[0.2em] text-xs text-gold/80 mb-3">
                UAE&apos;s deal-hunting genie
              </p>
              <h1 className="font-display text-4xl md:text-5xl leading-tight gold-gradient-text">
                {t(locale, "heroTitle")}
              </h1>
              <p className="text-cream/70 mt-4">{t(locale, "heroSubtitle")}</p>
            </div>
            <RubTheLamp label={t(locale, "rubTheLamp")} />
          </div>
        </section>
      );

    case "featured_products":
      if (featured.length === 0 || page !== 1) return null;
      return (
        <div className="max-w-6xl mx-auto px-4 pt-8">
          <section className="mb-10">
            <h2 className="font-display text-2xl text-gold mb-4">
              {config.heading || "Genie's Picks"}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {featured.slice(0, config.limit || 8).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        </div>
      );

    case "product_grid": {
      const grid = (
        <section>
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            <h2 className="font-display text-2xl text-gold">{config.heading || "Freshly Unlocked"}</h2>
            <p className="text-xs text-cream/40">{totalRecent} deals total</p>
          </div>
          {recent.length === 0 ? (
            <EmptyState
              icon="🪔"
              title="No products yet"
              subtitle="Once you add products in the admin panel, they'll appear here."
            />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {recent.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {config.paginated !== false && (
                <Pagination currentPage={page} totalPages={totalPages} basePath="/" />
              )}
            </>
          )}
        </section>
      );

      return (
        <div className="max-w-6xl mx-auto px-4 py-8">
          {config.withSidebar !== false ? (
            <div className="flex flex-col md:flex-row gap-8">
              <CategorySidebar categories={categories} />
              <div className="flex-1 min-w-0">{grid}</div>
            </div>
          ) : (
            grid
          )}
        </div>
      );
    }

    case "banners":
      return <BannerStrip banners={banners.slice(0, config.limit || 3)} />;

    case "trust_bar":
      return <TrustBar />;

    case "recently_viewed":
      return <RecentlyViewed />;

    case "trending":
      return <TrendingNow />;

    case "newsletter":
      return (
        <section className="max-w-6xl mx-auto px-4 py-6">
          <div className="max-w-md">
            {config.heading && (
              <h2 className="font-display text-xl text-gold mb-3">{config.heading}</h2>
            )}
            <DealAlertForm />
          </div>
        </section>
      );

    case "text_block":
      if (!config.heading && !config.body) return null;
      return (
        <section className="max-w-6xl mx-auto px-4 py-6">
          {config.heading && (
            <h2 className="font-display text-xl text-gold mb-2">{config.heading}</h2>
          )}
          {config.body && <p className="text-cream/70 text-sm whitespace-pre-line">{config.body}</p>}
        </section>
      );

    default:
      return null;
  }
}
