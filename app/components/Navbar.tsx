"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { handleGlobalLogout } from "@/lib/auth/logout-helper";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { useState, useRef, useEffect } from "react";
import {
  ShoppingCart,
  UserCircle,
  Bell,
  Menu,
  X,
  LogOut,
  Search,
  ChevronDown,
} from "lucide-react";

import CartDrawer from "./CartDrawer";
import NotificationDrawer from "./NotificationDrawer";
import SearchPopup from "./SearchPopup";

import { useCart } from "@/modules/cart/hooks/useCart";
import { useNotifications } from "@/modules/notifications/hooks/useNotifications";
import { fetchCustomerInfo } from "@/store/actions/customerActions";

import { useTranslation } from "@/hooks/useTranslation";
import { useLocalePath } from "@/hooks/useLocalePath";
import { isValidLocale } from "@/lib/i18n/config";
import { setLocaleCookie } from "@/lib/i18n/client";

interface NavLink {
  label: string;
  href: string;
  code?: string;
  magentoUrl?: string;
  categoryId?: string | null;
  children?: { label: string; href: string }[];
}

// Any nav item that has a categoryId shows the warehouse dropdown on hover.
function isWarehouseCategory(item: { label?: string; categoryId?: string | null }): boolean {
  const label = (item.label || "").toLowerCase();
  // Show warehouse dropdown for items with categoryId OR specific keywords
  return !!item.categoryId || label.includes("lubricant") || label.includes("tyre");
}

