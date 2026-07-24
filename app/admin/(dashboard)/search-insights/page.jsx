"use client";

import { useEffect, useState } from "react";

export default function SearchInsightsPage() {
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/search-insights")
      .then((r) => r.json())
      .then((json) => setSearches(json.searches || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl text-gold mb-2">Search Insights</h1>
      <p className="text-cream/50 text-sm mb-6">
        What people search for on your site that finds nothing — a ready-made
        list of products worth adding next.
      </p>

      {loading ? (
        <p className="text-cream/50 text-sm">Loading...</p>
      ) : searches.length === 0 ? (
        <p className="text-cream/50 text-sm">No zero-result searches yet.</p>
      ) : (
        <div className="space-y-2">
          {searches.map((s) => (
            <div key={s.query} className="card-surface rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-cream/90">&quot;{s.query}&quot;</span>
              <span className="text-xs text-cream/50">
                Searched {s.times_searched}x · last {new Date(s.last_searched).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}