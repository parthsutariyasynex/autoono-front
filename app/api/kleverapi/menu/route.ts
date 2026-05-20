import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";
import fs from "fs";
import path from "path";

// Extracts a navigable path from an absolute Magento URL.
// Keeps the full pathname (including locale prefix) and only strips
// the .html extension so Next.js can route to the correct page.
//
// Examples:
//   "https://autoono-demo.btire.com/en/products?category=5" → "/en/products?category=5"
//   "https://autoono-demo.btire.com/en/all-tyres.html"      → "/en/all-tyres"
//   "https://autoono-demo.btire.com/ar/lubricants.html"     → "/ar/lubricants"
function magentoUrlToPath(url: string): string {
    if (!url) return "#";
    try {
        const parsed = new URL(url);
        const p = parsed.pathname.replace(/\.html$/, "");
        return (p || "#") + parsed.search;
    } catch {
        return url;
    }
}

// ── Cache helpers ────────────────────────────────────────────────────────────

const MENU_CACHE_TTL_MS = 60 * 60 * 1000; // 60 min in-memory
const FILE_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 h on disk

// In-memory layer (fast, resets on restart)
const menuCache = new Map<string, { items: any[]; expires: number }>();

// File-based layer (slow, survives restarts)
const FILE_CACHE_DIR = path.join(process.cwd(), ".cache", "menu");

function readFileCache(locale: string): any[] | null {
    try {
        const file = path.join(FILE_CACHE_DIR, `${locale}.json`);
        if (!fs.existsSync(file)) return null;
        const parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
        if (parsed.expires > Date.now() && Array.isArray(parsed.items) && parsed.items.length > 0) {
            return parsed.items;
        }
    } catch { }
    return null;
}

function writeFileCache(locale: string, items: any[]) {
    try {
        if (!fs.existsSync(FILE_CACHE_DIR)) {
            fs.mkdirSync(FILE_CACHE_DIR, { recursive: true });
        }
        const file = path.join(FILE_CACHE_DIR, `${locale}.json`);
        fs.writeFileSync(file, JSON.stringify({ items, expires: Date.now() + FILE_CACHE_TTL_MS }));
    } catch { }
}

// ── Service-account token ────────────────────────────────────────────────────

let serviceTokenCache: { token: string; expires: number } | null = null;
const SERVICE_TOKEN_TTL_MS = 50 * 60 * 1000;

/**
 * Returns a token for calling the menu API on behalf of unauthenticated users.
 * Tries (in order):
 *   1. MAGENTO_MENU_TOKEN  — a long-lived integration token you paste directly
 *   2. MAGENTO_SERVICE_EMAIL + MAGENTO_SERVICE_PASSWORD — dynamic login, cached 50 min
 */
