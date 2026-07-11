"use client";

import { useEffect, useState } from "react";

export default function SyncLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/sync-logs");
    const json = await res.json();
    setLogs(json.logs || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function runNow() {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/cron/sync-amazon", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
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
