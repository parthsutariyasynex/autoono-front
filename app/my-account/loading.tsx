import { AccountSkeleton, SidebarSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col w-full bg-surfacePage">
      <div className="flex flex-col lg:flex-row flex-1 w-full">
        <SidebarSkeleton />
        <AccountSkeleton />
      </div>
    </div>
  );
}
