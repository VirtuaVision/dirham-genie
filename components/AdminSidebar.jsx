"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ThemeToggle from "@/components/ThemeToggle";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/products", label: "All Products" },
  { href: "/admin/products/new", label: "Add Product" },
  { href: "/admin/page-builder", label: "Page Builder" },
  { href: "/admin/bulk-import", label: "Bulk Import" },
  { href: "/admin/banners", label: "Banners" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/posts", label: "Blog Posts" },
 { href: "/admin/social-post", label: "Social Post Generator" },
{ href: "/admin/ai-image-studio", label: "AI Image Studio" },
  { href: "/admin/sync-logs", label: "Sync Logs" },
  { href: "/admin/search-insights", label: "Search Insights" },
  { href: "/admin/team", label: "Team Access", adminOnly: true },
  { href: "/admin/settings", label: "Site Settings", adminOnly: true },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState("/logo-dirham-genie.png");
  const [adminLogo, setAdminLogo] = useState({ light: "", dark: "" });
  const [role, setRole] = useState(null);

  useEffect(() => {
    fetch("/api/admin/status")
      .then((r) => r.json())
      .then((json) => setRole(json.role))
      .catch(() => setRole(null));
  }, []);

  const visibleLinks = links.filter((link) => !link.adminOnly || role === "admin");

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "site_logo")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) setLogoUrl(data.value);
      });
    supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["admin_logo_light", "admin_logo_dark"])
      .then(({ data }) => {
        const map = {};
        (data || []).forEach((row) => (map[row.key] = row.value));
        setAdminLogo({ light: map.admin_logo_light || "", dark: map.admin_logo_dark || "" });
      });
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="w-full md:w-56 shrink-0 md:border-r border-gold/15 md:pr-4 mb-6 md:mb-0">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <img
            src={adminLogo.light || logoUrl}
            alt="Dirham Genie"
            className="admin-logo-light h-14 w-14 rounded-full object-cover border-2 border-gold/30 lamp-glow shrink-0"
          />
          <img
            src={adminLogo.dark || adminLogo.light || logoUrl}
            alt="Dirham Genie"
            className="admin-logo-dark h-14 w-14 rounded-full object-cover border-2 border-gold/30 lamp-glow shrink-0"
          />
          <ThemeToggle />
        </div>
        <div className="hidden md:block">
          <div className="font-display text-xl gold-gradient-text leading-tight">Dirham Genie</div>
          <div className="text-xs text-cream/70 font-body mt-1">Admin Panel</div>
        </div>
      </div>
      <nav className="flex md:flex-col gap-2 flex-wrap">
        {visibleLinks.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm px-3 py-2 rounded-md transition-colors font-medium ${
                active
                  ? "bg-gold/15 text-gold"
                  : "text-cream/90 hover:bg-white/5 hover:text-gold"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="text-sm px-3 py-2 rounded-md text-cream/80 hover:text-red-500 hover:bg-red-500/10 text-left transition-colors font-medium"
        >
          Log Out
        </button>
        <Link
          href="/"
          className="text-sm px-3 py-2 rounded-md text-cream/70 hover:text-gold transition-colors font-medium"
        >
          &larr; View Site
        </Link>
      </nav>
    </aside>
  );
}