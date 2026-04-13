'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Navbar from './Navbar';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';
import { stripLocaleFromPath, useLocale } from '@/lib/i18n/client';

interface ProtectedLayoutProps {
  children: ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const locale = useLocale();
  const dispatch = useDispatch();

  const isAuthenticated = status === 'authenticated';

  // Track if user was ever authenticated in this session.
  // Prevents clearing localStorage during the initial "loading" → "unauthenticated" flash
  // that happens before NextAuth reads the JWT cookie.
  const [wasAuthenticated, setWasAuthenticated] = useState(false);

  // Strip locale prefix for route matching
  const pathnameWithoutLocale = stripLocaleFromPath(pathname);
  const publicPages = ['/login', '/register', '/forgot-password', '/about', '/catalogue', '/locations', '/guides'];
  const isPublicPage = publicPages.some(p => pathnameWithoutLocale.startsWith(p));

  // Sync NextAuth session with Redux & LocalStorage
  useEffect(() => {
    if (status === 'authenticated') {
      setWasAuthenticated(true);

      // Check if Magento token has expired (set by auth-options.ts JWT callback)
      if ((session as any)?.error === 'MagentoTokenExpired') {
        localStorage.removeItem('token');
        dispatch({ type: 'LOGOUT' });
        signOut({ callbackUrl: `/${locale}/login` });
        return;
      }

      if ((session as any)?.accessToken) {
        const token = (session as any).accessToken;
        dispatch({ type: 'LOGIN_SUCCESS', payload: token });
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
        }
      }
    } else if (status === 'unauthenticated' && wasAuthenticated) {
      // Only clear token if user WAS logged in before (actual logout).
      // Skip if this is the initial load flash (loading → unauthenticated → authenticated).
      if (!isPublicPage) {
        dispatch({ type: 'LOGOUT' });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
      }
    }
  }, [session, status, dispatch, isPublicPage, wasAuthenticated]);

  const hideFooter = ['/login', '/register', '/forgot-password'].some(p => pathnameWithoutLocale.startsWith(p));
  const isLoading = status === 'loading';

  // Redirect unauthenticated users to login on protected pages
  useEffect(() => {
    if (status === 'unauthenticated' && !isPublicPage) {
      const loginUrl = `/${locale}/login?callbackUrl=${encodeURIComponent(pathname)}`;
      window.location.href = loginUrl;
    }
  }, [status, isPublicPage, locale, pathname]);

  // Show loading overlay while auth is checking on protected pages
  if (isLoading && !isPublicPage) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Navbar />
        <div className="h-[56px] sm:h-[64px] lg:h-[108px] flex-shrink-0" aria-hidden="true" />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-100 border-t-[#f5a623]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      <div className="h-[56px] sm:h-[64px] lg:h-[108px] flex-shrink-0" aria-hidden="true" />

      <main className="flex-1 flex flex-col w-full relative">
        <div className="flex-1 flex flex-col w-full min-h-0">
          {children}
        </div>

        {!hideFooter && <Footer />}
      </main>

      <ScrollToTop />
    </div>
  );
}
