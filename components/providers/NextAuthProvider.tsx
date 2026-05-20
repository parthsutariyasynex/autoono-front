"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { invalidateSessionCache } from "@/lib/sessionCache";

// Expose the invalidator globally so any raw signOut() call site that doesn't
// go through logout-helper can still bust the cache.
if (typeof window !== "undefined") {
    (window as any).__invalidateSessionCache = invalidateSessionCache;
}

interface Props {
    children: React.ReactNode;
    /**
     * Server-read session passed from RootLayout.
     * When provided, SessionProvider skips its own client-side fetch on mount
     * — eliminating the 2 extra /api/auth/session calls per page load.
     */
    session?: Session | null;
}

export function NextAuthProvider({ children, session }: Props) {
    return (
        <SessionProvider
            session={session}
            basePath="/api/auth"
            refetchOnWindowFocus={false}
            refetchInterval={0}
            refetchWhenOffline={false}
        >
            {children}
        </SessionProvider>
    );
}
