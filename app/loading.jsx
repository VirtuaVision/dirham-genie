import ProductGridSkeleton from "@/components/ProductGridSkeleton";

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      <div className="h-10 bg-white/5 rounded w-2/3 mx-auto animate-pulse" />
      <div className="h-4 bg-white/5 rounded w-1/2 mx-auto animate-pulse" />
      <ProductGridSkeleton />
    </div>
  );
}
