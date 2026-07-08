import { cookies } from "next/headers";

export const dictionary = {
  en: {
    search: "Search for a deal...",
    latest: "Latest",
    lightning: "Lightning",
    topDiscounts: "Top Discounts",
    coupons: "Coupons",
    heroTitle: "Unlocking the Best Deals, Every Day",
    heroSubtitle:
      "Dirham Genie scans Amazon.ae so you don't have to — real discounts, real prices, in real dirhams.",
    rubTheLamp: "Rub the Lamp for Today's Wish",
    geniesPicks: "Genie's Picks",
    freshlyUnlocked: "Freshly Unlocked",
    viewDeal: "View Deal on Amazon.ae",
  },
  ar: {
    search: "ابحث عن عرض...",
    latest: "الأحدث",
    lightning: "عروض خاطفة",
    topDiscounts: "أكبر الخصومات",
    coupons: "كوبونات",
    heroTitle: "أفضل العروض، كل يوم",
    heroSubtitle:
      "دراهم جيني يبحث في أمازون الإمارات نيابة عنك — خصومات حقيقية وأسعار حقيقية بالدرهم.",
    rubTheLamp: "افرك المصباح لأمنية اليوم",
    geniesPicks: "اختيارات الجني",
    freshlyUnlocked: "أحدث العروض",
    viewDeal: "شراء من أمازون الإمارات",
  },
};

export function getLocale() {
  const cookieLocale = cookies().get("dg_locale")?.value;
  return cookieLocale === "ar" ? "ar" : "en";
}

export function t(locale, key) {
  return dictionary[locale]?.[key] || dictionary.en[key] || key;
}
