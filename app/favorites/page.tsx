"use client";
import { useTranslation } from "@/hooks/useTranslation";

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
    const { t } = useTranslation();

    useEffect(() => {
        if (authStatus === "unauthenticated") {
            redirectToLogin(router);
        }
    }, [authStatus, router]);

    if (authStatus === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-rubik scroll-smooth text-black">


            {/* Main Content Area - Full Width optimized */}
            <div className="w-full mt-4 md:mt-8 px-4 md:px-10 pb-10 bg-white">
                <FavouriteProducts
                    title={
                        <h1 className="text-h3 md:text-[26px] font-black text-black uppercase tracking-wide px-4 md:px-0">
                            {t("sidebar.favoriteProducts")}
                        </h1>
                    }
                />
            </div>
        </div>
    );
}
