"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatAed } from "@/lib/formatCurrency";

export default function ComparePage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem("dg_compare") || "[]"));
    } catch {
      setItems([]);
    }
  }, []);

  function remove(id) {
    const next = items.filter((p) => p.id !== id);
    setItems(next);
    localStorage.setItem("dg_compare", JSON.stringify(next));
  }

  const rows = [
    { label: "Brand", render: (p) => p.brand || "—" },
    { label: "Price", render: (p) => formatAed(p.price) || "—" },
    { label: "Original Price", render: (p) => formatAed(p.list_price) || "—" },
    { label: "Rating", render: (p) => (p.rating ? `⭐ ${p.rating} (${p.review_count || 0})` : "—") },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-gold mb-2">Compare Products</h1>
      <p className="text-cream/60 text-sm mb-8">
        Add up to 4 products from any product page to compare them side by side.
      </p>

      {items.length === 0 ? (
        <p className="text-cream/50 text-sm">
          Nothing to compare yet. Tap &quot;Add to Compare&quot; on product pages.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-y-2">
            <thead>
              <tr>
                <td className="w-32" />
                {items.map((p) => (
                  <td key={p.id} className="card-surface rounded-lg p-3 text-center align-top">
                    {p.image_url && (
                      <img src={p.image_url} alt={p.title} className="w-20 h-20 object-contain mx-auto mb-2" />
                    )}
                    <Link href={`/product/${p.slug}`} className="text-cream/90 hover:text-gold text-xs line-clamp-2">
                      {p.title}
                    </Link>
                    <button
                      onClick={() => remove(p.id)}
                      className="block mx-auto mt-2 text-xs text-cream/40 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td className="text-gold text-xs font-semibold pr-3 py-2">{row.label}</td>
                  {items.map((p) => (
                    <td key={p.id} className="card-surface text-center text-cream/80 py-2">
                      {row.render(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
