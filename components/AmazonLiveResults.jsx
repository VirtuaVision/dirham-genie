"use client";

import { useEffect, useState } from "react";
import { formatAed, discountPercent } from "@/lib/formatCurrency";
import StarRating from "@/components/StarRating";
import { useIsAdmin } from "@/components/AdminStatusProvider";

const JSON_HEADERS = { "Content-Type": "application/json" };

// Adds this ASIN to your site (fetching its full details from Amazon with
// your affiliate link). Safe to repeat: if it's already there it's just
// moved back to the top of the site.
async function importToSite(asin) {
  const res = await fetch("/api/amazon/bulk-import", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ lines: [asin], category_id: null }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Couldn't add it (error ${res.status}).`);
  if (json.imported > 0) return "added";
  if (json.movedToTop > 0) return "existing";
  throw new Error((json.details && json.details[0]) || "Amazon didn't return this product.");
}

export default function AmazonLiveResults({ products }) {
  const isAdmin = useIsAdmin();
  const [collections, setCollections] = useState(null); // null = loading
  const [status, setStatus] = useState({}); // asin -> { busy, ok, text }
  const [bulk, setBulk] = useState({ busy: false, ok: true, text: "" });

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/admin/collections")
      .then((r) => r.json())
      .then((j) => setCollections(j.collections || []))
      .catch(() => setCollections([]));
  }, [isAdmin]);

  function setFor(asin, patch) {
    setStatus((prev) => ({ ...prev, [asin]: { ...prev[asin], ...patch } }));
  }

  async function addToSite(p) {
    setFor(p.asin, { busy: true, ok: true, text: "Adding…" });
    try {
      const result = await importToSite(p.asin);
      setFor(p.asin, {
        busy: false,
        ok: true,
        text: result === "added" ? "Added to your site ✓" : "Already on your site — moved to the top ✓",
      });
    } catch (err) {
      setFor(p.asin, { busy: false, ok: false, text: err.message });
    }
  }

  async function addToCollection(p, collectionId) {
    const collection = (collections || []).find((c) => String(c.id) === String(collectionId));
    setFor(p.asin, { busy: true, ok: true, text: "Adding to your site…" });
    try {
      await importToSite(p.asin);

      setFor(p.asin, { text: `Adding to "${collection?.title || "sale page"}"…` });
      const lookup = await fetch(`/api/admin/collections/search?asins=${encodeURIComponent(p.asin)}`);
      const found = await lookup.json();
      const productId = found.products?.[0]?.id;
      if (!lookup.ok || !productId) throw new Error("Added to the site, but couldn't find it to put on the page.");

      const res = await fetch(`/api/admin/collections/${collectionId}/add-products`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ product_ids: [productId] }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Couldn't add it to the sale page.");

      setFor(p.asin, {
        busy: false,
        ok: true,
        text:
          json.added > 0
            ? `On your site and added to "${collection?.title}" ✓`
            : `Already on "${collection?.title}" ✓`,
      });
    } catch (err) {
      setFor(p.asin, { busy: false, ok: false, text: err.message });
    }
  }

  // Adds EVERY result on this page to your site (10 at a time), and
  // optionally onto a sale page too.
  async function addAll(collectionId) {
    const collection = collectionId
      ? (collections || []).find((c) => String(c.id) === String(collectionId))
      : null;
    const question = collection
      ? `Add all ${products.length} results to your site and to "${collection.title}"?`
      : `Add all ${products.length} results to your site?`;
    if (!confirm(question)) return;

    const asins = products.map((p) => p.asin);
    let imported = 0;
    let alreadyThere = 0;
    const problems = [];
    setBulk({ busy: true, ok: true, text: "Starting…" });

    try {
      for (let i = 0; i < asins.length; i += 10) {
        const chunk = asins.slice(i, i + 10);
        setBulk({
          busy: true,
          ok: true,
          text: `Adding ${Math.min(i + 10, asins.length)} of ${asins.length} from Amazon…`,
        });
        try {
          const res = await fetch("/api/amazon/bulk-import", {
            method: "POST",
            headers: JSON_HEADERS,
            body: JSON.stringify({ lines: chunk, category_id: null }),
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) {
            problems.push(json.error || `Amazon error ${res.status}`);
            continue;
          }
          imported += json.imported || 0;
          alreadyThere += json.movedToTop || 0;
          (json.details || []).forEach((d) => problems.push(d));
        } catch (err) {
          problems.push(err.message);
        }
      }

      // Which ones are now on the site?
      const lookup = await fetch(`/api/admin/collections/search?asins=${encodeURIComponent(asins.join("\n"))}`);
      const found = await lookup.json();
      const onSite = found.products || [];
      const onSiteAsins = new Set(onSite.map((x) => x.asin));

      let collectionNote = "";
      if (collection && onSite.length > 0) {
        setBulk({ busy: true, ok: true, text: `Adding to "${collection.title}"…` });
        const res = await fetch(`/api/admin/collections/${collection.id}/add-products`, {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify({ product_ids: onSite.map((x) => x.id) }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Couldn't add them to the sale page.");
        collectionNote = ` ${json.added} added to "${collection.title}"${
          json.alreadyThere ? ` (${json.alreadyThere} were already on it)` : ""
        }.`;
      }

      // Mark each card.
      setStatus((prev) => {
        const next = { ...prev };
        asins.forEach((asin) => {
          next[asin] = onSiteAsins.has(asin)
            ? { busy: false, ok: true, text: collection ? `On your site and "${collection.title}" ✓` : "On your site ✓" }
            : { busy: false, ok: false, text: "Couldn't be added." };
        });
        return next;
      });

      const failed = asins.length - onSite.length;
      let text = `Done: ${imported} new product${imported === 1 ? "" : "s"} added`;
      if (alreadyThere > 0) text += `, ${alreadyThere} already on your site`;
      text += ".";
      text += collectionNote;
      if (failed > 0) {
        text += ` ${failed} couldn't be added.`;
        if (problems.length > 0) text += ` Amazon said: ${problems[0]}`;
      }
      setBulk({ busy: false, ok: failed === 0, text });
    } catch (err) {
      setBulk({ busy: false, ok: false, text: err.message });
    }
  }

  const anyBusy = bulk.busy || Object.values(status).some((st) => st.busy);

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="font-display text-xl text-gold">More from Amazon.ae</h2>
        <span className="text-xs text-cream/40">(not yet added to our site)</span>
      </div>
      <p className="text-cream/50 text-xs mb-4">
        Best picks based on rating, review count, and discount &mdash; fetched
        live from Amazon.ae.
      </p>

      {isAdmin && (
        <div className="rounded-lg border border-gold/30 bg-gold/5 p-3 mb-4">
          <p className="text-xs font-semibold text-gold mb-0.5">Admin: add everything on this page</p>
          <p className="text-[11px] text-cream/50 mb-2">
            Adds all {products.length} results to your site, and can put them on a sale page too.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => addAll(null)}
              disabled={anyBusy}
              className="rounded-md bg-gold hover:bg-gold-bright text-ink font-semibold text-xs px-4 py-2 disabled:opacity-50"
            >
              {bulk.busy ? "Working…" : `➕ Add all ${products.length} to my site`}
            </button>
            <select
              value=""
              disabled={anyBusy || !collections || collections.length === 0}
              onChange={(e) => e.target.value && addAll(e.target.value)}
              className="rounded-md bg-ink-lighter border border-gold/30 text-cream text-xs py-2 px-2 focus:outline-none focus:border-gold/60 disabled:opacity-50"
            >
              <option value="">
                {collections === null
                  ? "Loading sale pages…"
                  : collections.length === 0
                  ? "No sale pages yet"
                  : "📚 Add all to a sale page…"}
              </option>
              {(collections || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          {bulk.text && (
            <p className={`text-xs mt-2 leading-snug ${bulk.ok ? "text-deal-green" : "text-red-400"}`}>
              {bulk.text}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map((p) => {
          const discount = discountPercent(p.price, p.list_price);
          const st = status[p.asin] || {};
          return (
            <div
              key={p.asin}
              className="card-surface rounded-lg overflow-hidden flex flex-col hover:border-gold/50 transition-colors"
            >
              <a
                href={p.affiliate_url}
                target="_blank"
                rel="nofollow sponsored noopener noreferrer"
                className="flex flex-col flex-1"
              >
                <div className="relative aspect-square bg-white/5 flex items-center justify-center">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.title}
                      className="max-h-full max-w-full object-contain p-4"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className="text-cream/30 text-sm">No image</span>
                  )}
                  {discount && (
                    <span className="absolute top-2 left-2 bg-deal-green text-white text-xs font-bold px-2 py-1 rounded">
                      -{discount}%
                    </span>
                  )}
                </div>
                <div className="p-3 flex flex-col gap-1 flex-1">
                  <h3 className="text-sm text-cream/90 line-clamp-2 leading-snug min-h-[2.5rem]">
                    {p.title}
                  </h3>
                  <div className="mt-auto flex items-baseline gap-2">
                    <span className="font-mono text-gold font-semibold">
                      {formatAed(p.price) || "See price"}
                    </span>
                    {discount && (
                      <span className="font-mono text-xs text-cream/40 line-through">
                        {formatAed(p.list_price)}
                      </span>
                    )}
                  </div>
                  {p.rating && <StarRating rating={p.rating} reviewCount={p.review_count} />}
                  <span className="text-xs text-gold mt-1">View on Amazon.ae &rarr;</span>
                </div>
              </a>

              {isAdmin && (
                <div className="border-t border-gold/20 bg-gold/5 p-2 space-y-1.5">
                  <button
                    type="button"
                    onClick={() => addToSite(p)}
                    disabled={st.busy || bulk.busy}
                    className="block w-full rounded-md border border-gold/40 text-gold hover:bg-gold/10 font-semibold text-xs py-2 transition-colors disabled:opacity-50"
                  >
                    {st.busy ? "Working…" : "➕ Add to my site"}
                  </button>
                  <select
                    value=""
                    disabled={st.busy || bulk.busy || !collections || collections.length === 0}
                    onChange={(e) => e.target.value && addToCollection(p, e.target.value)}
                    className="w-full rounded-md bg-ink-lighter border border-gold/30 text-cream text-xs py-2 px-2 focus:outline-none focus:border-gold/60 disabled:opacity-50"
                  >
                    <option value="">
                      {collections === null
                        ? "Loading sale pages…"
                        : collections.length === 0
                        ? "No sale pages yet"
                        : "📚 Add to a sale page…"}
                    </option>
                    {(collections || []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                  {st.text && (
                    <p className={`text-[11px] leading-snug ${st.ok ? "text-deal-green" : "text-red-400"}`}>
                      {st.text}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-cream/40 mt-4">
        As an Amazon Associate, Dirham Genie earns from qualifying purchases.
      </p>
    </section>
  );
}
