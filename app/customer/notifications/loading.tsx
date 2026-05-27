import { NotificationsSkeleton } from "@/components/skeletons";

// NotificationsSkeleton already renders the full page layout
// (sidebar + main + title + table card + pagination). Wrapping it in
// max-w-3xl/centered offset the layout from the real page.
export default function Loading() {
  return <NotificationsSkeleton count={8} />;
}
