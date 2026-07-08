import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import ProductCard from "@/components/ProductCard";
import RubTheLamp from "@/components/RubTheLamp";
import Disclosure from "@/components/Disclosure";
import DealAlertForm from "@/components/DealAlertForm";
import TrendingNow from "@/components/TrendingNow";
import RecentlyViewed from "@/components/RecentlyViewed";
import EmptyState from "@/components/EmptyState";
import { getLocale, t } from "@/lib/i18n";

export const revalidate = 60;

async function getData() {
  const [{ data: featured }, { data: recent }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase.from("categories").select("name, slug").order("name"),
  ]);
  return { featured: featured || [], recent: recent || [], categories: categories || [] };
}

export default async function HomePage() {
  const { featured, recent, categories } = await getData();
  const locale = getLocale();

  return (
    <div>
      {/* Hero */}
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

      <div className="max-w-6xl mx-auto px-4 py-4">
        <Disclosure compact />
      </div>

      <RecentlyViewed />

      <TrendingNow />

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="text-xs px-3 py-1.5 rounded-full border border-gold/30 text-cream/80 hover:border-gold hover:text-gold transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-6">
          <h2 className="font-display text-2xl text-gold mb-4">{t(locale, "geniesPicks")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Recent */}
      <section className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <h2 className="font-display text-2xl text-gold">{t(locale, "freshlyUnlocked")}</h2>
          <div className="max-w-xs w-full">
            <DealAlertForm />
          </div>
        </div>
        {recent.length === 0 ? (
          <EmptyState
            icon="🪔"
            title="No products yet"
            subtitle="Once you add products in the admin panel, they'll appear here."
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {recent.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
