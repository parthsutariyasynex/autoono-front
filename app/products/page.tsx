import { Suspense } from "react";
import ProductsPage from "@/app/components/ProductsListing";
import { ProductListingSkeleton } from "@/components/skeletons";

export default function ProductsRoute() {
  return (
    <Suspense fallback={<div className="flex-1 px-4 py-4"><ProductListingSkeleton count={12} /></div>}>
      <ProductsPage />
    </Suspense>
  );
}
