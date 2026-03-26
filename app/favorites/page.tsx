"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import FavouriteProducts from "@/app/components/FavouriteProducts";
import { redirectToLogin } from "@/utils/helpers";

/**
 * Global Favorites Page
 * Displays a clean, full-width list of favorite products without a sidebar.
 * This is the single source of truth for favorites across the entire application.
 */
export default function FavoritesPage() {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (authStatus === "unauthenticated") {
            redirectToLogin(router);
        }
    }, [authStatus, router]);

    if (authStatus === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-[#f5a623]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-rubik scroll-smooth text-black">


            {/* Main Content Area - Optimized Full Width */}
            <div className="w-full mx-auto mt-4 md:mt-8 px-4 md:px-10 pb-20 min-h-screen bg-white">
                <h1 className="text-[26px] font-black text-black mb-8 uppercase tracking-wide px-2">
                    Favorite Products
                </h1>
                <FavouriteProducts />
            </div>
        </div>
    );
}
