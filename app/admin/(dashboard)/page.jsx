import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { formatAed } from "@/lib/formatCurrency";
import { timeAgo } from "@/lib/timeAgo";

export const dynamic = "force-dynamic";

function startOfDay(daysAgo = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

async function getStats() {
  const staleThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const todayStart = startOfDay(0);
  const yesterdayStart = startOfDay(1);

  const [
    { count: totalProducts },
    { count: activeProducts },
    { count: totalClicks },
    { count: clicksToday },
    { count: clicksYesterday },
    { count: subscribers },
    { count: activeCoupons },
    { count: staleProducts },
    { data: recentClicks },
    { data: recentProducts },
    { data: lastSync },
    { data: syncHistory },
  ] = await Promise.all([
    supabaseAdmin.from("products").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabaseAdmin.from("clicks").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("clicks").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
    supabaseAdmin
      .from("clicks")
      .select("*", { count: "exact", head: true })
      .gte("created_at", yesterdayStart)
      .lt("created_at", todayStart),
    supabaseAdmin.from("newsletter_subscribers").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("coupons").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabaseAdmin
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .or(`last_synced_at.is.null,last_synced_at.lt.${staleThreshold}`),
    supabaseAdmin
      .from("clicks")
      .select("product_id")
      .gte("created_at", startOfDay(30)),
    supabaseAdmin
      .from("products")
      .select("id, title, slug, image_url, price, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabaseAdmin.from("sync_logs").select("*").order("run_at", { ascending: false }).limit(1).maybeSingle(),
    supabaseAdmin
      .from("sync_logs")
      .select("run_at, products_checked, products_updated, errors, details")
      .order("run_at", { ascending: false })
      .limit(30),
  ]);

  const clickCounts = {};
  (recentClicks || []).forEach((c) => {
    if (!c.product_id) return;
    clickCounts[c.product_id] = (clickCounts[c.product_id] || 0) + 1;
  });
  const topProductIds = Object.entries(clickCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  let topProducts = [];
  if (topProductIds.length) {
    const { data } = await supabaseAdmin
      .from("products")
      .select("id, title, slug, image_url, price")
      .in("id", topProductIds);
    topProducts = topProductIds
      .map((id) => {
        const p = (data || []).find((row) => row.id === id);
        return p ? { ...p, clicks: clickCounts[id] } : null;
      })
      .filter(Boolean);
  }

  return {
    totalProducts: totalProducts || 0,
    activeProducts: activeProducts || 0,
    totalClicks: totalClicks || 0,
    clicksToday: clicksToday || 0,
    clicksYesterday: clicksYesterday || 0,
    subscribers: subscribers || 0,
    activeCoupons: activeCoupons || 0,
    staleProducts: staleProducts || 0,
    topProducts,
    recentProducts: recentProducts || [],
    lastSync: lastSync || null,
    syncHistory: (syncHistory || []).slice().reverse(),
  };
}

function discoveredFromDetails(details) {
  const match = (details || "").match(/Discovered (\d+) new/);
  return match ? Number(match[1]) : 0;
}

/** Pure-SVG line chart — no charting library needed. Plots products
 *  checked (gold line) and discovered (green line) per sync run over the
 *  last 30 days, with a red dot marking any run that had errors. */
function SyncHealthChart({ history }) {
  if (!history || history.length < 2) {
    return <p className="text-cream/40 text-sm">Not enough sync history yet to show a trend.</p>;
  }

  const width = 600;
  const height = 160;
  const padding = 24;
  const points = history.map((h) => ({
    checked: h.products_checked || 0,
    discovered: discoveredFromDetails(h.details),
    hasErrors: (h.errors || 0) > 0,
    date: new Date(h.run_at),
  }));

  const maxChecked = Math.max(...points.map((p) => p.checked), 1);
  const maxDiscovered = Math.max(...points.map((p) => p.discovered), 1);
  const stepX = (width - padding * 2) / (points.length - 1);

  const pathFor = (values, max) =>
    values
      .map((v, i) => {
        const x = padding + i * stepX;
        const y = height - padding - (v / max) * (height - padding * 2);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  const checkedPath = pathFor(points.map((p) => p.checked), maxChecked);
  const discoveredPath = pathFor(points.map((p) => p.discovered), maxDiscovered);

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40">
        <path d={checkedPath} fill="none" stroke="rgb(var(--color-gold))" strokeWidth="2" />
        <path d={discoveredPath} fill="none" stroke="#22c55e" strokeWidth="2" />
        {points.map((p, i) =>
          p.hasErrors ? (
            <circle
              key={i}
              cx={padding + i * stepX}
              cy={height - padding - (p.checked / maxChecked) * (height - padding * 2)}
              r="3.5"
              fill="#ef4444"
            />
          ) : null
        )}
      </svg>
      <div className="flex items-center gap-4 text-xs text-cream/50 mt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gold inline-block" /> Checked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Discovered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Run had errors
        </span>
        <span className="ml-auto">
          {points[0].date.toLocaleDateString()} — {points[points.length - 1].date.toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

function ClicksTrend({ today, yesterday }) {
  if (yesterday === 0) return null;
  const diff = today - yesterday;
  const pct = Math.round((diff / yesterday) * 100);
  if (diff === 0) return <span className="text-cream/40 text-xs ml-2">same as yesterday</span>;
  const up = diff > 0;
  return (
    <span className={`text-xs ml-2 ${up ? "text-emerald-400" : "text-red-400"}`}>
      {up ? "▲" : "▼"} {Math.abs(pct)}% vs yesterday
    </span>
  );
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: "Total Products", value: stats.totalProducts, href: "/admin/products" },
    { label: "Live on Site", value: stats.activeProducts, href: "/admin/products" },
    { label: "Clicks Today", value: stats.clicksToday, href: "/admin/analytics", trend: true },
    { label: "Total Affiliate Clicks", value: stats.totalClicks, href: "/admin/analytics" },
    { label: "Newsletter Subscribers", value: stats.subscribers },
    { label: "Active Coupons", value: stats.activeCoupons, href: "/admin/coupons" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl text-gold mb-6">Dashboard</h1>

      {stats.staleProducts > 0 && (
        <Link
          href="/admin/products"
          className="block card-surface rounded-lg p-4 mb-6 border-amber-500/40 hover:border-amber-500/70 transition-colors"
        >
          <p className="text-amber-400 text-sm font-semibold">
            ⚠️ {stats.staleProducts} active product{stats.staleProducts === 1 ? "" : "s"} haven&apos;t had a
            price check in over 48 hours
          </p>
          <p className="text-cream/50 text-xs mt-1">Their listed price may be out of date. Tap to review.</p>
        </Link>
      )}

      <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {cards.map((c) => {
          const Card = (
            <div className="card-surface rounded-lg p-5 h-full">
              <p className="text-cream/50 text-xs uppercase tracking-wide">{c.label}</p>
              <p className="font-mono text-3xl text-gold mt-1">
                {c.value}
                {c.trend && <ClicksTrend today={stats.clicksToday} yesterday={stats.clicksYesterday} />}
              </p>
            </div>
          );
          return c.href ? (
            <Link key={c.label} href={c.href} className="hover:opacity-90 transition-opacity">
              {Card}
            </Link>
          ) : (
            <div key={c.label}>{Card}</div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card-surface rounded-lg p-5">
          <p className="text-gold font-semibold mb-3 text-sm">🔥 Top Clicked — Last 30 Days</p>
          {stats.topProducts.length === 0 ? (
            <p className="text-cream/40 text-sm">No clicks recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {stats.topProducts.map((p, i) => (
                <li key={p.id}>
                  <Link href={`/product/${p.slug}`} className="flex items-center gap-3 group">
                    <span className="text-cream/30 text-xs font-mono w-4 shrink-0">{i + 1}</span>
                    <img
                      src={p.image_url}
                      alt=""
                      className="w-10 h-10 rounded object-cover bg-ink-lighter shrink-0"
                      loading="lazy"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-cream/80 truncate group-hover:text-gold transition-colors">
                        {p.title}
                      </span>
                      <span className="block text-xs text-cream/40">{formatAed(p.price)}</span>
                    </span>
                    <span className="text-xs text-gold font-mono shrink-0">{p.clicks} clicks</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-surface rounded-lg p-5">
          <p className="text-gold font-semibold mb-3 text-sm">🆕 Recently Added</p>
          {stats.recentProducts.length === 0 ? (
            <p className="text-cream/40 text-sm">No products yet.</p>
          ) : (
            <ul className="space-y-3">
              {stats.recentProducts.map((p) => (
                <li key={p.id}>
                  <Link href={`/product/${p.slug}`} className="flex items-center gap-3 group">
                    <img
                      src={p.image_url}
                      alt=""
                      className="w-10 h-10 rounded object-cover bg-ink-lighter shrink-0"
                      loading="lazy"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-cream/80 truncate group-hover:text-gold transition-colors">
                        {p.title}
                      </span>
                      <span className="block text-xs text-cream/40">{formatAed(p.price)}</span>
                    </span>
                    <span className="text-xs text-cream/40 shrink-0">{timeAgo(p.created_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card-surface rounded-lg p-5 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-gold font-semibold text-sm">🔄 Last Price Sync</p>
          <Link href="/admin/sync-logs" className="text-xs text-gold hover:text-gold-bright">
            View all logs →
          </Link>
        </div>
        {stats.lastSync ? (
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-cream/70">
            <span>{timeAgo(stats.lastSync.run_at)}</span>
            <span>{stats.lastSync.products_checked} checked</span>
            <span>{stats.lastSync.products_updated} updated</span>
            {stats.lastSync.errors > 0 ? (
              <span className="text-red-400">{stats.lastSync.errors} errors</span>
            ) : (
              <span className="text-emerald-400">0 errors</span>
            )}
          </div>
        ) : (
          <p className="text-cream/40 text-sm mt-2">No sync runs recorded yet.</p>
        )}
      </div>

      <div className="card-surface rounded-lg p-5 mb-8">
        <p className="text-gold font-semibold text-sm mb-3">📈 Sync Health — Last 30 Runs</p>
        <SyncHealthChart history={stats.syncHistory} />
      </div>

      <div className="card-surface rounded-lg p-5 text-sm text-cream/70 leading-relaxed">
        <p className="text-gold font-semibold mb-2">Quick tips</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Use <strong>Add Product</strong> to paste an Amazon.ae link and auto-fetch title, image, and price.</li>
          <li>Or add a product fully manually if it&apos;s not on Amazon&apos;s API yet.</li>
          <li>Toggle &quot;Featured&quot; on a product to show it in the Genie&apos;s Picks section on the homepage.</li>
          <li>Uncheck &quot;Active&quot; to hide a product from the site without deleting it.</li>
        </ul>
      </div>
    </div>
  );
}
