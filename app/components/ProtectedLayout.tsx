'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';


interface ProtectedLayoutProps {
  children: ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';

  // Public pages that don't need Sidebar or authentication
  const publicPages = ['/login', '/register', '/forgot-password'];
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

  useEffect(() => {
    if ((!isLoading || loadingTimeout) && !isAuthenticated && !isPublicPage) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, isPublicPage, router, loadingTimeout]);

  if (isLoading && !loadingTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#f5a623]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-1">
        <div className="flex-1 flex flex-col">
          {(isPublicPage || isAuthenticated) ? (
            <>
              <main className="flex-1">
                {children}
              </main>
              {/* Only show global footer on non-auth pages or if user is logged in (excluding simple auth forms) */}
              {!isPublicPage && <Footer />}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center min-h-screen">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#f5a623]"></div>
            </div>
          )}
        </div>
      </div>
      <ScrollToTop />
    </div>
  );
}