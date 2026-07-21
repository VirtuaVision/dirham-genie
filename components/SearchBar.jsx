"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatAed } from "@/lib/formatCurrency";

export default function SearchBar({ placeholder = "Search for a deal..." }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const boxRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(e) {
    const value = e.target.value;
    setQuery(value);
    clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(value)}`);
        const json = await res.json();
        setSuggestions(json.products || []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300); // debounce — waits for a pause in typing before calling the API
  }

  function goToSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <div ref={boxRef} className="relative flex-1 max-w-md">
      <form onSubmit={goToSearch} className="flex">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-l-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream placeholder:text-cream/40 focus:border-gold outline-none"
        />
        <button
          type="submit"
          className="rounded-r-md bg-gold px-4 text-sm font-semibold text-ink hover:bg-gold-bright transition-colors shrink-0"
        >
          Search
        </button>
      </form>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 card-surface rounded-lg overflow-hidden z-50 max-h-80 overflow-y-auto">
          {loading && <p className="text-xs text-cream/50 p-3">Searching...</p>}
          {!loading && suggestions.length === 0 && (
            <p className="text-xs text-cream/50 p-3">No matches yet — try Search for full results.</p>
          )}
          {suggestions.map((p) => (
            <a
              key={p.id}
              href={`/product/${p.slug}`}
              className="flex items-center gap-3 p-2 hover:bg-white/5 border-b border-gold/10 last:border-0"
            >
              {p.image_url && (
                <img src={p.image_url} alt="" className="w-10 h-10 object-contain bg-white/5 rounded shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-cream/90 truncate">{p.title}</p>
                <p className="text-xs text-gold font-semibold">{formatAed(p.price) || "See price"}</p>
              </div>
            </a>
          ))}
          {suggestions.length > 0 && (
            <button
              onClick={goToSearch}
              className="w-full text-center text-xs text-gold py-2 hover:bg-white/5"
            >
              See all results for &quot;{query}&quot; →
            </button>
          )}
        </div>
      )}
    </div>
  );
}