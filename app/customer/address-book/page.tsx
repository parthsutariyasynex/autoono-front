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
            <>

                <div className="flex items-center justify-center min-h-screen bg-white">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-primary"></div>
                        <p className="text-gray-500 font-['Rubik']">{t("common.loading")}</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>


            <div className="flex flex-col lg:flex-row flex-1 min-h-0 w-full">
                {/* Left Sidebar */}
                <Sidebar />

                {/* Right Content */}
                <main className="flex-1 p-4 md:p-6 lg:p-8 bg-[#fcfcfc] min-h-0">
                    <div className="max-w-[1200px]">
                        <Addresses />
                    </div>
                </main>
            </div>
        </>
    );
}
