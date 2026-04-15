"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

import CartDrawer from "./CartDrawer";
import NotificationDrawer from "./NotificationDrawer";
import SearchPopup from "./SearchPopup";

import { useCart } from "@/modules/cart/hooks/useCart";
import { useNotifications } from "@/modules/notifications/hooks/useNotifications";
import { fetchCustomerInfo } from "@/store/actions/customerActions";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocale } from "@/lib/i18n/client";
import { useLocalePath } from "@/hooks/useLocalePath";

interface NavLink {
  label: string;
  href: string;
  code?: string;
}

const FALLBACK_NAV_KEYS: { key: string; href: string }[] = [
  { key: "nav.allTyres", href: "/products" },
  { key: "nav.quickOrder", href: "/quick-order" },
  { key: "nav.aboutUs", href: "/about" },
  { key: "nav.branchLocations", href: "/locations" },
  { key: "nav.userGuides", href: "/guides" },
  { key: "nav.productCatalogue", href: "/catalogue" },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { t } = useTranslation();
  const locale = useLocale();
  const lp = useLocalePath();
  const isAuthenticated = status === "authenticated";
  const { cart, refetchCart } = useCart();
  const [navLinks, setNavLinks] = useState<NavLink[]>(FALLBACK_NAV_KEYS.map(n => ({ label: t(n.key), href: n.href })));
  const [navLoading, setNavLoading] = useState(true);

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

  const [subAccountName, setSubAccountName] = useState<string | null>(null);
  const [isSubAccount, setIsSubAccount] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { unreadCount, fetchNotifications: pullNotifications } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const cartCount = cart?.items_count || 0;

  const handleLogout = async () => {
    localStorage.removeItem("token");
    await signOut({ callbackUrl: `${window.location.origin}${lp("/login")}` });
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSubAccountName(localStorage.getItem("subAccountName"));
      setIsSubAccount(localStorage.getItem("isSubAccount") === "true");
    }
  }, [pathname]);

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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch dynamic menu from API (re-fetches when locale changes)
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // No token (login page) — use fallback links immediately, no API call
    if (!token) {
      setNavLinks(FALLBACK_NAV_KEYS.map(n => ({ label: t(n.key), href: n.href })));
      setNavLoading(false);
      return;
    }

    let cancelled = false;
    const fetchMenu = async () => {
      try {
        setNavLoading(true);
        const fetchLocale = window.location.pathname.startsWith("/ar") ? "ar" : "en";
        const res = await fetch("/api/kleverapi/menu", {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "x-locale": fetchLocale,
          },
        });
        if (cancelled) return;
        if (!res.ok) throw new Error("Menu fetch failed");
        const data = await res.json();
        if (cancelled) return;

        if (Array.isArray(data) && data.length > 0) {
          setNavLinks(data.map((item: any) => ({
            label: item.label,
            href: item.href,
            code: item.code,
          })));
        } else {
          setNavLinks(FALLBACK_NAV_KEYS.map(n => ({ label: t(n.key), href: n.href })));
        }
      } catch {
        setNavLinks(FALLBACK_NAV_KEYS.map(n => ({ label: t(n.key), href: n.href })));
      } finally {
        if (!cancelled) setNavLoading(false);
      }
    };

    fetchMenu();
    return () => { cancelled = true; };
  }, [locale]);

  return (
    <div className={`main-header w-full ${isScrolled ? 'fixed fadeInDown' : 'relative'} top-0 left-0 right-0 z-[60] flex flex-col transition-all duration-300 ease-in-out`} style={{ paddingRight: isScrolled ? "var(--scrollbar-width)" : "0px" }}>

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
                src="/logo/atcl-bridgestone-logo-v1.jpg"
                alt="AL TALAYI KSA"
                className="h-[24px] sm:h-[32px] lg:h-[42px] xl:h-[50px] w-auto object-contain"
              />
            </Link>
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-5 flex-shrink-0 z-10">

            {/* Language Switcher — desktop only (mobile has it in drawer) */}
            <div className="hidden lg:block">
              <LanguageSwitcher />
            </div>

            {/* Welcome badge & Account Dropdown — md+ */}
            {isAuthenticated && !isLoadingName && pathname !== "/login" && (
              <div className="relative hidden lg:block" ref={dropdownRef}>
                <div
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-1.5 lg:gap-2 bg-white border border-gray-100 rounded-full px-1.5 lg:px-3 py-1 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.12)] hover:shadow-md transition-shadow group cursor-pointer"
                >
                  <div className="w-7 h-7 bg-[#f5b21a] rounded-full flex items-center justify-center flex-shrink-0 transition-transform">
                    <UserCircle size={16} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col min-w-0 pr-1 rtl:pr-0 rtl:pl-1">
                    <span className="hidden lg:block text-[8px] text-gray-400 font-bold uppercase tracking-widest leading-none">{t("nav.welcomeBack")}</span>
                    <span className="text-[11px] lg:text-[12px] text-black font-black tracking-tighter leading-snug mt-0.5 truncate max-w-[80px] lg:max-w-[140px] font-bold">
                      {isSubAccount && subAccountName ? subAccountName : displayUser}
                    </span>
                  </div>

                </div>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-sm shadow-2xl border border-gray-200 py-1 z-[100]">
                    <Link
                      href={lp("/my-account")}
                      className="block px-4 py-2.5 text-[12px] font-bold text-gray-800 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      {t("nav.myAccount")}
                    </Link>
                    {isSubAccount && (
                      <Link
                        href={lp("/my-account")}
                        className="block px-4 py-2.5 text-[12px] font-bold text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                        onClick={() => {
                          setIsProfileOpen(false);
                          localStorage.removeItem("subAccountName");
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
                      className="w-full text-left px-4 py-2.5 text-[12px] font-bold text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer border-t border-gray-100"
                    >
                      {t("nav.signOut")}
                    </button>
                  </div>
                )}
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
                  <span className="absolute w-[26px] h-[26px] font-medium text-[12px] -top-[13px] -right-[14px] bg-[#f5af02] text-black font-black flex items-center justify-center rounded-full border border-white">
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
                  <span className="absolute w-[20px] h-[20px] lg:w-[26px] lg:h-[26px] font-medium text-[9px] lg:text-[12px] -top-[10px] -right-[6px] lg:-right-[14px] bg-[#f5af02] text-black font-black flex items-center justify-center rounded-full border border-white">
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
      <nav className="bg-[#f5b21a] w-full hidden lg:block">
        <div className="flex items-center justify-center max-w-[1280px] mx-auto px-2 lg:px-4">
          {navLoading ? (
            <div className="flex items-center gap-6">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-3 w-20 bg-yellow-500/40 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            navLinks.map((item) => {
              const href = lp(item.href);
              const isActive = pathname === href || pathname?.startsWith(href + "/");
              return (
                <Link
                  key={item.href}
                  href={href}
                  className={`py-3 flex items-center h-full px-2.5 lg:px-7 text-[11px] lg:text-[16px] font-semibold capitalize transition-all duration-200 whitespace-nowrap ${isActive
                    ? "bg-black text-white"
                    : "text-black hover:bg-black hover:text-white"
                    }`}
                >
                  {item.label}
                </Link>
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
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none">{t("nav.loggedInAs")}</span>
                    <span className="text-[12px] text-black font-black uppercase truncate tracking-tight">
                      {isSubAccount && subAccountName ? subAccountName : displayUser}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Nav links */}
            <div className="px-4 py-2">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] block mb-2">{t("nav.navigation")}</span>
              {navLinks.map((item) => {
                const href = lp(item.href);
                const isActive = pathname === href || pathname?.startsWith(href + "/");
                return (
                  <Link
                    key={item.href}
                    href={href}
                    className={`py-2.5 text-[12px] font-bold uppercase tracking-wide flex items-center justify-between group ${isActive ? "text-[#f5b21a]" : "text-black hover:text-[#f5b21a]"
                      }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                    <span className="text-gray-300 group-hover:text-[#f5b21a] transition-colors text-[10px]">→</span>
                  </Link>
                );
              })}
            </div>

            {/* Quick actions */}
            <div className="px-4 py-3 mt-1 border-t border-gray-100">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] block mb-2">{t("nav.quickActions")}</span>

              {isAuthenticated && pathname !== "/login" && (
                <>
                  <button
                    onClick={() => { setIsSearchOpen(true); setIsMenuOpen(false); }}
                    className="py-2.5 text-[12px] font-bold text-gray-700 flex items-center gap-3 w-full text-start"
                  >
                    <Search size={16} /> {t("nav.searchProducts") || "Search Products"}
                  </button>

                  <button
                    onClick={() => { setIsNotificationOpen(true); setIsMenuOpen(false); }}
                    className="py-2.5 text-[12px] font-bold text-gray-700 flex items-center gap-3 w-full"
                  >
                    <Bell size={16} /> {t("nav.notifications")} ({unreadCount})
                  </button>
                  <Link href={lp("/my-account")} className="py-2.5 text-[12px] font-bold text-gray-700 flex items-center gap-3" onClick={() => setIsMenuOpen(false)}>

                    <UserCircle size={16} /> {t("nav.myAccount")}
                  </Link>
                </>
              )}

              <div className="py-2.5">
                <LanguageSwitcher />
              </div>

              {isAuthenticated && pathname !== "/login" && (
                <button
                  onClick={handleLogout}
                  className="py-2.5 mt-2 text-[12px] font-bold text-red-600 flex items-center gap-3 border-t border-gray-100 w-full pt-3"
                >
                  <LogOut size={16} /> {t("nav.signOut")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <NotificationDrawer isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />
      <SearchPopup isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

    </div>
  );
}
