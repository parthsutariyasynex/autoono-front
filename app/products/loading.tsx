import { ProductListingSkeleton } from "@/components/skeletons";
export default function Loading() {
  return (
    <div className="flex-1 px-4 py-4">
      <ProductListingSkeleton count={12} />
    </div>
  );
}
