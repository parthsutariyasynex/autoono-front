import { redirect } from "next/navigation";

export default function Home() {
  // Middleware redirects / → /en, so this is a fallback
  redirect("/en/login");
}