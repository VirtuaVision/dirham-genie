import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { getLocale, t } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";

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
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <img
              src="/logo-dirham-genie.png"
              alt="Dirham Genie"
              className="h-10 w-10 rounded-full object-cover lamp-glow"
            />
            <div className="leading-tight">
              <span className="font-display text-xl tracking-wide gold-gradient-text block">
                Dirham Genie
              </span>
              <span className="hidden sm:block text-[11px] text-cream/40">
                Shop Smarter, Save More.
              </span>
            </div>
          </Link>

          <form action="/search" className="hidden md:flex flex-1 max-w-md items-center">
            <div className="relative flex-1">
              <input
                type="text"
                name="q"
                placeholder={t(locale, "search")}
                className="w-full rounded-md bg-ink-lighter border border-gold/30 pl-9 pr-3 py-2 text-sm text-cream placeholder:text-cream/40 focus:border-gold outline-none"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/40 text-sm">🔍</span>
            </div>
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

          <div className="flex items-center gap-1 shrink-0">
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="w-9 h-9 flex items-center justify-center rounded-full text-cream/70 hover:text-gold hover:bg-white/5 transition-colors"
            >
              ♡
            </Link>
            <Link
              href="/admin/login"
              aria-label="Admin"
              className="w-9 h-9 flex items-center justify-center rounded-full text-cream/70 hover:text-gold hover:bg-white/5 transition-colors"
            >
              👤
            </Link>
            <ThemeToggle />
          </div>
        </div>

        <form action="/search" className="md:hidden pb-3 flex">
          <div className="relative flex-1">
            <input
              type="text"
              name="q"
              placeholder={t(locale, "search")}
              className="w-full rounded-l-md bg-ink-lighter border border-gold/30 pl-9 pr-3 py-2 text-sm text-cream placeholder:text-cream/40 focus:border-gold outline-none"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/40 text-sm">🔍</span>
          </div>
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