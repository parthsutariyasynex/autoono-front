"use client";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocalePath } from "@/hooks/useLocalePath";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import { redirectToLogin } from "@/utils/helpers";

type SubAccount = {
    entity_id: number | string;
    firstname: string;
    lastname: string;
    email: string;
    is_active?: boolean;
    [key: string]: any;
};

export default function ManageSubAccountsPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const lp = useLocalePath();
    const { data: session, status } = useSession();
    const token = useSelector((state: RootState) => state.auth.token);

    const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [loggingInId, setLoggingInId] = useState<string | number | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            redirectToLogin(router);
            return;
        }
    }, [status, router]);

    // Fetch sub-accounts list
    useEffect(() => {
        if (!token) return;

        const fetchSubAccounts = async () => {
            try {
                setLoading(true);
                const res = await fetch("/api/kleverapi/subaccounts", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                const data = await res.json();

                if (!res.ok) {
                    setError(data.message || t("common.failed"));
                    return;
                }

                // Log full response to see the structure
                console.log("[ManageSubAccounts] API response:", JSON.stringify(data));

                // Handle both array response and object with items
                const accounts = Array.isArray(data) ? data : data.items || data.data || [];
                if (accounts.length > 0) {
                    console.log("[ManageSubAccounts] First sub-account keys:", Object.keys(accounts[0]));
                    console.log("[ManageSubAccounts] First sub-account:", JSON.stringify(accounts[0]));
                }
                setSubAccounts(accounts);
            } catch (err: any) {
                setError(err.message || t("common.failed"));
            } finally {
                setLoading(false);
            }
        };

        fetchSubAccounts();
    }, [token]);

    // Login as sub-account
    const handleLoginAsSubAccount = async (subAccount: SubAccount) => {
        if (!token) return;

        // Try multiple possible ID field names
        const subAccountId = subAccount.entity_id || subAccount.id || subAccount.customer_id || subAccount.sub_account_id;
        console.log("[ManageSubAccounts] Login as sub-account, ID:", subAccountId, "Full data:", JSON.stringify(subAccount));

        if (!subAccountId) {
            alert(t("common.error"));
            return;
        }
        setLoggingInId(subAccountId);

        try {
            // Call POST /api/kleverapi/subaccounts/{id}/login
            const res = await fetch(`/api/kleverapi/subaccounts/${subAccountId}/login`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || t("common.failed"));
                setLoggingInId(null);
                return;
            }

            // Set sub-account session in localStorage
            localStorage.setItem("isSubAccount", "true");
            localStorage.setItem("subAccountName", `${subAccount.firstname} ${subAccount.lastname}`);
            localStorage.setItem("subAccountId", String(subAccountId));

            // Store sub-account data if returned
            if (data) {
                localStorage.setItem("subAccountData", JSON.stringify(data));
            }

            // Redirect to sub-account my-account page
            router.push(lp("/subaccount/my-account"));
        } catch (err: any) {
            alert(err.message || t("common.failed"));
            setLoggingInId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col w-full bg-[#fcfcfc] font-rubik">
            <div className="flex flex-col lg:flex-row flex-1 w-full">
                <Sidebar />

                <main className="flex-1 w-full px-4 md:px-6 lg:px-8 py-10">
                    <h1 className="text-[20px] md:text-[26px] font-black text-black mb-6 md:mb-10 uppercase tracking-wide">
                        MANAGE ACCOUNTS
                    </h1>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-700 p-4 mb-6 rounded-md" role="alert">
                            <p className="text-xs font-bold uppercase mb-1">{t("common.error")}</p>
                            <p className="text-xs">{error}</p>
                        </div>
                    )}

                    {subAccounts.length === 0 && !error ? (
                        <div className="text-gray-500 text-xs py-8 italic">
                            {t("subaccounts.noSubaccounts")}
                        </div>
                    ) : (
                        <>
                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-3">
                                {subAccounts.map((account, idx) => {
                                    const accountId = account.entity_id || account.id || account.customer_id || account.sub_account_id;
                                    return (
                                        <div key={accountId || idx} className="bg-white border border-[#ebebeb] rounded-md p-4 shadow-sm">
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div className="min-w-0">
                                                    <p className="text-[13px] font-black text-black uppercase">
                                                        {account.firstname || account.name || "N/A"} {account.lastname || ""}
                                                    </p>
                                                    <p className="text-[12px] text-gray-500 font-medium mt-1 break-all">
                                                        {account.email || "N/A"}
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-md flex-shrink-0 ${account.is_active !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                    {account.is_active !== false ? t("m.active") : t("m.inactive")}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleLoginAsSubAccount(account)}
                                                disabled={loggingInId === accountId}
                                                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black text-[11px] font-black px-4 py-2.5 uppercase tracking-widest transition-all rounded-md shadow-sm disabled:opacity-50 active:scale-95"
                                            >
                                                {loggingInId === accountId ? t("common.loading") : t("m.sign-in")}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto border border-[#ebebeb] rounded-md shadow-sm">
                                <table className="w-full text-left border-collapse bg-white">
                                    <thead className="bg-gray-50 border-b border-[#ebebeb]">
                                        <tr className="h-[50px]">
                                            <th className="px-6 py-3 text-xs font-black text-black uppercase tracking-wider">{t("m.name")}</th>
                                            <th className="px-6 py-3 text-xs font-black text-black uppercase tracking-wider">{t("m.email")}</th>
                                            <th className="px-6 py-3 text-xs font-black text-black uppercase tracking-wider">{t("m.status")}</th>
                                            <th className="px-6 py-3 text-xs font-black text-black uppercase tracking-wider text-center">{t("m.action")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subAccounts.map((account, idx) => {
                                            const accountId = account.entity_id || account.id || account.customer_id || account.sub_account_id;
                                            return (
                                                <tr key={accountId || idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-[#ebebeb] hover:bg-yellow-50/30 transition-colors`}>
                                                    <td className="px-6 py-4 text-xs font-bold text-black uppercase">
                                                        {account.firstname || account.name || "N/A"} {account.lastname || ""}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-medium text-gray-600">
                                                        {account.email || "N/A"}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs">
                                                        <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-md ${account.is_active !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                            {account.is_active !== false ? t("m.active") : t("m.inactive")}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() => handleLoginAsSubAccount(account)}
                                                            disabled={loggingInId === accountId}
                                                            className="bg-yellow-400 hover:bg-yellow-500 text-black text-[10px] font-black px-4 py-2 uppercase tracking-widest transition-all rounded-md shadow-sm disabled:opacity-50 active:scale-95"
                                                        >
                                                            {loggingInId === accountId ? t("common.loading") : t("m.sign-in")}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
