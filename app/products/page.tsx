import { Suspense } from "react";
import ProductsPage from "@/app/components/ProductsListing";

function LoadingFallback() {
  return (
    <div className="flex-1 flex items-center justify-center py-24">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-100 border-t-primary" />
    </div>
  );
}

export default function ProductsRoute() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ProductsPage />
    </Suspense>
  );
}
