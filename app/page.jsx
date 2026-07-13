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
import Pagination from "@/components/Pagination";
import { getLocale, t } from "@/lib/i18n";

export const revalidate = 60;

const PER_PAGE = 40;

async function getData(page) {
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  const [{ data: featured }, { data: recent, count }, { data: categories }] = await Promise.all([
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
  ]);

  return {
    featured: featured || [],
    recent: recent || [],
    totalRecent: count || 0,
    categories: categories || [],
  };
}

export default async function HomePage({ searchParams }) {
  const page = Math.max(1, parseInt(searchParams?.page) || 1);
  const { featured, recent, totalRecent, categories } = await getData(page);
  const locale = getLocale();
  const totalPages = Math.ceil(totalRecent / PER_PAGE);

  return (
    <div>
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

      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        <CategorySidebar categories={categories} />

        <div className="flex-1 min-w-0">
          {featured.length > 0 && page === 1 && (
            <section className="mb-10">
              <h2 className="font-display text-2xl text-gold mb-4">{t(locale, "geniesPicks")}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {featured.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
              <h2 className="font-display text-2xl text-gold">{t(locale, "freshlyUnlocked")}</h2>
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
                <Pagination currentPage={page} totalPages={totalPages} basePath="/" />
              </>
            )}
          </section>
        </div>
      </div>

      <TrustBar />

      <div className="max-w-6xl mx-auto px-4 py-4">
        <Disclosure compact />
      </div>

      <RecentlyViewed />

      <TrendingNow />

      <section className="max-w-6xl mx-auto px-4 py-6">
        <div className="max-w-md">
          <DealAlertForm />
        </div>
      </section>
    </div>
  );
}