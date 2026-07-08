import AdminSidebar from "@/components/AdminSidebar";

export default function AdminDashboardLayout({ children }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6">
      <AdminSidebar />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
