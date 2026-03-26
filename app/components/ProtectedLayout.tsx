'use client';

import React, { ReactNode, useEffect, useState } from 'react';
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

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';

  // Public pages that don't need Sidebar or authentication
  const publicPages = ['/login', '/register', '/forgot-password', '/about', '/catalogue', '/locations', '/guides'];
  const isPublicPage = publicPages.includes(pathname);

  // Add loading timeout
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 5000); // 5 seconds timeout
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [isLoading]);

  // Sync NextAuth session with Redux & LocalStorage
  useEffect(() => {
    if (status === 'authenticated' && (session as any)?.accessToken) {
      const token = (session as any).accessToken;
      dispatch({ type: 'LOGIN_SUCCESS', payload: token });
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
      }
    } else if (status === 'unauthenticated') {
      // Clear Redux token & localStorage when session ends
      dispatch({ type: 'LOGOUT' });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    }
  }, [session, status, dispatch]);

  // Do NOT redirect from ProtectedLayout — middleware handles auth redirects.
  // ProtectedLayout only syncs session state and controls render visibility.
  // Removing the duplicate redirect prevents the login bounce/flicker.

  // Show loader while session is loading (prevents flash of protected content)
  if (isLoading && !loadingTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#f5a623]"></div>
        </div>
      </div>
    );
  }

  // For public pages — always render immediately
  if (isPublicPage) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        {!['/login', '/register', '/forgot-password'].includes(pathname) && <Footer />}
        <ScrollToTop />
      </div>
    );
  }

  // For protected pages — only render content when authenticated
  // If not authenticated and not loading, middleware will handle the redirect
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#f5a623]"></div>
      </div>
    );
  }

  // Authenticated — render the full layout
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
      {!['/login', '/register', '/forgot-password'].includes(pathname) && <Footer />}
      <ScrollToTop />
    </div>
  );
}