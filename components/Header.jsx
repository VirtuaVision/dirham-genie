import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { getLocale, t } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import SearchBar from "@/components/SearchBar";
import WishlistCount from "@/components/WishlistCount";
import { getSiteSetting } from "@/lib/siteSettings";
import { getSocialLinks, SocialIconRow } from "@/components/SocialIconsBar";

async function getCategories() {
  const { data } = await supabase
    .from("categories")
    .select("name, slug")
    .order("name");
  return data || [];
}

export default async function Header() {
  const [categories, logoUrl, socialLinks] = await Promise.all([
    getCategories(),
    getSiteSetting("site_logo", "/logo-dirham-genie.png"),
    getSocialLinks(),
  ]);
  const locale = getLocale();

  return (
    <header className="bg-ink border-b border-gold/20 sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-ink/90">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <img
              src={logoUrl}
              alt="Dirham Genie"
              className="h-10 w-10 rounded-full object-cover lamp-glow"
            />
            <div className="leading-tight">
              <span className="font-display text-xl font-bold tracking-wide text-gold-dim block">
                Dirham Genie
              </span>
              <span className="hidden sm:block text-[11px] text-cream/40">
                Shop Smarter, Save More.
              </span>
            </div>
          </Link>

          <div className="hidden md:flex flex-1 max-w-md">
            <SearchBar placeholder={t(locale, "search")} mode="amazon" />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="relative w-9 h-9 flex items-center justify-center rounded-full text-cream/70 hover:text-gold hover:bg-white/5 transition-colors"
            >
              ♡
              <WishlistCount />
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

        <div className="md:hidden pb-3 flex">
          <SearchBar placeholder={t(locale, "search")} mode="amazon" />
        </div>

        {/* One combined strip below the logo row — nav links on the left,
            social icons on the right — instead of a separate stacked bar.
            On desktop it's a normal row; below lg it becomes a single
            horizontally-scrollable strip so nothing is hidden on mobile. */}
        <div className="pb-3 flex items-center gap-3 overflow-x-auto lg:overflow-visible">
          <nav className="flex items-center gap-2 lg:gap-5 text-xs lg:text-sm shrink-0">
            <Link
              href="/deals/latest"
              className="shrink-0 px-3 py-1.5 lg:px-0 lg:py-0 rounded-full lg:rounded-none border lg:border-0 border-gold/30 text-cream/80 hover:border-gold hover:text-gold transition-colors"
            >
              {t(locale, "latest")}
            </Link>
            <Link
              href="/deals/lightning"
              className="shrink-0 px-3 py-1.5 lg:px-0 lg:py-0 rounded-full lg:rounded-none border lg:border-0 border-gold/30 text-cream/80 hover:border-gold hover:text-gold transition-colors"
            >
              ⚡ {t(locale, "lightning")}
            </Link>
            <Link
              href="/deals/biggest-discounts"
              className="shrink-0 px-3 py-1.5 lg:px-0 lg:py-0 rounded-full lg:rounded-none border lg:border-0 border-gold/30 text-cream/80 hover:border-gold hover:text-gold transition-colors"
            >
              {t(locale, "topDiscounts")}
            </Link>
            <Link
              href="/coupons"
              className="shrink-0 px-3 py-1.5 lg:px-0 lg:py-0 rounded-full lg:rounded-none border lg:border-0 border-gold/30 text-cream/80 hover:border-gold hover:text-gold transition-colors"
            >
              🎟️ {t(locale, "coupons")}
            </Link>
            {categories.slice(0, 3).map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="hidden lg:inline text-cream/80 hover:text-gold transition-colors"
              >
                {c.name}
              </Link>
            ))}
            <span className="hidden lg:inline">
              <LanguageSwitcher locale={locale} />
            </span>
          </nav>

          <div className="flex-1 hidden lg:block" />

          <SocialIconRow links={socialLinks} showLabel={false} className="shrink-0 ml-auto lg:ml-0" />
        </div>
      </div>
    </header>
  );
}
