import { OrdersTableSkeleton } from "@/components/skeletons";
export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <OrdersTableSkeleton rows={10} />
    </div>
  );
}
