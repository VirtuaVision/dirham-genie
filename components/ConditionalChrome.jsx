"use client";

import { usePathname } from "next/navigation";

// Wraps the public Header/Footer so they never render on /admin routes
// (login page included) — the admin panel has its own AdminSidebar nav
// and doesn't need the public search bar, category links, etc.
export default function ConditionalChrome({ children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) return null;
  return children;
}