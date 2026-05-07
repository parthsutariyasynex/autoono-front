import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export function checkAuth(router: AppRouterInstance): boolean {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return false;
    }
    return true;
  }
  return false;
}
