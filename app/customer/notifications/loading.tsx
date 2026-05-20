import { NotificationsSkeleton } from "@/components/skeletons";
export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <NotificationsSkeleton count={8} />
    </div>
  );
}
