import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { getLocale, t } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

async function getCategories() {
  const { data } = await supabase
    .from("categories")
    .select("name, slug")
    .order("name");
  return data || [];
}

export default async function Header() {
  const categories = await getCategories();
  const locale = getLocale();

  return (
    <header className="bg-ink border-b border-gold/20 sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-ink/90">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <img
              src="/logo-dirham-genie.png"
              alt="Dirham Genie"
              className="h-10 w-10 rounded-full object-cover"
            />
            <span className="font-display text-xl tracking-wide gold-gradient-text">
              Dirham Genie
            </span>
          </Link>

          <form action="/search" className="hidden md:flex flex-1 max-w-md mx-6">
            <input
              type="text"
              name="q"
              placeholder={t(locale, "search")}
              className="w-full rounded-l-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream placeholder:text-cream/40 focus:border-gold outline-none"
            />
            <button
              type="submit"
              className="rounded-r-md bg-gold px-4 text-sm font-semibold text-ink hover:bg-gold-bright transition-colors"
            >
              Search
            </button>
          </form>

          <nav className="hidden lg:flex items-center gap-5 text-sm">
            <Link href="/deals/latest" className="text-cream/80 hover:text-gold transition-colors">{t(locale, "latest")}</Link>
            <Link href="/deals/lightning" className="text-cream/80 hover:text-gold transition-colors">⚡ {t(locale, "lightning")}</Link>
            <Link href="/deals/biggest-discounts" className="text-cream/80 hover:text-gold transition-colors">{t(locale, "topDiscounts")}</Link>
            <Link href="/coupons" className="text-cream/80 hover:text-gold transition-colors">{t(locale, "coupons")}</Link>
            {categories.slice(0, 3).map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="text-cream/80 hover:text-gold transition-colors"
              >
                {c.name}
              </Link>
            ))}
            <LanguageSwitcher locale={locale} />
          </nav>
        </div>

        <form action="/search" className="md:hidden pb-3 flex">
          <input
            type="text"
            name="q"
            placeholder={t(locale, "search")}
            className="w-full rounded-l-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream placeholder:text-cream/40 focus:border-gold outline-none"
          />
          <button
            type="submit"
            className="rounded-r-md bg-gold px-4 text-sm font-semibold text-ink"
          >
            Go
          </button>
        </form>
      </div>
    </header>
  );
}
