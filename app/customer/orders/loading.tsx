import { OrdersTableSkeleton, SidebarSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="flex flex-1 min-h-0 w-full px-4 md:px-8 py-6 md:py-10">
        <div className="flex flex-1 flex-col lg:flex-row gap-6 md:gap-10 items-start w-full">
          <SidebarSkeleton />
          <main className="flex-1 w-full min-w-0">
            <OrdersTableSkeleton rows={8} />
          </main>
        </div>
      </div>
    </div>
  );
}
