"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "../../components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useDispatch, useSelector } from "react-redux";
import { fetchCustomerInfo } from "@/store/actions/customerActions";
import { RootState } from "@/store/store";
import Link from "next/link";
import Addresses from "../../components/Addresses";

export default function AddressBookPage() {
    const router = useRouter();
    const dispatch = useDispatch();
    const { data: session, status } = useSession();
    const { data: customer, loading } = useSelector((state: RootState) => state.customer);
    const token = useSelector((state: RootState) => state.auth.token);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/login");
            return;
        }

        if (status === "authenticated" && token) {
            // @ts-ignore
            dispatch(fetchCustomerInfo());
        }
    }, [dispatch, status, router, token]);

    if (status === "loading" || loading) {
        return (
            <>
                <Navbar />
                <div className="flex items-center justify-center min-h-screen bg-white">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#f5a623]"></div>
                        <p className="text-gray-500 font-['Rubik']">Loading...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="min-h-screen bg-white font-['Rubik']">
            <Navbar />

            <div className="flex max-w-[1440px] mx-auto mt-[100px]">
                {/* Left Sidebar */}
                <Sidebar />

                {/* Right Content */}
                <main className="flex-1 p-8 bg-[#fcfcfc] min-h-screen">
                    <div className="max-w-[1200px]">
                        <Addresses />
                    </div>
                </main>
            </div>
        </div>
    );
}
