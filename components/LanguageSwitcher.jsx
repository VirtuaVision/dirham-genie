"use client";

import { useRouter } from "next/navigation";

export default function LanguageSwitcher({ locale }) {
  const router = useRouter();

  function setLocale(next) {
    document.cookie = `dg_locale=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1 text-xs">
      <button
        onClick={() => setLocale("en")}
        className={locale === "en" ? "text-gold font-semibold" : "text-cream/50 hover:text-gold"}
      >
        EN
      </button>
      <span className="text-cream/30">/</span>
      <button
        onClick={() => setLocale("ar")}
        className={locale === "ar" ? "text-gold font-semibold" : "text-cream/50 hover:text-gold"}
      >
        عربي
      </button>
    </div>
  );
}
