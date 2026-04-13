import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";

export default async function Home() {
  const headerList = await headers();
  const cookieList = await cookies();

  // Use locale from header (set by middleware) or cookie
  const locale = headerList.get("x-locale") || cookieList.get("NEXT_LOCALE")?.value || "en";

  // Redirect to products. Middleware will handle auth check for /products.
  redirect(`/${locale}/products`);
}