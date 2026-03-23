"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import FavouriteProducts from "@/app/components/FavouriteProducts";

/**
 * Account Favourites Page
 * Displays a full-width list of products marked as favorites.
 * The sidebar has been removed per user requirement to maximize table visibility.
 */
export default function MyFavouriteProductsAccountPage() {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (authStatus === "unauthenticated") {
            router.replace("/login");
        }
    }, [authStatus, router]);

    if (authStatus === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <style jsx global>{`
                    body {
                        background: white;
                    }
                `}</style>
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-[#f5a623]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-rubik scroll-smooth text-black">
            <Navbar />

            {/* Main Content Area - Optimized Full Width */}
            <div className="w-full mx-auto mt-[110px] px-4 md:px-10 pb-20 min-h-screen bg-white">
                <FavouriteProducts />
            </div>
        </div>
    );
}
