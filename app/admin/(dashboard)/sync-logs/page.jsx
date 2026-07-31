"use client";

import { useEffect, useState } from "react";

export default function SyncLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState(null);

  const [discoveryEnabled, setDiscoveryEnabled] = useState(true);
  const [keywords, setKeywords] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  async function loadSettings() {
    setSettingsLoading(true);
    const res = await fetch("/api/admin/site-settings");
    const json = await res.json();
    const s = json.settings || {};
    setDiscoveryEnabled(s.discovery_enabled !== "false");
    setKeywords(s.discovery_keywords || "");
    setSettingsLoading(false);
  }

  async function saveSetting(key, value) {
    await fetch("/api/admin/site-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
  }

  async function toggleDiscovery() {
    const next = !discoveryEnabled;
    setDiscoveryEnabled(next);
    await saveSetting("discovery_enabled", next ? "true" : "false");
  }

  async function saveKeywords() {
    setSavingSettings(true);
    await saveSetting("discovery_keywords", keywords);
    setSavingSettings(false);
  }

  async function load() {
    setLoading(true);
    const res = await fetch("/api/sync-logs");
    const json = await res.json();
    setLogs(json.logs || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    loadSettings();
  }, []);

  async function runNow() {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/cron/sync-amazon", { method: "POST" });
      const raw = await res.text();
      let json;
      try {
        json = JSON.parse(raw);
      } catch {
        throw new Error(
          res.status === 504 || !res.ok
            ? "The sync took too long and the server timed out before it finished. It may have partially run — check the logs below in a minute, or try again."
            : "Unexpected response from the server."
        );
      }
      if (!res.ok) throw new Error(json.error || "Sync failed.");
      setMessage(
        `Sync complete: checked ${json.products_checked}, updated ${json.products_updated}, discovered ${json.new_products_discovered || 0} new product(s), errors ${json.errors}.`
      );
      load();
    } catch (err) {
      setMessage(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-gold">Amazon Sync Logs</h1>
        <button
          onClick={runNow}
          disabled={syncing}
          className="rounded-md bg-gold hover:bg-gold-bright text-ink text-sm font-semibold px-4 py-2 disabled:opacity-60"
        >
         {syncing ? "Syncing..." : "Run Sync Now"}
        </button>
      </div>

      <p className="text-cream/50 text-sm mb-4">
        This automatically refreshes prices for any product added via
        &quot;Auto-fetch from Amazon.ae&quot;. A scheduled run also happens
        automatically every day (configured in <code>vercel.json</code>).
      </p>

      <div className="card-surface rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-cream/90">Auto-discovery of new products</p>
            <p className="text-xs text-cream/50 mt-0.5">
              {discoveryEnabled
                ? "On — every sync run also searches for new products to add."
                : "Off — sync will only refresh prices on existing products, nothing new gets added."}
            </p>
          </div>
          <button
            onClick={toggleDiscovery}
            disabled={settingsLoading}
            aria-label="Toggle auto-discovery"
            className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
              discoveryEnabled ? "bg-gold" : "bg-cream/20"
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                discoveryEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-gold/10">
          <p className="text-sm font-semibold text-cream/90 mb-1">Custom search keywords</p>
          <p className="text-xs text-cream/50 mb-2">
            Comma-separated. Each one is searched directly on Amazon.ae during discovery, in
            addition to your categories — matches land in Genie&apos;s Choice. e.g.{" "}
            <code>wireless earbuds, air fryer, gaming chair</code>
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="wireless earbuds, air fryer, gaming chair"
              className="flex-1 bg-ink-lighter border border-gold/20 rounded-md px-3 py-2 text-sm text-cream/90 placeholder:text-cream/30"
            />
            <button
              onClick={saveKeywords}
              disabled={savingSettings}
              className="rounded-md bg-gold/15 hover:bg-gold/25 text-gold text-sm font-semibold px-4 py-2 disabled:opacity-60 shrink-0"
            >
              {savingSettings ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>

      {message && (
        <p className="bg-ink-light border border-gold/20 text-cream/80 text-sm rounded p-3 mb-4">
          {message}
        </p>
      )}

      {loading ? (
        <p className="text-cream/50 text-sm">Loading...</p>
      ) : logs.length === 0 ? (
        <p className="text-cream/50 text-sm">No sync runs yet.</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="card-surface rounded-lg p-3 text-sm">
              <div className="flex justify-between text-cream/80">
                <span>{new Date(log.run_at).toLocaleString()}</span>
                <span className={log.errors > 0 ? "text-red-300" : "text-deal-green"}>
                  {log.errors > 0 ? `${log.errors} error(s)` : "OK"}
                </span>
              </div>
              <p className="text-cream/50 text-xs mt-1">
                Checked {log.products_checked} &middot; Updated {log.products_updated}
              </p>
              {log.details && (
                <p className="text-cream/40 text-xs mt-1 whitespace-pre-line">{log.details}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
