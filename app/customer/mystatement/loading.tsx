import { StatementSkeleton, SidebarSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 w-full">
        <SidebarSkeleton />
        <StatementSkeleton />
      </div>
    </div>
  );
}
