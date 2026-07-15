"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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
  { href: "/admin/sync-logs", label: "Sync Logs" },
  { href: "/admin/team", label: "Team Access" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="w-full md:w-56 shrink-0 md:border-r border-gold/15 md:pr-4 mb-6 md:mb-0">
      <div className="font-display text-lg text-gold mb-6 hidden md:block">
        Dirham Genie
        <div className="text-xs text-cream/40 font-body">Admin Panel</div>
      </div>
      <nav className="flex md:flex-col gap-2 flex-wrap">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm px-3 py-2 rounded-md transition-colors ${
                active
                  ? "bg-gold/15 text-gold"
                  : "text-cream/70 hover:bg-white/5 hover:text-gold"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="text-sm px-3 py-2 rounded-md text-cream/60 hover:text-red-300 hover:bg-red-500/10 text-left transition-colors"
        >
          Log Out
        </button>
        <Link
          href="/"
          className="text-sm px-3 py-2 rounded-md text-cream/40 hover:text-gold transition-colors"
        >
          &larr; View Site
        </Link>
      </nav>
    </aside>
  );
}