async function getServiceToken(baseUrl: string): Promise<string | null> {
    if (process.env.MAGENTO_MENU_TOKEN) return process.env.MAGENTO_MENU_TOKEN;

    if (serviceTokenCache && serviceTokenCache.expires > Date.now()) {
        return serviceTokenCache.token;
    }

    const email = process.env.MAGENTO_SERVICE_EMAIL;
    const password = process.env.MAGENTO_SERVICE_PASSWORD;
    if (!email || !password) return null;

    try {
        const res = await fetch(`${baseUrl}/login/email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
            cache: "no-store",
        });
        if (!res.ok) {
            console.warn("[menu] Service account login failed:", res.status);
            return null;
        }
        const raw = await res.json();
        const token: string | null =
            typeof raw === "string" ? raw : (raw?.token ?? raw?.customer?.token ?? null);
        if (!token) return null;

        serviceTokenCache = { token, expires: Date.now() + SERVICE_TOKEN_TTL_MS };
        console.log("[menu] Service account token refreshed dynamically");
        return token;
    } catch (err: any) {
        console.error("[menu] Service account login error:", err.message);
        return null;
    }
}

// ── Menu item mapper ─────────────────────────────────────────────────────────

function mapMenuItem(item: any): any {
    const categoryId = item.category_id ?? item.categoryId ?? null;
    const mapped: any = {
        code: item.code,
        label: item.label,
        href: magentoUrlToPath(item.url || ""),
        magentoUrl: item.url || "",
        categoryId: categoryId != null ? String(categoryId) : null,
        sort_order: item.sort_order,
        is_visible: item.is_visible !== false,
    };
    if (Array.isArray(item.children) && item.children.length > 0) {
        mapped.children = item.children
            .filter((c: any) => c.is_visible !== false)
            .map(mapMenuItem);
    }
    return mapped;
}

function processRawItems(rawItems: any[]): any[] {
    return rawItems
        .filter((item: any) => item.is_visible !== false)
        .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
        .map(mapMenuItem);
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
    try {
        const BASE_URL = getBaseUrl(request);
        const xLocale = request.headers.get("x-locale") || "";
        const cacheKey = xLocale || "default";

        // ── 1. Resolve user token ──────────────────────────────────────────
        let token: string | null = null;

        const authHeader = request.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
            token = authHeader.substring(7).replace(/['"]/g, "").trim();
        }
        if (!token) {
            token = request.cookies.get("auth-token")?.value?.replace(/['"]/g, "").trim() || null;
        }
        if (!token || token === "null" || token === "undefined") {
            token = null;
        }

        // ── 2. No user token — try service account ─────────────────────────
        if (!token) {
            token = await getServiceToken(BASE_URL);
        }

        // ── 3. Still no token — serve from cache ───────────────────────────
        if (!token) {
            // 3a. In-memory cache
            const mem = menuCache.get(cacheKey);
            if (mem && mem.expires > Date.now()) {
                console.log(`[menu] No token — serving in-memory cache (locale=${cacheKey})`);
                return jsonResponse(mem.items);
            }

            // 3b. File cache (survives server restarts)
            const fileCached = readFileCache(cacheKey);
            if (fileCached) {
                console.log(`[menu] No token — serving file cache (locale=${cacheKey})`);
                // Promote to in-memory for subsequent requests this session
                menuCache.set(cacheKey, { items: fileCached, expires: Date.now() + MENU_CACHE_TTL_MS });
                return jsonResponse(fileCached);
            }

            // 3c. Try Magento as guest (some Klever API builds allow public catalog access)
            try {
                console.log("[menu] Attempting guest fetch from Magento...");
                const guestRes = await fetch(`${BASE_URL}/menu`, {
                    headers: { "Content-Type": "application/json" },
                    cache: "no-store",
                });
                if (guestRes.ok) {
                    const raw = await guestRes.json();
                    const items = processRawItems(Array.isArray(raw) ? raw : []);
                    if (items.length > 0) {
                        menuCache.set(cacheKey, { items, expires: Date.now() + MENU_CACHE_TTL_MS });
                        writeFileCache(cacheKey, items);
                        console.log(`[menu] Guest fetch succeeded — ${items.length} items`);
                        return jsonResponse(items);
                    }
                }
            } catch (guestErr: any) {
                console.warn("[menu] Guest fetch error:", guestErr.message);
            }

            console.warn("[menu] No token, no cache — returning empty menu");
            return jsonResponse([]);
        }

        // ── 4. Fetch from Magento with token ───────────────────────────────
        // Wrap fetch so network errors (timeout, DNS, ECONNREFUSED) are handled the
        // same as HTTP errors — both serve the cache instead of crashing to 500.
        let res: Response | null = null;
        try {
            res = await fetch(`${BASE_URL}/menu`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
            });
        } catch (networkErr: any) {
            console.warn("[menu] Magento fetch threw (network/timeout), serving cache:", networkErr.message);
        }

        if (!res || !res.ok) {
            // On HTTP error or network throw, serve cache rather than failing
            const mem = menuCache.get(cacheKey);
            if (mem && mem.expires > Date.now()) {
                console.log(`[menu] ${res ? res.status : "network error"} — serving in-memory cache (locale=${cacheKey})`);
                return jsonResponse(mem.items);
            }
            const fileCached = readFileCache(cacheKey);
            if (fileCached) {
                console.log(`[menu] ${res ? res.status : "network error"} — serving file cache (locale=${cacheKey})`);
                return jsonResponse(fileCached);
            }
            if (res) {
                const errBody = await res.text();
                console.error("[menu] Magento error:", res.status, errBody);
            }
            // Return empty menu instead of propagating the error so the navbar doesn't crash.
            return jsonResponse([]);
        }

        const data = await res.json();
        const items = processRawItems(Array.isArray(data) ? data : []);

        // Write to both caches so the login page can serve them even after a restart
        menuCache.set(cacheKey, { items, expires: Date.now() + MENU_CACHE_TTL_MS });
        writeFileCache(cacheKey, items);

        return jsonResponse(items);

    } catch (error: any) {
        console.error("[menu] Route error:", error.message);
        return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 });
    }
}

function jsonResponse(items: any[]) {
    return new Response(JSON.stringify(items), {
        headers: {
            "Content-Type": "application/json",
            // Browser caches for 5 min, serves stale for up to 1h while revalidating.
            // Server already has a 60-min in-memory cache — browser round-trips are the bottleneck.
            "Cache-Control": "private, max-age=300, stale-while-revalidate=3600",
        },
    });
}
