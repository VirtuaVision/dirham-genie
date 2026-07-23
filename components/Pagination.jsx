"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function Pagination({ currentPage, totalPages, basePath = "/" }) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const pageHref = (p) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p === 1) params.delete("page");
    else params.set("page", p);
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  const pages = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <nav className="flex items-center justify-center gap-1 mt-8" aria-label="Pagination">
      <Link
        href={pageHref(Math.max(1, currentPage - 1))}
        aria-disabled={currentPage === 1}
        className={`px-3 py-2 rounded-md text-sm border border-gold/30 ${
          currentPage === 1
            ? "pointer-events-none opacity-30"
            : "text-cream/80 hover:border-gold hover:text-gold"
        }`}
      >
        &larr; Prev
      </Link>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-cream/40 text-sm">
            &hellip;
          </span>
        ) : (
          <Link
            key={p}
            href={pageHref(p)}
            className={`w-9 h-9 flex items-center justify-center rounded-md text-sm border ${
              p === currentPage
                ? "bg-gold text-ink border-gold font-semibold"
                : "border-gold/30 text-cream/80 hover:border-gold hover:text-gold"
            }`}
          >
            {p}
          </Link>
        )
      )}

      <Link
        href={pageHref(Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage === totalPages}
        className={`px-3 py-2 rounded-md text-sm border border-gold/30 ${
          currentPage === totalPages
            ? "pointer-events-none opacity-30"
            : "text-cream/80 hover:border-gold hover:text-gold"
        }`}
      >
        Next &rarr;
      </Link>
    </nav>
  );
}