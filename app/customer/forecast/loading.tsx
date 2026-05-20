import { ForecastSkeleton } from "@/components/skeletons";
export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <ForecastSkeleton rows={8} />
    </div>
  );
}
