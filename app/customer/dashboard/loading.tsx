import { DashboardSkeleton, SidebarSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0">
      <SidebarSkeleton />
      <DashboardSkeleton />
    </div>
  );
}
