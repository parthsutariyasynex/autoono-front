"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import FavouriteProducts from "@/app/components/FavouriteProducts";

export default function MyFavouriteProductsPage() {
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
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-[#f5a623]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-['Rubik']">
            <Navbar />

            <div className="flex max-w-[1440px] mx-auto mt-[80px]">
                <Sidebar />

                <main className="flex-1 p-8 min-h-screen">
                    <FavouriteProducts />
                </main>
            </div>
        </div>
    );
}
