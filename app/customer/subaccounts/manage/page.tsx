"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useSession } from "next-auth/react";
import Navbar from "@/app/components/Navbar";
import Sidebar from "@/components/Sidebar";

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
    const { data: session, status } = useSession();
    const token = useSelector((state: RootState) => state.auth.token);

    const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [loggingInId, setLoggingInId] = useState<string | number | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/login");
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
                    setError(data.message || "Failed to fetch sub-accounts");
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
                setError(err.message || "Failed to fetch sub-accounts");
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
            alert("Could not find sub-account ID. Check console for API response structure.");
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
                alert(data.message || "Failed to login as sub-account");
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
            router.push("/subaccount/my-account");
        } catch (err: any) {
            alert(err.message || "Failed to login as sub-account");
            setLoggingInId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5B21B]"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-['Rubik',sans-serif]">
            <Navbar />

            <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)]">
                <Sidebar />

                <main className="flex-1 p-8 bg-white max-w-[1200px]">
                    <h1 className="text-[20px] font-black text-black mb-6 uppercase tracking-tight">
                        MANAGE ACCOUNTS
                    </h1>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
                            <p className="text-[14px] font-medium">{error}</p>
                        </div>
                    )}

                    {subAccounts.length === 0 && !error ? (
                        <div className="text-gray-500 text-[14px] py-8">
                            No sub-accounts found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border border-gray-200">
                                <thead>
                                    <tr className="bg-[#f5f5f5] border-b border-gray-200">
                                        <th className="text-left px-4 py-3 text-[12px] font-bold text-black uppercase">Name</th>
                                        <th className="text-left px-4 py-3 text-[12px] font-bold text-black uppercase">Email</th>
                                        <th className="text-left px-4 py-3 text-[12px] font-bold text-black uppercase">Status</th>
                                        <th className="text-left px-4 py-3 text-[12px] font-bold text-black uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subAccounts.map((account, idx) => {
                                        const accountId = account.entity_id || account.id || account.customer_id || account.sub_account_id;
                                        return (
                                        <tr key={accountId || idx} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="px-4 py-3 text-[13px] text-gray-800">
                                                {account.firstname || account.name || "N/A"} {account.lastname || ""}
                                            </td>
                                            <td className="px-4 py-3 text-[13px] text-gray-800">
                                                {account.email || "N/A"}
                                            </td>
                                            <td className="px-4 py-3 text-[13px]">
                                                <span className={`px-2 py-1 text-[11px] font-bold uppercase rounded-sm ${account.is_active !== false
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                                    }`}>
                                                    {account.is_active !== false ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => handleLoginAsSubAccount(account)}
                                                    disabled={loggingInId === accountId}
                                                    className="bg-[#F5B21B] hover:bg-black hover:text-white text-black text-[11px] font-bold px-4 py-2 uppercase transition-all rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {loggingInId === accountId ? "Logging in..." : "Login As"}
                                                </button>
                                            </td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </main>
            </div>

        </div>
    );
}
