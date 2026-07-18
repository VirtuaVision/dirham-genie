import AdminSidebar from "@/components/AdminSidebar";
import { getSiteSetting } from "@/lib/siteSettings";

// Admin pages are personalized/auth-gated and should never be served from
// a stale cache — without this, a background image saved in Site Settings
// could keep showing the old (or no) image for other visits/deployments.
export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }) {
  const [bgLight, bgDark] = await Promise.all([
    getSiteSetting("admin_inner_bg_light", ""),
    getSiteSetting("admin_inner_bg_dark", ""),
  ]);

  return (
    <div
      className="admin-bg-layer border-b border-gold/15 bg-ink"
      style={{
        "--admin-bg-light": bgLight ? `url(${bgLight})` : "none",
        "--admin-bg-dark": bgDark ? `url(${bgDark})` : "none",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6">
        <AdminSidebar />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