// Warehouse item shape — populated dynamically from /api/kleverapi/source-permission
interface WarehouseItem { label: string; code: string; storeUrl: string; name: string; }

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, isRtl, i18n } = useTranslation();
  const locale = i18n.language;
  const lp = useLocalePath();

  // Store code lives in the URL path prefix (e.g. /V101_en/all-tyres) — not a query param.
  // Fall back to ?store= for any legacy URLs that still carry it.
  const STORE_CODE_RE = /^[A-Za-z0-9]+_(en|ar)$/;
  const pathnameFirstSeg = pathname?.split("/").filter(Boolean)[0] || "";
  const currentStore = (STORE_CODE_RE.test(pathnameFirstSeg) || isValidLocale(pathnameFirstSeg))
    ? pathnameFirstSeg
    : (searchParams?.get("store") || "");

  // Strip locale or store-code prefix from a path for prefix-agnostic comparison.
  const stripPrefix = (path: string) => {
    const segs = (path || "").split("/").filter(Boolean);
    const first = segs[0] || "";
    if (isValidLocale(first) || STORE_CODE_RE.test(first)) return "/" + segs.slice(1).join("/") || "/";
    return path || "/";
  };

  // Extract the relative path from a full store_url (e.g. https://domain.com/V101_en/all-tyres.html → /V101_en/all-tyres.html)
  const getStoreUrlPath = (storeUrl: string): string => {
    try {
      return new URL(storeUrl).pathname;
    } catch {
      return storeUrl;
    }
  };
  const isAuthenticated = status === "authenticated";
  const { cart, refetchCart } = useCart();
  const [navLinks, setNavLinks] = useState<NavLink[]>([]);
  const [navLoading, setNavLoading] = useState(true);
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [allPermittedStores, setAllPermittedStores] = useState<any[]>([]);
  const [storeDropOpen, setStoreDropOpen] = useState(false);
  const storeDropRef = useRef<HTMLDivElement>(null);
  const [openWarehouseMenu, setOpenWarehouseMenu] = useState<string | null>(null);

  const { data: customerData } = useSelector((state: RootState) => state.customer);
  const dispatch = useDispatch();

  const isLoadingName = isAuthenticated && !customerData;
  const displayUser = isLoadingName
    ? ""
    : (customerData as any)?.firstname
      ? `${(customerData as any).firstname} ${(customerData as any).lastname || ""}`.trim()
      : session?.user?.name || session?.user?.email;


  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [storeName, setStoreName] = useState<string>("");

  const [subAccountName, setSubAccountName] = useState<string | null>(null);
  const [isSubAccount, setIsSubAccount] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { unreadCount, fetchNotifications: pullNotifications } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const logoutCalledRef = useRef(false);

  const cartCount = cart?.items_count || 0;

  const handleLogout = async () => {
    await handleGlobalLogout(lp("/login"));
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSubAccountName(localStorage.getItem("subAccountName"));
      setIsSubAccount(localStorage.getItem("isSubAccount") === "true");
    }
  }, [pathname]);

  useEffect(() => {
    if (status === "authenticated") {
      const sess = session as any;
      if (sess?.error === "MagentoTokenExpired" && !logoutCalledRef.current) {
        logoutCalledRef.current = true;
        handleLogout();
      }
    }
    // Reset guard when session becomes valid again (fresh login)
    if (status !== "authenticated") {
      logoutCalledRef.current = false;
    }
  }, [status, session]);

  useEffect(() => {
    if (isAuthenticated) {
      pullNotifications();
      if (!customerData) dispatch(fetchCustomerInfo() as any);
    }
  }, [isAuthenticated, pullNotifications, customerData, dispatch]);

  useEffect(() => {
    const fn = () => pullNotifications();
    window.addEventListener("notifications-updated", fn);
    return () => window.removeEventListener("notifications-updated", fn);
  }, [pullNotifications]);

  useEffect(() => {
    const fn = () => refetchCart();
    window.addEventListener("cart-updated", fn);
    return () => window.removeEventListener("cart-updated", fn);
  }, [refetchCart]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (storeDropRef.current && !storeDropRef.current.contains(e.target as Node))
        setStoreDropOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update document title and sync storeName state
  useEffect(() => {
    const found = warehouseItems.find(w => w.code === currentStore);
    // Strictly use found.name (Store Name e.g. "Arabic") as primary
    const displayName = found ? (found.name || found.label) : (typeof sessionStorage !== "undefined" ? sessionStorage.getItem(`storeName_${currentStore}`) : null) || currentStore;
    setStoreName(displayName);

    if (displayName && displayName !== currentStore) {
      document.title = `AutoOno - ${displayName}`;
    }

    // Pre-cache all names to ensure they are ready when clicking/navigating
    if (warehouseItems.length > 0 && typeof sessionStorage !== "undefined") {
      warehouseItems.forEach(w => {
        sessionStorage.setItem(`storeName_${w.code}`, w.name || w.label);
      });
    }
  }, [currentStore, warehouseItems]);

  // Fetch dynamic menu from API (re-fetches when locale changes)
  useEffect(() => {
    let cancelled = false;

    const CACHE_KEY = `navmenu_${locale}`;
    const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 h

    const toLinks = (raw: any[]): NavLink[] =>
      raw.map((item: any) => ({
        label: item.label,
        href: item.href,
        code: item.code,
        magentoUrl: item.magentoUrl,
        categoryId: item.categoryId ?? null,
        children: item.children && item.children.length > 0 ? item.children : undefined,
      }));

    const applyLinks = (links: NavLink[]) => {
      setNavLinks(links);
      const firstCat = links.find((l) => l.categoryId);
      if (firstCat?.categoryId && typeof sessionStorage !== "undefined") {
        sessionStorage.setItem("defaultCategoryId", firstCat.categoryId);
      }
    };

    const readLocalCache = (): NavLink[] | null => {
      try {
        const raw = typeof window !== "undefined" ? localStorage.getItem(CACHE_KEY) : null;
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed.expires > Date.now() && Array.isArray(parsed.items) && parsed.items.length > 0)
          return parsed.items;
      } catch { }
      return null;
    };

    const fetchMenu = async () => {
      // Immediately show cached data so menu appears before API responds
      const localCached = readLocalCache();
      if (localCached) {
        applyLinks(localCached);
        setNavLoading(false);
      } else {
        setNavLoading(true);
      }

      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

        const res = await fetch("/api/kleverapi/menu", {
          headers: {
            "Content-Type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` }),
            "x-locale": locale,
          },
        });

        if (cancelled) return;

        if (!res.ok) {
          throw new Error("Menu fetch failed");
        }

        const data = await res.json();
        if (cancelled) return;

        if (Array.isArray(data) && data.length > 0) {
          const links = toLinks(data);
          applyLinks(links);
          // Save fresh data to localStorage for future page loads
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ items: links, expires: Date.now() + CACHE_TTL }));
          } catch { }
        } else if (!localCached) {
          setNavLinks([]);
        }
      } catch (err) {
        console.error("[Navbar] Menu fetch error:", err);
        // Keep the locally-cached links if we had them; only clear if nothing
        if (!cancelled && !localCached) setNavLinks([]);
      } finally {
        if (!cancelled) setNavLoading(false);
      }
    };

    fetchMenu();
    return () => { cancelled = true; };
  }, [locale]);

  // Fetch warehouse list for the "All Lubricants"/"All Tyres" dropdown.
  // Matches the live Magento site — enabled/disabled by admin via source-permission.
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    let cancelled = false;
    (async () => {
      try {
        // Use `locale` state directly — see menu-fetch comment above.
        const res = await fetch("/api/kleverapi/source-permission", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "x-locale": locale,
          },
        });
        if (!res.ok) {
          if (res.status === 401) {
            setWarehouseItems([]);
            setAllPermittedStores([]);
            return;
          }
          throw new Error("source-permission fetch failed");
        }
        const data = await res.json();
        if (cancelled) return;
        if (process.env.NODE_ENV !== "production") {
          console.log("[Navbar] source-permission raw response:", data);
        }
        const raw: any[] = Array.isArray(data?.permitted_stores)
          ? data.permitted_stores
          : (Array.isArray(data) ? data : []);

        setAllPermittedStores(raw);

        // Show stores matching the current locale for the nav hover dropdown.
        const filtered = raw.filter((s) =>
          s?.is_active !== false &&
          (String(s.store_code).endsWith(`_${locale}`) || String(s.store_code) === locale)
        );

        // Map stores to WarehouseItem shape.
        const mapped: WarehouseItem[] = filtered.map((s) => {
          const storeCode = String(s.store_code ?? "");
          console.log("[Navbar] warehouse store_url:", s.store_url, "store_code:", storeCode);
          return {
            label: String(s.group_name || s.store_name || s.website_name || ""),
            code: storeCode,
            storeUrl: String(s.store_url ?? ""),
            name: String(s.store_name || ""),
          };
        }).filter((w) => !!w.label);

        setWarehouseItems(mapped);
        // We no longer automatically set a 'defaultStoreCode' from the first warehouse.
        // This prevents users from being forced into a specific store (like Anwar Khaled)
        // when they haven't explicitly chosen one.
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[Navbar] source-permission/stores fetch failed:", err);
        }
        if (!cancelled) setWarehouseItems([]);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, locale]);

  // Resolve the display label for a menu item in the following precedence:
  //   1. code → CODE_TO_TRANSLATION_KEY (most stable across locales)
  //   2. href → HREF_TO_TRANSLATION_KEY (fallback for APIs that don't return code)
  //   3. raw item.label from the API (may be stale-locale text)
  // This runs at render time, so toggling /en ↔ /ar re-renders labels instantly
  // without waiting for the menu re-fetch to complete.
  const resolveLabel = (item: { code?: string; href?: string; label?: string }): string => {
    return item.label || "";
  };



  return (
    <>
      <div className={`main-header w-full ${isScrolled ? 'fixed fadeInDown' : 'relative'} top-0 left-0 right-0 z-[60] flex flex-col transition-[box-shadow,background-color] duration-300 ease-in-out`} style={{ paddingRight: isScrolled ? "var(--scrollbar-width)" : "0px" }}>

        {/* ── HEADER ── */}
        <header className="bg-white border-b border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="relative flex items-center justify-between h-[56px] sm:h-[64px] lg:h-[72px] px-3 sm:px-5 lg:px-8 xl:px-14">

            {/* LEFT: BTIRE logo */}
            <Link href={lp("/")} className="flex items-center flex-shrink-0 z-10">
              <img
                src="/logo/btire-logo-horizontal.svg"
                alt="BTIRE Logo"
                className="h-6 sm:h-8 lg:h-10 w-auto"
              />
            </Link>

            {/* CENTER: Bridgestone logo — flex center on mobile, absolute center on md+ */}
            <div className="flex-1 flex items-center justify-center min-w-0 px-2 lg:px-0 lg:absolute lg:inset-0 lg:pointer-events-none">
              <Link href={lp("/")} className="flex-shrink-0 lg:pointer-events-auto">
                <img
                  src="/logo/auttono-logo.jpg"
                  alt="AL TALAYI KSA"
                  className="h-[24px] sm:h-[32px] lg:h-[42px] xl:h-[50px] w-auto object-contain"
                />
              </Link>
            </div>

            {/* RIGHT: Actions */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-5 flex-shrink-0 z-10">



              {/* Welcome badge & Account Dropdown — md+ */}
              {isAuthenticated && !isLoadingName && pathname !== "/login" && (
                <div className="relative hidden lg:block" ref={dropdownRef}>
                  <div
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-1.5 lg:gap-2 bg-white border border-gray-100 rounded-full px-1.5 lg:px-3 py-1 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.12)] hover:shadow-md transition-shadow group cursor-pointer"
                  >
                    <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center flex-shrink-0 transition-transform">
                      <UserCircle size={16} strokeWidth={2.5} className="text-white" />
                    </div>
                    <div className="flex flex-col min-w-0 pr-1 rtl:pr-0 rtl:pl-1">
                      <span className="hidden lg:block text-[8px] text-black/50 font-semibold uppercase tracking-widest leading-none">{t("nav.welcomeBack")}</span>
                      <span className="text-body text-black font-semibold tracking-tighter leading-snug mt-0.5 truncate max-w-[80px] lg:max-w-[140px]">
                        {isSubAccount && subAccountName ? subAccountName : displayUser}
                      </span>
                    </div>

                  </div>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-sm shadow-2xl border border-gray-200 py-1 z-[100]" dir={isRtl ? "rtl" : "ltr"}>
                      <Link
                        href={lp("/my-account")}
                        className="block px-4 py-2.5 text-body font-semibold text-black hover:bg-gray-50 transition-colors ltr:text-left rtl:text-right"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        {t("nav.myAccount")}
                      </Link>
                      {isSubAccount && (
                        <Link
                          href={lp("/my-account")}
                          className="block px-4 py-2.5 text-body font-semibold text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100 ltr:text-left rtl:text-right"
                          onClick={() => {
                            setIsProfileOpen(false);
                            localStorage.removeItem("subAccountToken");
                            localStorage.removeItem("subAccountName");
                            localStorage.removeItem("subAccountId");
                            localStorage.removeItem("isSubAccount");
                            setSubAccountName(null);
                            setIsSubAccount(false);
                          }}
                        >
                          {t("nav.backToMainAccount")}
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full ltr:text-left rtl:text-right px-4 py-2.5 text-body font-semibold text-black hover:bg-gray-50 transition-colors cursor-pointer border-t border-gray-100"
                      >
                        {t("nav.signOut")}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Store Switcher — fully dynamic from permitted_stores API */}
              {isAuthenticated && pathname !== "/login" && currentStore && allPermittedStores.length > 0 && (
                <div className="hidden lg:block" ref={storeDropRef}>
                  {(() => {
                    // 1. Find the current store entry from the API
                    const currentEntry = allPermittedStores.find(
                      (s) => String(s.store_code) === currentStore
                    );
                    if (!currentEntry) return null;

                    // 2. Derive opposite store code from the store_code suffix (no hardcoded names)
                    const oppositeCode = currentStore.endsWith("_en")
                      ? currentStore.replace(/_en$/, "_ar")
                      : currentStore.endsWith("_ar")
                        ? currentStore.replace(/_ar$/, "_en")
                        : currentStore === "en" ? "ar" : "en";

                    // 3. Find opposite store — if not in permitted list, hide button
                    const oppositeEntry = allPermittedStores.find(
                      (s) => String(s.store_code) === oppositeCode
                    );
                    if (!oppositeEntry) return null;

                    // 4. Label — locale-only stores (en/ar): show opposite store_name so user
                    //    knows what they are switching TO (e.g. on "en" → show "Arabic").
                    //    Warehouse stores (V101_en etc.): show current store_name as identifier.
                    const isLocaleOnly = isValidLocale(currentStore);
                    const buttonLabel = isLocaleOnly
                      ? String(oppositeEntry.store_name || oppositeCode)
                      : String(currentEntry.store_name || currentStore);

                    // 5. Build href using store_url from API as the path prefix
                    const getStorePath = (url: string): string => {
                      try { return new URL(url).pathname.replace(/\/$/, ""); } catch { return ""; }
                    };
                    const oppositeBasePath = getStorePath(oppositeEntry.store_url) || `/${oppositeCode}`;
                    const cleanCurrentPath = stripPrefix(pathname || "/").replace(/\.html$/, "") || "/";
                    const seoCurrentPath = cleanCurrentPath === "/" ? "" : `${cleanCurrentPath}.html`;
                    const href = `${oppositeBasePath}${seoCurrentPath}` || "/";

                    // 6. Locale for i18n cookie — derived from store_code suffix only
                    const targetLocale = (oppositeCode.endsWith("_ar") || oppositeCode === "ar") ? "ar" : "en";

                    return (
                      <Link
                        href={href}
                        onClick={() => {
                          setLocaleCookie(targetLocale);
                          i18n.changeLanguage(targetLocale);
                        }}
                        className="flex items-center gap-1.5 rounded px-3 py-1.5 text-body font-semibold text-black hover:bg-gray-50 transition-colors"
                        title={`Switch to ${oppositeEntry.store_name || oppositeCode}`}
                      >
                        <span>{buttonLabel}</span>
                      </Link>
                    );
                  })()}
                </div>
              )}

              {/* Search Icon */}
              {isAuthenticated && pathname !== "/login" && (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="hidden lg:flex relative cursor-pointer hover:opacity-70 transition-opacity items-center justify-center -mb-1 focus:outline-none"
                  aria-label="Search"
                >
                  <Search size={22} stroke="black" strokeWidth={1.5} />
                </button>
              )}




              {/* Notification Bell */}
              {isAuthenticated && pathname !== "/login" && (

                <button
                  className="hidden lg:flex relative cursor-pointer items-center justify-center"
                  onClick={() => setIsNotificationOpen(true)}
                  aria-label="Notifications"
                >
                  <Bell size={24} fill="black" stroke="black" strokeWidth={1} />
                  {unreadCount > 0 && (
                    <span className="absolute w-[20px] h-[20px] lg:w-[26px] lg:h-[26px] font-semibold text-micro lg:text-body -top-[10px] lg:-top-[13px] -right-[6px] lg:-right-[14px] bg-primary text-black flex items-center justify-center rounded-full border border-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
              )}

              {/* Cart */}
              {isAuthenticated && pathname !== "/login" && (
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative text-black cursor-pointer pr-2 md:pr-0"
                  aria-label="Shopping Cart"
                >
                  <ShoppingCart size={24} strokeWidth={1.5} />
                  {cartCount > 0 && (
                    <span className="absolute w-[20px] h-[20px] lg:w-[26px] lg:h-[26px] font-semibold text-micro lg:text-body -top-[10px] -right-[6px] lg:-right-[14px] bg-primary text-white flex items-center justify-center rounded-full border border-white">
                      {cartCount}
                    </span>
                  )}
                </button>
              )}



              {/* Mobile hamburger */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden text-black hover:opacity-70 transition-opacity cursor-pointer"
                aria-label="Toggle Menu"
              >
                {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </header>

        {/* ── YELLOW NAV BAR — desktop only ── */}
        <nav className="bg-primary w-full hidden lg:block">
          <div className="flex items-center justify-center w-full px-2 lg:px-4">
            {navLoading ? (
              <div className="flex items-center gap-6">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-3 w-20 bg-primary/40 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              navLinks.map((item) => {
                const isWarehouse = isWarehouseCategory(item);
                // Strip prefix/extension, rebuild as /{storeOrLocale}/{path}.html
                let cleanItemPath = stripPrefix(item.href.split("?")[0] || "/").replace(/\.html$/, "") || "/";
                let seoItemPath = cleanItemPath === "/" ? cleanItemPath : `${cleanItemPath}.html`;

                // On locale-only pages (e.g. /en/my-account), currentStore is "en"/"ar".
                // We use the current store or fall back to the locale.
                // We avoid forcing a warehouse code if the user hasn't picked one.
                const prefix = currentStore || locale;
                const href = `/${prefix}${seoItemPath}`;

                const strippedPathname = stripPrefix(pathname || "");
                const isActive = strippedPathname === cleanItemPath || strippedPathname.startsWith(cleanItemPath + "/");
                const children = isWarehouse ? undefined : item.children;
                const hasChildren = (isWarehouse && warehouseItems.length > 0) || !!(children && children.length > 0);

                const isOpen = openWarehouseMenu === item.href;
                return (
                  <div
                    key={item.href}
                    className="relative h-full"
                    onMouseEnter={() => hasChildren && setOpenWarehouseMenu(item.href)}
                    onMouseLeave={() => setOpenWarehouseMenu(null)}
                  >
                    <Link
                      href={href}
                      className={`py-3 flex items-center h-full px-2.5 lg:px-7 text-body font-semibold capitalize transition-all duration-200 whitespace-nowrap ${isActive
                        ? "bg-black text-white"
                        : "text-white hover:bg-black hover:text-white"
                        }`}
                    >
                      {resolveLabel(item)}
                    </Link>

                    {/* Warehouse dropdown — hover-based via React state (no CSS gap issue) */}
                    {hasChildren && isOpen && (
                      <div className="absolute top-full left-0 w-56 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] z-[100]">
                        <div className="flex flex-col py-1">
                          {isWarehouse
                            ? [...warehouseItems]
                              .sort((a, b) => {
                                if (a.code === currentStore) return -1;
                                if (b.code === currentStore) return 1;
                                return 0;
                              })
                              .map((w) => {
                                const isSelected = currentStore === w.code;
                                // Use the category's path (item.href) instead of the current pathname
                                // so that clicking a warehouse under 'Lubricants' actually takes you to Lubricants.
                                const targetCategoryPath = stripPrefix(item.href || "/").replace(/\.html$/, "") || "/";
                                const seoCategoryPath = targetCategoryPath === "/" ? "" : `${targetCategoryPath}.html`;
                                const wLocale = w.code.endsWith("_ar") ? "ar" : "en";
                                const warehouseHref = `/${w.code}${seoCategoryPath}`;

                                return (
                                  <Link
                                    key={w.code}
                                    href={warehouseHref}
                                    onClick={() => {
                                      setLocaleCookie(wLocale);
                                      i18n.changeLanguage(wLocale);
                                      document.cookie = `NEXT_STORE=${w.code};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
                                      setOpenWarehouseMenu(null);
                                    }}
                                    className={`text-start px-6 py-2.5 text-body font-semibold transition-colors cursor-pointer ${isSelected ? "bg-primary/10 text-primary" : "text-black hover:bg-gray-50"}`}
                                  >
                                    {w.label}
                                  </Link>
                                );
                              })
                            : children?.map((child, idx) => {
                              const childPath = stripPrefix(child.href.split("?")[0] || "/").replace(/\.html$/, "") || "/";
                              const childSeoPath = childPath === "/" ? childPath : `${childPath}.html`;
                              const childHref = `/${currentStore || locale}${childSeoPath}`;
                              return (
                                <Link
                                  key={idx}
                                  href={childHref}
                                  onClick={() => setOpenWarehouseMenu(null)}
                                  className="px-6 py-2.5 text-body font-semibold text-black hover:bg-gray-50 transition-colors"
                                >
                                  {child.label}
                                </Link>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </nav>

        {/* ── MOBILE DRAWER ── */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-[56px] sm:top-[64px] left-0 w-full bg-white shadow-2xl z-40 border-t border-gray-100 animate-in slide-in-from-top duration-200">
            <div className="flex flex-col py-2">

              {/* User info */}
              {isAuthenticated && pathname !== "/login" && (
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 mb-1">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-micro text-black/50 font-semibold uppercase tracking-widest leading-none">{t("nav.loggedInAs")}</span>
                      <span className="text-body text-black font-semibold uppercase truncate tracking-tight">
                        {isSubAccount && subAccountName ? subAccountName : displayUser}
                      </span>
                      {storeName && storeName !== currentStore && (
                        <span className="text-[10px] text-primary font-bold uppercase mt-1 leading-none">{storeName}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Nav links */}
              <div className="px-4 py-2">
                <span className="text-micro font-bold text-black/50 uppercase tracking-[0.2em] block mb-2">{t("nav.navigation")}</span>
                {navLinks.map((item) => {
                  const isWarehouse = isWarehouseCategory(item);
                  // Strip prefix/extension, rebuild as /{storeOrLocale}/{path}.html
                  let cleanItemPath = stripPrefix(item.href.split("?")[0] || "/").replace(/\.html$/, "") || "/";
                  let seoItemPath = cleanItemPath === "/" ? cleanItemPath : `${cleanItemPath}.html`;

                  const prefix = currentStore || locale;
                  const href = `/${prefix}${seoItemPath}`;

                  const strippedPathname = stripPrefix(pathname || "");
                  const isActive = strippedPathname === cleanItemPath || strippedPathname.startsWith(cleanItemPath + "/");
                  return (
                    <div key={item.href}>
                      <Link
                        href={href}
                        className={`py-2.5 text-body font-semibold uppercase tracking-wide flex items-center justify-between group ${isActive ? "text-primary" : "text-black hover:text-primary"
                          }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {resolveLabel(item)}
                        <span className="text-black/40 group-hover:text-primary transition-colors text-caption">→</span>
                      </Link>
                      {isWarehouse && warehouseItems.length > 0 && (
                        <div className="pl-3 border-l-2 border-gray-100 ml-1 mb-1">
                          {[...warehouseItems]
                            .sort((a, b) => {
                              if (a.code === currentStore) return -1;
                              if (b.code === currentStore) return 1;
                              return 0;
                            })
                            .map((w) => {
                              const isSelected = currentStore === w.code;
                              // Use the category's path (item.href) instead of the current pathname
                              const targetCategoryPathM = stripPrefix(item.href || "/").replace(/\.html$/, "") || "/";
                              const seoCategoryPathM = targetCategoryPathM === "/" ? "" : `${targetCategoryPathM}.html`;
                              const mLocale = w.code.endsWith("_ar") ? "ar" : "en";
                              const warehouseHref = `/${w.code}${seoCategoryPathM}`;

                              return (
                                <Link
                                  key={w.code}
                                  href={warehouseHref}
                                  onClick={() => {
                                    setLocaleCookie(mLocale);
                                    i18n.changeLanguage(mLocale);
                                    document.cookie = `NEXT_STORE=${w.code};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
                                    setIsMenuOpen(false);
                                  }}
                                  className={`block w-full text-start py-2 text-label font-semibold cursor-pointer ${isSelected ? "text-primary" : "text-black/70 hover:text-primary"}`}
                                >
                                  {w.label}
                                </Link>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quick actions */}
              <div className="px-4 py-3 mt-1 border-t border-gray-100">
                <span className="text-micro font-bold text-black/50 uppercase tracking-[0.2em] block mb-2">{t("nav.quickActions")}</span>

                {isAuthenticated && pathname !== "/login" && (
                  <>
                    <button
                      onClick={() => { setIsSearchOpen(true); setIsMenuOpen(false); }}
                      className="py-2.5 text-body font-semibold text-black/80 flex items-center gap-3 w-full text-start"
                    >
                      <Search size={16} /> {t("nav.searchProducts") || "Search Products"}
                    </button>

                    <button
                      onClick={() => { setIsNotificationOpen(true); setIsMenuOpen(false); }}
                      className="py-2.5 text-body font-semibold text-black/80 flex items-center gap-3 w-full"
                    >
                      <Bell size={16} /> {t("nav.notifications")} ({unreadCount})
                    </button>
                    <Link href={lp("/my-account")} className="py-2.5 text-body font-semibold text-black/80 flex items-center gap-3" onClick={() => setIsMenuOpen(false)}>

                      <UserCircle size={16} /> {t("nav.myAccount")}
                    </Link>
                  </>
                )}


                {isAuthenticated && pathname !== "/login" && (
                  <button
                    onClick={handleLogout}
                    className="py-2.5 mt-2 text-body font-semibold text-red-600 flex items-center gap-3 border-t border-gray-100 w-full pt-3"
                  >
                    <LogOut size={16} /> {t("nav.signOut")}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <NotificationDrawer isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />
      <SearchPopup isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
