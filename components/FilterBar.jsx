"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "discount", label: "Biggest Discount" },
  { value: "rating", label: "Highest Rated" },
];

export default function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key, value) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 text-sm">
      <select
        value={searchParams.get("sort") || "newest"}
        onChange={(e) => update("sort", e.target.value)}
        className="rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-cream focus:border-gold outline-none"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <input
        type="number"
        placeholder="Min price"
        defaultValue={searchParams.get("minPrice") || ""}
        onBlur={(e) => update("minPrice", e.target.value)}
        className="w-28 rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-cream focus:border-gold outline-none"
      />
      <input
        type="number"
        placeholder="Max price"
        defaultValue={searchParams.get("maxPrice") || ""}
        onBlur={(e) => update("maxPrice", e.target.value)}
        className="w-28 rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-cream focus:border-gold outline-none"
      />

      <select
        value={searchParams.get("minRating") || ""}
        onChange={(e) => update("minRating", e.target.value)}
        className="rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-cream focus:border-gold outline-none"
      >
        <option value="">Any rating</option>
        <option value="4">4★ &amp; up</option>
        <option value="3">3★ &amp; up</option>
      </select>

      {(searchParams.get("sort") || searchParams.get("minPrice") || searchParams.get("maxPrice") || searchParams.get("minRating")) && (
        <button
          onClick={() => router.push(pathname)}
          className="text-cream/50 hover:text-gold text-xs underline underline-offset-2"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
