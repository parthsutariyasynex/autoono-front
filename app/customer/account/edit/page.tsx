"use client";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocalePath } from "@/hooks/useLocalePath";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "@/components/Sidebar";
import { RootState, AppDispatch } from "@/store/store";
import { fetchCustomerInfo } from "@/store/actions/customerActions";
import { api } from "@/lib/api/api-client";
import toast from "react-hot-toast";
import { redirectToLogin } from "@/utils/helpers";

export default function EditAccountPage() {
    return (
        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#f5a623]"></div></div>}>
            <EditAccountPageContent />
        </Suspense>
    );
}

function EditAccountPageContent() {
    const router = useRouter();
    const { t } = useTranslation();
    const lp = useLocalePath();
    const searchParams = useSearchParams();
    const dispatch = useDispatch<AppDispatch>();
    const { data: session, status } = useSession();
    const { data: customer, loading } = useSelector((state: RootState) => state.customer);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // Basic Account Info
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");

    const [isSaving, setIsSaving] = useState(false);
    const [changeEmail, setChangeEmail] = useState(false);
    const [changePassword, setChangePassword] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            redirectToLogin(router);
            return;
        }

        if (status === "authenticated" && token && !customer) {
            dispatch(fetchCustomerInfo());
        }
    }, [dispatch, status, router, token, customer]);

    useEffect(() => {
        if (customer) {
            setFirstName(customer.firstname || "");
            setLastName(customer.lastname || "");
            setEmail(customer.email || "");
        }

        // Handle deep-linking from Change Password / Change Email buttons
        const changeType = searchParams.get("change");
        if (changeType === "password") setChangePassword(true);
        if (changeType === "email") setChangeEmail(true);
    }, [status, token, customer, searchParams]);

    const handleSave = async () => {
        if (!firstName || !lastName) {
            toast.error("Required fields are missing");
            return;
        }

        setIsSaving(true);
        const toastId = toast.loading("Saving changes...");

        try {
            // 1. Update Profile (Name/Email)
            const profilePayload: any = {
                customer: {
                    ...customer,
                    firstname: firstName,
                    lastname: lastName,
                }
            };

            // Only send these if they were checked and fields would be provided (logic can be expanded)
            if (changeEmail) profilePayload.customer.email = email;

            await api.post("/kleverapi/my-account", profilePayload);

            toast.success("Account information updated successfully", { id: toastId });
            dispatch(fetchCustomerInfo());
            router.push(lp("/customer/account"));
        } catch (error: any) {
            console.error("Save Error:", error);
            toast.error(error.message || "Failed to update account", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    if (status === "loading" || loading || !customer) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5B21B]"></div>
            </div>
        );
    }

    const inputClass = "w-full border border-gray-200 px-4 py-2 text-[14px] focus:border-[#F5B21B] outline-none transition-all rounded-sm bg-white font-medium text-gray-800 placeholder:text-gray-300";
    const labelClass = "block text-[13px] font-bold text-gray-900 mb-1.5";
    const sectionHeader = "bg-white px-4 md:px-6 py-2.5 md:py-3 border-b border-gray-100 text-black font-black uppercase text-[13px] md:text-[15px] tracking-tight";

    return (
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 min-w-full">
            <Sidebar />

            <main className="flex-1 p-6 md:p-12 min-h-0 bg-[#FDFDFD]">
                <div className="w-full">
                    <h1 className="text-[20px] sm:text-[24px] md:text-[28px] font-black text-black mb-6 md:mb-10 uppercase tracking-tight">
                        Edit Account Information
                    </h1>

                    <div className="space-y-6 md:space-y-10">
                        {/* ACCOUNT INFORMATION SECTION - MATCHING SCREENSHOT */}
                        <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden">
                            <div className={sectionHeader}>
                                ACCOUNT INFORMATION
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className={labelClass}>
                                        First Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className={labelClass}>
                                        Last Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-4 pt-2">
                                    {/* Change Email Toggle */}
                                    <div className="space-y-4">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 border-gray-300 rounded focus:ring-[#F5B21B]"
                                                checked={changeEmail}
                                                onChange={(e) => setChangeEmail(e.target.checked)}
                                            />
                                            <span className="text-[14px] font-bold text-gray-700 group-hover:text-black transition-colors select-none">
                                                Change Email
                                            </span>
                                        </label>
                                    </div>

                                    {/* Change Password Toggle */}
                                    <div className="space-y-4">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 border-gray-300 rounded focus:ring-[#F5B21B]"
                                                checked={changePassword}
                                                onChange={(e) => setChangePassword(e.target.checked)}
                                            />
                                            <span className="text-[14px] font-bold text-gray-700 group-hover:text-black transition-colors select-none">
                                                Change Password
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DEDICATED CHANGE EMAIL SECTION - MATCHING NEW SCREENSHOT */}
                        {changeEmail && (
                            <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className={sectionHeader}>
                                    CHANGE EMAIL
                                </div>

                                <div className="p-4 md:p-8 space-y-4 md:space-y-6">
                                    <div className="space-y-2">
                                        <label className={labelClass}>
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            className={inputClass}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter new email address"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className={labelClass}>
                                            Current Password <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            className={inputClass}
                                            placeholder="Enter current password"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* DEDICATED CHANGE PASSWORD SECTION - MATCHING NEW SCREENSHOT */}
                        {changePassword && (
                            <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className={sectionHeader}>
                                    CHANGE PASSWORD
                                </div>

                                <div className="p-4 md:p-8 space-y-4 md:space-y-6">
                                    <div className="space-y-2">
                                        <label className={labelClass}>
                                            Current Password <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            className={inputClass}
                                            placeholder="Enter current password"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className={labelClass}>
                                            New Password <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            className={inputClass}
                                            placeholder="Enter new password"
                                        />
                                        <div className="bg-[#f4f4f4] px-4 py-2 text-[12px] font-bold text-gray-600 border border-gray-100 italic">
                                            Password Strength: No Password
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className={labelClass}>
                                            Confirm New Password <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            className={inputClass}
                                            placeholder="Confirm new password"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Save Button */}
                        <div className="pt-4">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-[#F5B21B] hover:bg-black hover:text-white text-black text-[13px] md:text-[15px] font-black px-8 md:px-12 py-3 md:py-3.5 uppercase transition-all rounded-sm shadow-md tracking-wider active:scale-95 w-full sm:w-auto"
                            >
                                {isSaving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
