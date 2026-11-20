"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-gold" : "bg-white/20"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-cream transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function Thumb({ src }) {
  return (
    <div className="w-12 h-12 shrink-0 rounded bg-white/5 overflow-hidden">
      {src && (
        <img
          src={src}
          alt=""
          className="w-full h-full object-contain p-1"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
    </div>
  );
}

const JSON_HEADERS = { "Content-Type": "application/json" };

export default function EditCollectionPage() {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [items, setItems] = useState([]); // products on this page, in order
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Title / web address / intro are saved with a button. The two switches and
  // the product list save by themselves the moment you change them.
  const [detailsDirty, setDetailsDirty] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsNote, setDetailsNote] = useState(null);
  const [productStatus, setProductStatus] = useState("");
  const productsDirty = useRef(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [asinText, setAsinText] = useState("");
  const [asinBusy, setAsinBusy] = useState("");
  const [asinMessage, setAsinMessage] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/collections/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        const c = json.collection;
        setForm({
          title: c.title,
          slug: c.slug,
          description: c.description || "",
          is_active: c.is_active,
          show_in_menu: c.show_in_menu,
        });
        setItems(json.products || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Auto-save the product list shortly after any add / remove / reorder.
  useEffect(() => {
    if (!productsDirty.current) return;
    setProductStatus("Saving…");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/collections/${id}`, {
          method: "PUT",
          headers: JSON_HEADERS,
          body: JSON.stringify({ product_ids: items.map((p) => String(p.id)) }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setProductStatus("Saved ✓ — live on the site");
      } catch (err) {
        setProductStatus(`Couldn't save: ${err.message}`);
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [items, id]);

  // Warn before leaving with unsaved title/address/intro edits.
  useEffect(() => {
    if (!detailsDirty) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [detailsDirty]);

  function changeItems(updater) {
    productsDirty.current = true;
    setItems(updater);
  }

  function updateDetail(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setDetailsDirty(true);
    setDetailsNote(null);
  }

  async function saveDetails() {
    setSavingDetails(true);
    setError(null);
    setDetailsNote(null);
    try {
      const res = await fetch(`/api/admin/collections/${id}`, {
        method: "PUT",
        headers: JSON_HEADERS,
        body: JSON.stringify({
          title: form.title,
          slug: form.slug,
          description: form.description,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setForm((f) => ({ ...f, slug: json.collection.slug }));
      setDetailsDirty(false);
      setDetailsNote("Saved ✓");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingDetails(false);
    }
  }

  async function toggleField(field) {
    const next = !form[field];
    setForm((f) => ({ ...f, [field]: next }));
    setError(null);
    try {
      const res = await fetch(`/api/admin/collections/${id}`, {
        method: "PUT",
        headers: JSON_HEADERS,
        body: JSON.stringify({ [field]: next }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setDetailsNote("Saved ✓");
    } catch (err) {
      setForm((f) => ({ ...f, [field]: !next }));
      setError(err.message);
    }
  }

  const inList = (productId) => items.some((p) => String(p.id) === String(productId));

  function addProduct(p) {
    if (inList(p.id)) return;
    changeItems((prev) => [...prev, p]);
  }

  function removeProduct(productId) {
    changeItems((prev) => prev.filter((p) => String(p.id) !== String(productId)));
  }

  function move(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    changeItems((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearched(false);
    try {
      const res = await fetch(`/api/admin/collections/search?q=${encodeURIComponent(query.trim())}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setResults(json.products || []);
      setSearched(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  async function lookupAsins(text) {
    const res = await fetch(`/api/admin/collections/search?asins=${encodeURIComponent(text)}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    return json;
  }

  // Looks the ASINs up on your site; any that aren't there yet are fetched
  // from Amazon (with your affiliate tag) first, then added to this page.
  async function handleAddAsins() {
    const text = asinText.trim();
    if (!text) return;
    setAsinMessage(null);
    setAsinBusy("Looking up your products…");
    try {
      let json = await lookupAsins(text);
      let missing = json.notFound || [];
      let fetchedCount = 0;
      const fetchErrors = [];

      if (missing.length > 0) {
        for (let i = 0; i < missing.length; i += 10) {
          const chunk = missing.slice(i, i + 10);
          setAsinBusy(`Fetching ${Math.min(i + 10, missing.length)} of ${missing.length} from Amazon…`);
          try {
            const res = await fetch("/api/amazon/bulk-import", {
              method: "POST",
              headers: JSON_HEADERS,
              body: JSON.stringify({ lines: chunk, category_id: null }),
            });
            const r = await res.json().catch(() => ({}));
            if (!res.ok) {
              fetchErrors.push(r.error || `Amazon fetch failed (${res.status})`);
              continue;
            }
            fetchedCount += r.imported || 0;
            (r.details || []).forEach((d) => fetchErrors.push(d));
          } catch (err) {
            fetchErrors.push(err.message);
          }
        }
        json = await lookupAsins(text);
        missing = json.notFound || [];
      }

      const fresh = (json.products || []).filter((p) => !inList(p.id));
      if (fresh.length) changeItems((prev) => [...prev, ...fresh]);
      const already = (json.products || []).length - fresh.length;

      let msg = `Added ${fresh.length} to this page`;
      if (fetchedCount > 0) msg += ` (${fetchedCount} newly fetched from Amazon)`;
      msg += ".";
      if (already > 0) msg += ` ${already} ${already === 1 ? "was" : "were"} already on the page.`;
      if (missing.length > 0) {
        msg += ` Couldn't fetch ${missing.length}: ${missing.join(", ")}.`;
        if (fetchErrors.length > 0) msg += ` Amazon said: ${fetchErrors[0]}`;
      }
      setAsinMessage(msg);
      // keep any that failed in the box so you can retry them
      setAsinText(missing.join("\n"));
    } catch (err) {
      setAsinMessage(err.message);
    } finally {
      setAsinBusy("");
    }
  }

  async function copyLink() {
    const link = `${window.location.origin}/collection/${form.slug}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const el = document.createElement("textarea");
      el.value = link;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <p className="text-cream/50 text-sm">Loading…</p>;
  if (!form) {
    return (
      <div>
        <p className="text-red-400 text-sm mb-3">{error || "Page not found."}</p>
        <Link href="/admin/collections" className="text-gold text-sm underline">
          ← Back to Collections
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl pb-10">
      <Link href="/admin/collections" className="text-xs text-cream/50 hover:text-gold">
        ← All collections
      </Link>
      <h1 className="font-display text-2xl text-gold mt-1 mb-4">Edit page</h1>

      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

      <div className="card-surface rounded-lg p-4 mb-5 space-y-3">
        <div>
          <label className="block text-xs text-cream/60 mb-1">Page title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => updateDetail("title", e.target.value)}
            className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-cream/60 mb-1">Web address</label>
          <div className="flex items-center gap-1">
            <span className="text-xs text-cream/45 shrink-0">/collection/</span>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => updateDetail("slug", e.target.value)}
              className="flex-1 min-w-0 rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-cream/60 mb-1">Short intro (optional)</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => updateDetail("description", e.target.value)}
            placeholder="A sentence or two shown at the top of the page"
            className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={saveDetails}
            disabled={savingDetails || !detailsDirty}
            className="rounded-md bg-gold hover:bg-gold-bright text-ink font-semibold px-5 py-2 text-sm disabled:opacity-50"
          >
            {savingDetails ? "Saving..." : "Save title, address & intro"}
          </button>
          {detailsDirty && <span className="text-xs text-cream/55">Not saved yet</span>}
          {!detailsDirty && detailsNote && <span className="text-xs text-deal-green">{detailsNote}</span>}
        </div>

        <div className="border-t border-gold/15 pt-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-cream/80">Visible on the site</span>
            <Switch
              checked={form.is_active}
              onChange={() => toggleField("is_active")}
              label="Visible on the site"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-cream/80">Show as a pill in the menu under the header</span>
            <Switch
              checked={form.show_in_menu}
              onChange={() => toggleField("show_in_menu")}
              label="Show in menu"
            />
          </div>
          <p className="text-[11px] text-cream/40">These two switches save the moment you tap them.</p>
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <a
            href={`/collection/${form.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gold underline"
          >
            View page ↗
          </a>
          <button type="button" onClick={copyLink} className="text-xs text-gold underline">
            {copied ? "Link copied ✓" : "Copy page link"}
          </button>
        </div>
      </div>

      <div className="card-surface rounded-lg p-4 mb-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <h2 className="font-display text-lg text-gold">Products on this page ({items.length})</h2>
          {productStatus && (
            <span
              className={`text-xs ${
                productStatus.startsWith("Couldn't") ? "text-red-400" : "text-deal-green"
              }`}
            >
              {productStatus}
            </span>
          )}
        </div>
        <p className="text-[11px] text-cream/40 mb-3">
          Products save automatically as you add, remove or reorder them.
        </p>
        {items.length === 0 ? (
          <p className="text-sm text-cream/50">Nothing yet — add products below.</p>
        ) : (
          <div className="space-y-2">
            {items.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded-md border border-gold/15 bg-ink-lighter px-2 py-2"
              >
                <Thumb src={p.image_url} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-cream/90 line-clamp-2">{p.title}</p>
                  <p className="text-[11px] text-cream/45">
                    {p.price ? `AED ${p.price}` : "No price"}
                    {p.is_active === false && <span className="text-red-400/80"> · hidden product</span>}
                  </p>
                </div>
                <div className="flex items-center shrink-0">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                    className="px-2 py-1 text-cream/60 hover:text-gold disabled:opacity-25"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1}
                    aria-label="Move down"
                    className="px-2 py-1 text-cream/60 hover:text-gold disabled:opacity-25"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeProduct(p.id)}
                    aria-label="Remove"
                    className="px-2 py-1 text-red-400/80 hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card-surface rounded-lg p-4 mb-5">
        <h2 className="font-display text-lg text-gold mb-3">Add products</h2>

        <form onSubmit={handleSearch} className="flex gap-2 mb-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your products by name"
            className="flex-1 min-w-0 rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
          />
          <button
            type="submit"
            disabled={searching || !query.trim()}
            className="shrink-0 rounded-md bg-gold hover:bg-gold-bright text-ink font-semibold px-4 py-2 text-sm disabled:opacity-60"
          >
            {searching ? "…" : "Search"}
          </button>
        </form>

        {searched && results.length === 0 && (
          <p className="text-sm text-cream/50 mb-3">No products found for that search.</p>
        )}
        {results.length > 0 && (
          <div className="space-y-2 mb-4 max-h-96 overflow-y-auto pr-1">
            {results.map((p) => {
              const added = inList(p.id);
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-2 rounded-md border border-gold/15 bg-ink-lighter px-2 py-2"
                >
                  <Thumb src={p.image_url} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-cream/90 line-clamp-2">{p.title}</p>
                    <p className="text-[11px] text-cream/45">{p.price ? `AED ${p.price}` : "No price"}</p>
                  </div>
                  <button
                    onClick={() => addProduct(p)}
                    disabled={added}
                    className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold ${
                      added ? "bg-white/10 text-cream/40" : "bg-gold text-ink hover:bg-gold-bright"
                    }`}
                  >
                    {added ? "Added" : "Add"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="border-t border-gold/15 pt-3">
          <label className="block text-xs text-cream/60 mb-1">
            Or add several at once — paste ASINs or Amazon links, one per line. Any that aren&apos;t on your
            site yet are fetched from Amazon with your affiliate link.
          </label>
          <textarea
            rows={4}
            value={asinText}
            onChange={(e) => setAsinText(e.target.value)}
            placeholder={"B0D1XXXXXX\nB0D2XXXXXX"}
            className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream font-mono focus:border-gold outline-none"
          />
          <button
            type="button"
            onClick={handleAddAsins}
            disabled={!asinText.trim() || !!asinBusy}
            className="mt-2 rounded-md border border-gold/40 text-gold hover:bg-gold/10 px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {asinBusy || "Add these"}
          </button>
          {asinMessage && <p className="text-xs text-cream/60 mt-2 break-words">{asinMessage}</p>}
        </div>
      </div>
    </div>
  );
}
