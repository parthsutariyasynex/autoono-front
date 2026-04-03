'use client';

import React, { ReactNode, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Navbar from './Navbar';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';

interface ProtectedLayoutProps {
  children: ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const dispatch = useDispatch();

  const isAuthenticated = status === 'authenticated';

  const publicPages = ['/login', '/register', '/forgot-password', '/about', '/catalogue', '/locations', '/guides'];
  const isPublicPage = publicPages.includes(pathname);

  // Sync NextAuth session with Redux & LocalStorage
  useEffect(() => {
    if (status === 'authenticated' && (session as any)?.accessToken) {
      const token = (session as any).accessToken;
      dispatch({ type: 'LOGIN_SUCCESS', payload: token });
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
      }
    } else if (status === 'unauthenticated') {
      dispatch({ type: 'LOGOUT' });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    }
  }, [session, status, dispatch]);

  const hideFooter = ['/login', '/register', '/forgot-password'].includes(pathname);
  const showContent = isPublicPage || isAuthenticated;

  // Always render children in the DOM to preserve layout dimensions.
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 🧭 Sticky Navbar - Consolidated with internal Navbar sticky handling */}
      <Navbar />

      {/* 📏 Header Spacer - Fixed header means we need a spacer to prevent content overlap */}
      <div className="h-[56px] sm:h-[64px] lg:h-[108px] flex-shrink-0" aria-hidden="true" />

      {/* 🚀 Main Content Wrapper */}
      <main className="flex-1 flex flex-col w-full relative">
        <div className="flex-1 flex flex-col w-full min-h-0">
          {children}
        </div>

        {/* 🧱 Footer */}
        {!hideFooter && <Footer />}

        {/* ⏲ Global Loading State (Fixed overlay only when not ready) */}
        {!showContent && (
          <div className="fixed inset-0 flex items-center justify-center bg-white z-[70] transition-opacity duration-300">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-100 border-t-[#f5a623]"></div>
          </div>
        )}
      </main>

      {/* 🔝 Scroll To Top */}
      <ScrollToTop />
    </div>
  );
}
