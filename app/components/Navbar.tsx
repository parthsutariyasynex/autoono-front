"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { useState, useRef, useEffect } from "react";
import {
  ShoppingCart,
  LogOut,
  Package,
  UserCircle,
  Bell,
  ChevronDown,
  Menu,
  X
} from "lucide-react";
import CartDrawer from "./CartDrawer";
import NotificationDrawer from "./NotificationDrawer";
import { useCart } from "@/modules/cart/hooks/useCart";
import { useNotifications } from "@/modules/notifications/hooks/useNotifications";
import { fetchCustomerInfo } from "@/store/actions/customerActions";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isAuthenticated = status === "authenticated";
  const { cart, refetchCart } = useCart();

  // Requirement: Dynamic Username from a variable
  // Requirement: Dynamic Username/Email from session
  const { data: customerData } = useSelector((state: RootState) => state.customer);
  const dispatch = useDispatch();

  const isLoadingName = isAuthenticated && !customerData;
  const displayUser = isLoadingName
    ? ""
    : (customerData as any)?.firstname
      ? `${(customerData as any).firstname} ${(customerData as any).lastname}`
      : (session?.user?.name || session?.user?.email);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [subAccountName, setSubAccountName] = useState<string | null>(null);
  const [isSubAccount, setIsSubAccount] = useState(false);
  const { unreadCount, fetchNotifications: pullNotifications } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const cartCount = cart?.items_count || 0;

  const handleLogout = async () => {
    localStorage.removeItem('token');
    await signOut({ callbackUrl: "/login" });
  };

  // Check for persistent subaccount name
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("subAccountName");
      const subFlag = localStorage.getItem("isSubAccount") === "true";
      setSubAccountName(storedName);
      setIsSubAccount(subFlag);
    }
  }, [pathname]);

  // Fetch Notifications and Customer Info
  useEffect(() => {
    if (isAuthenticated) {
      pullNotifications();
      if (!customerData) {
        dispatch(fetchCustomerInfo() as any);
      }
    }
  }, [isAuthenticated, pullNotifications, customerData, dispatch]);

  // Listen for notification updates
  useEffect(() => {
    const handleNotificationUpdate = () => pullNotifications();
    window.addEventListener("notifications-updated", handleNotificationUpdate);
    return () => window.removeEventListener("notifications-updated", handleNotificationUpdate);
  }, [pullNotifications]);

  // Listen for cart updates from other components
  useEffect(() => {
    const handleCartUpdate = () => refetchCart();
    window.addEventListener("cart-updated", handleCartUpdate);
    return () => window.removeEventListener("cart-updated", handleCartUpdate);
  }, [refetchCart]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full sticky top-0 z-50 flex flex-col">
      {/* 1. Header Section */}
      <header className="bg-white border-b border-gray-100 px-4 md:px-8 lg:px-12 relative shadow-sm min-h-[100px] flex items-center">
        <div className="w-full flex items-center justify-between">

          {/* Logo Area */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <img
                src="/logo/btire-logo-horizontal.svg"
                alt="BTIRE Logo"
                className="h-14 w-auto"
              />
            </Link>

          </div>

          {/* Secondary Brand Logo - ABSOLUTE CENTERED */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center h-full">
            <Link href="/" className="cursor-pointer">
              <img
                src="/logo/atcl-bridgestone-logo-v1.jpg"
                alt="Bridgestone Logo"
                className="h-16 w-auto max-w-[300px] object-contain"
              />
            </Link>
          </div>

          {/* 2. Top-right Welcome Badge & Icons */}
          <div className="flex items-center gap-6">
            {isAuthenticated && !isLoadingName && (
              <div className="flex items-center bg-white border border-gray-100 rounded-full pl-1 pr-5 py-1 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] md:flex hidden hover:shadow-md transition-all duration-300 group cursor-default">
                <div className="w-8 h-8 bg-[#f5b21a] rounded-full flex items-center justify-center text-black mr-3 shadow-inner group-hover:scale-110 transition-transform">
                  <UserCircle size={20} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none">Welcome Back</span>
                  <span className="text-[13px] text-black font-black uppercase tracking-tighter leading-tight mt-0.5">
                    {isSubAccount && subAccountName ? subAccountName : displayUser}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-8">
              {/* Notification Bell */}
              {isAuthenticated && (
                <div
                  className="relative cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setIsNotificationOpen(true)}
                >
                  <div className="text-black">
                    <Bell size={26} fill="black" stroke="black" strokeWidth={1} />
                  </div>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 bg-[#f5af02] text-black text-[11px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </div>
              )}

              {/* Language (Arabic) placeholder as styled text */}
              <span className="text-black text-[14px] font-medium cursor-pointer hover:text-yellow-600 transition-colors tracking-tight">
                Arabic
              </span>

              {/* Profile Avatar & Dropdown */}
              {isAuthenticated && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="text-black transition-colors cursor-pointer flex items-center"
                    aria-label="User Profile"
                  >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.33 4 18V20H20V18C20 15.33 14.67 14 12 14Z" />
                    </svg>
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-sm shadow-2xl border border-gray-200 py-1 z-[100]">
                      <Link
                        href="/my-account"
                        className="block px-5 py-3 text-[14px] font-bold text-gray-800 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        My Account
                      </Link>

                      {isSubAccount && (
                        <Link
                          href="/my-account"
                          className="block px-5 py-3 text-[14px] font-bold text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                          onClick={() => {
                            setIsProfileOpen(false);
                            if (typeof window !== "undefined") {
                              localStorage.removeItem("subAccountName");
                              localStorage.removeItem("isSubAccount");
                            }
                            setSubAccountName(null);
                            setIsSubAccount(false);
                          }}
                        >
                          Back to Main Account
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-5 py-3 text-[14px] font-bold text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer border-t border-gray-100"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Cart Icon */}
              {isAuthenticated && (
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative text-black hover:opacity-80 transition-opacity cursor-pointer"
                  aria-label="Shopping Cart"
                >
                  <ShoppingCart size={28} strokeWidth={1.5} />
                  {cartCount > 0 && (
                    <span className="absolute -top-2.5 -right-3 bg-[#f5af02] text-black text-[11px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                      {cartCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Notification Drawer */}
      <NotificationDrawer isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />

      {/* Secondary Navigation Section */}
      <nav className="bg-[#f5b21a] border-b border-yellow-600/10 w-full relative h-[50px]">
        <div className="w-full flex items-center justify-center h-full">

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center h-full text-[14px] lg:text-[15px] text-black font-medium uppercase tracking-wider">
            {[
              { label: 'All Tyres', href: '/products' },
              { label: 'About Us', href: '/about' },
              { label: 'Branch Locations', href: '/locations' },
              { label: 'User Guides', href: '/guides' },
              { label: 'Product Catalogue', href: '/catalogue' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center px-8 lg:px-12 relative transition-all duration-200 cursor-pointer h-full whitespace-nowrap text-black hover:bg-black hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex w-full justify-between items-center">
            <span className="text-sm font-bold uppercase tracking-widest text-black/60">Menu</span>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-black hover:bg-black/5 rounded-md transition-colors cursor-pointer"
              aria-label="Toggle Navigation"
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Sidebar/Drawer Menu */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-[#f5b21a] border-t border-yellow-600/10 shadow-xl md:hidden animate-in slide-in-from-top duration-300 z-40">
            <div className="flex flex-col py-2">
              <Link
                href="/products"
                className="px-8 py-4 text-black font-semibold uppercase tracking-wide hover:bg-black hover:text-white transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                All Tyres
              </Link>
              <Link
                href="/about"
                className="px-8 py-4 text-black font-semibold uppercase tracking-wide hover:bg-black hover:text-white transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                About Us
              </Link>
              <Link
                href="/locations"
                className="px-8 py-4 text-black font-semibold uppercase tracking-wide hover:bg-black hover:text-white transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                Branch Locations
              </Link>
              <Link
                href="/guides"
                className="px-8 py-4 text-black font-semibold uppercase tracking-wide hover:bg-black hover:text-white transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                User Guides
              </Link>
              <Link
                href="/catalogue"
                className="px-8 py-4 text-black font-semibold uppercase tracking-wide hover:bg-black hover:text-white transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                Product Catalogue
              </Link>
            </div>
          </div>
        )}
      </nav>
    </div >
  );
}