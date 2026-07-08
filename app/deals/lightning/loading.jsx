import ProductGridSkeleton from "@/components/ProductGridSkeleton";

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
      <div className="h-8 bg-white/5 rounded w-1/3 animate-pulse" />
      <div className="h-4 bg-white/5 rounded w-1/4 animate-pulse" />
      <ProductGridSkeleton />
    </div>
  );
}
