import { Suspense } from "react";
import ProductsPage from "@/app/components/ProductsListing";
import { ProductListingSkeleton } from "@/components/skeletons";

export default function ProductsRoute() {
  return (
    <Suspense fallback={<ProductListingSkeleton count={12} />}>
      <ProductsPage />
    </Suspense>
  );
}
