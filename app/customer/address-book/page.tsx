"use client";
import { useTranslation } from "@/hooks/useTranslation";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import { useDispatch, useSelector } from "react-redux";
import { fetchCustomerInfo } from "@/store/actions/customerActions";
import { RootState } from "@/store/store";
import Link from "next/link";
import Addresses from "../../components/Addresses";
import { redirectToLogin } from "@/utils/helpers";

export default function AddressBookPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { data: session, status } = useSession();
    const { data: customer, loading } = useSelector((state: RootState) => state.customer);
    const token = useSelector((state: RootState) => state.auth.token);

    useEffect(() => {
        if (status === "unauthenticated") {
            redirectToLogin(router);
            return;
        }

        if (status === "authenticated" && token) {
            // @ts-ignore
            dispatch(fetchCustomerInfo());
        }
    }, [dispatch, status, router, token]);

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen bg-surfacePage flex flex-col lg:flex-row">
                <div className="hidden lg:block w-64 flex-shrink-0 bg-gray-50 border-r border-gray-200 animate-pulse">
                    <div className="p-4 space-y-2">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="h-10 bg-gray-200 rounded w-full" />
                        ))}
                    </div>
                </div>
                <div className="flex-1 p-6 md:p-10 space-y-6 animate-pulse">
                    <div className="h-7 bg-gray-200 rounded w-48" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-40 bg-gray-200 rounded-xl w-full" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>


            <div className="flex flex-col lg:flex-row flex-1 min-h-0 w-full">
                {/* Left Sidebar */}
                <Sidebar />

                {/* Right Content */}
                <main className="flex-1 p-4 md:p-6 lg:p-8 bg-surfacePage min-h-0">
                    <div className="max-w-[1200px]">
                        <Addresses />
                    </div>
                </main>
            </div>
        </>
    );
}
