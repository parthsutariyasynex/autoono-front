import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl, getLocaleFromRequest } from "@/lib/api/magento-url";

/**
 * TEST endpoint — hit /api/test-locale to see what locale the API route receives.
 * DELETE this file after debugging.
 */
export async function GET(request: NextRequest) {
    const xLocaleHeader = request.headers.get("x-locale");
    const cookieValue = request.cookies.get("NEXT_LOCALE")?.value;
    const resolvedLocale = getLocaleFromRequest(request);
    const magentoUrl = getBaseUrl(request);

    const result = {
        "x-locale-header": xLocaleHeader,
        "NEXT_LOCALE-cookie": cookieValue,
        "resolved-locale": resolvedLocale,
        "magento-base-url": magentoUrl,
        "all-headers": Object.fromEntries(request.headers.entries()),
    };

    console.log("[test-locale]", JSON.stringify(result, null, 2));

    return NextResponse.json(result);
}
