import { OrderAttachmentsSkeleton, SidebarSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col lg:flex-row flex-1 min-h-0 w-full bg-[#fcfcfc]">
      <SidebarSkeleton />
      <OrderAttachmentsSkeleton rows={8} />
    </div>
  );
}
