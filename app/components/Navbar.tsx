"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
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
  const { unreadCount, fetchNotifications: pullNotifications } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const cartCount = cart?.items_count || 0;

  const handleLogout = async () => {
    localStorage.removeItem('token');
    await signOut({ callbackUrl: "/login" });
  };

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
      <header className="bg-white border-b border-gray-100 py-3 px-6 md:px-12 relative shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          {/* Logo Area */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <img
                src="/logo/btire-logo-horizontal.svg"
                alt="BTIRE Logo"
                className="h-10 w-auto"
              />
            </Link>
          </div>

          {/* Secondary Brand Logo */}
          <div className="hidden lg:flex flex-1 justify-center px-10">
            <img
              src="/logo/atcl-bridgestone-logo-v1.jpg"
              alt="Bridgestone Logo"
              className="h-11 w-auto"
            />
          </div>

          {/* 2. Top-right Welcome Badge & Icons */}
          <div className="flex flex-col items-end">
            {isAuthenticated && !isLoadingName && (
              <div className="bg-[#f5b21a] text-black text-[11px] font-bold px-3 py-1 mb-1 rounded-sm shadow-sm">
                Welcome: {displayUser}
              </div>
            )}

            <div className="flex items-center gap-6">
              {/* Notification Bell */}
              <div
                className="relative cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setIsNotificationOpen(true)}
              >
                <div className="text-black">
                  <Bell size={26} fill="black" strokeWidth={1} />
                </div>
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#f5af02] text-black text-[10px] font-black w-[18px] h-[18px] flex items-center justify-center rounded-full border border-white">
                    {unreadCount}
                  </span>
                )}
              </div>

              {/* Language (Arabic) placeholder as styled text */}
              <span className="text-black text-[14px] font-bold cursor-pointer hover:text-yellow-600 transition-colors">
                Arabic
              </span>

              {/* Profile Avatar & Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="text-black transition-colors cursor-pointer flex items-center"
                  aria-label="User Profile"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
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

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-5 py-3 text-[14px] font-bold text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer border-t border-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>

              {/* Cart Icon */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative text-black transition-colors cursor-pointer"
                aria-label="Shopping Cart"
              >
                <ShoppingCart size={24} strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className="absolute -top-2.5 -right-2.5 bg-[#f5af02] text-black text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border border-white">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Notification Drawer */}
      <NotificationDrawer isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />

      {/* Secondary Navigation Section */}
      <nav className="bg-[#f5b21a] border-b border-yellow-600/10 w-full relative h-[60px] flex items-center">
        <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-center">

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-12 text-[17px] text-black font-semibold uppercase tracking-wider">
            <Link
              href="/products"
              className="h-full flex items-center px-6 hover:bg-black hover:text-white transition-all duration-200 cursor-pointer"
            >
              All Tyres
            </Link>
            <Link
              href="/about"
              className="h-full flex items-center px-6 hover:bg-black hover:text-white transition-all duration-200 cursor-pointer"
            >
              About Us
            </Link>
            <Link
              href="/catalogue"
              className="h-full flex items-center px-6 hover:bg-black hover:text-white transition-all duration-200 cursor-pointer"
            >
              Product Catalogue
            </Link>
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