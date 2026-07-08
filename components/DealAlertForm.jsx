"use client";

import { useEffect, useState } from "react";
import TurnstileWidget from "@/components/TurnstileWidget";

export default function DealAlertForm({ defaultCategoryId = "" }) {
  const [email, setEmail] = useState("");
  const [categoryId, setCategoryId] = useState(defaultCategoryId);
  const [categories, setCategories] = useState([]);
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (defaultCategoryId) return; // already know the category, no need to show the picker
    fetch("/api/categories")
      .then((r) => r.json())
      .then((json) => setCategories(json.categories || []));
  }, [defaultCategoryId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/deal-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, category_id: categoryId || null, turnstileToken: token }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setStatus("done");
      setMessage("You're set! We'll email you when new deals drop.");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err.message);
    }
  }

  return (
    <div className="card-surface rounded-lg p-4">
      <p className="text-gold font-semibold text-sm mb-1">🔔 Get Deal Alerts</p>
      <p className="text-cream/60 text-xs mb-3">
        Get an email the moment a new deal lands{defaultCategoryId ? " in this category" : ""}.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 min-w-[160px] rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream placeholder:text-cream/40 focus:border-gold outline-none"
        />
        {!defaultCategoryId && (
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-md bg-gold hover:bg-gold-bright text-ink text-sm font-semibold px-4 disabled:opacity-60"
        >
          {status === "loading" ? "..." : "Notify Me"}
        </button>
      </form>
      <TurnstileWidget onToken={setToken} />
      {message && (
        <p className={`text-xs mt-2 ${status === "error" ? "text-red-300" : "text-deal-green"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
