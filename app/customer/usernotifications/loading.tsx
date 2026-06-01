import { NotificationsSkeleton } from "@/components/skeletons";

// NotificationsSkeleton already renders the full page layout
// (sidebar + main + title + table card + pagination). Wrapping it again would
// double-nest the layout — render it directly, same as /customer/notifications.
export default function Loading() {
  return <NotificationsSkeleton count={8} />;
}
