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
        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-primary"></div></div>}>
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

    // Password-change form fields
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");

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
            toast.error(t("account.requiredFields"));
            return;
        }

        // Password-change validation (only when the section is enabled)
        if (changePassword) {
            if (!currentPassword || !newPassword || !confirmNewPassword) {
                toast.error(t("account.allPasswordRequired"));
                return;
            }
            if (newPassword !== confirmNewPassword) {
                toast.error(t("changePassword.mismatch"));
                return;
            }
        }

        setIsSaving(true);
        const toastId = toast.loading(t("account.savingChanges"));

        try {
            // Change Password flow — hits the working endpoint:
            //   POST /api/kleverapi/change-password
            //   → proxies to Magento /rest/{locale}/V1/kleverapi/change-password
            if (changePassword) {
                await api.post("/kleverapi/change-password", {
                    currentPassword,
                    newPassword,
                });
                // Clear sensitive fields after a successful change
                setCurrentPassword("");
                setNewPassword("");
                setConfirmNewPassword("");
            }

            toast.success(
                changePassword
                    ? t("changePassword.success")
                    : t("account.updateSuccess"),
                { id: toastId }
            );
            dispatch(fetchCustomerInfo());
            router.push(lp("/my-account"));
        } catch (error: any) {
            console.error("Save Error:", error);
            toast.error(error.message || t("account.saveFailed"), { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    if (status === "loading" || loading || !customer) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const inputClass = "w-full border border-gray-200 px-4 py-2 text-body-lg focus:border-primary outline-none transition-all rounded-sm bg-white font-medium text-black placeholder:text-black/40";
    const labelClass = "block text-body font-bold text-black mb-1.5";
    const sectionHeader = "bg-white px-4 md:px-6 py-2.5 md:py-3 border-b border-gray-100 text-black font-black uppercase text-body md:text-[15px] tracking-tight";

    return (
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 min-w-full">
            <Sidebar />

            <main className="flex-1 p-6 md:p-12 min-h-0 bg-[#FDFDFD]">
                <div className="w-full">
                    <h1 className="text-h3 sm:text-h2 md:text-h1-sm font-black text-black mb-6 md:mb-10 uppercase tracking-tight">
                        {t("account.editTitle")}
                    </h1>

                    <div className="space-y-6 md:space-y-10">
                        {/* ACCOUNT INFORMATION SECTION - MATCHING SCREENSHOT */}
                        <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden">
                            <div className={sectionHeader}>
                                {t("account.accountInformation")}
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className={labelClass}>
                                        {t("m.first-name")} <span className="text-red-500">*</span>
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
                                        {t("m.last-name")} <span className="text-red-500">*</span>
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
                                                className="w-4 h-4 border-gray-300 rounded focus:ring-primary"
                                                checked={changeEmail}
                                                onChange={(e) => setChangeEmail(e.target.checked)}
                                            />
                                            <span className="text-body-lg font-bold text-black/80 group-hover:text-black transition-colors select-none">
                                                {t("m.change-email")}
                                            </span>
                                        </label>
                                    </div>

                                    {/* Change Password Toggle */}
                                    <div className="space-y-4">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 border-gray-300 rounded focus:ring-primary"
                                                checked={changePassword}
                                                onChange={(e) => setChangePassword(e.target.checked)}
                                            />
                                            <span className="text-body-lg font-bold text-black/80 group-hover:text-black transition-colors select-none">
                                                {t("m.change-password")}
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
                                    {t("account.changeEmailHeading")}
                                </div>

                                <div className="p-4 md:p-8 space-y-4 md:space-y-6">
                                    <div className="space-y-2">
                                        <label className={labelClass}>
                                            {t("m.email")} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            className={inputClass}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder={t("m.email")}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className={labelClass}>
                                            {t("m.current-password")} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            className={inputClass}
                                            placeholder={t("changePassword.currentPassword")}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* DEDICATED CHANGE PASSWORD SECTION - MATCHING NEW SCREENSHOT */}
                        {changePassword && (
                            <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className={sectionHeader}>
                                    {t("account.changePasswordHeading")}
                                </div>

                                <div className="p-4 md:p-8 space-y-4 md:space-y-6">
                                    <div className="space-y-2">
                                        <label className={labelClass}>
                                            {t("m.current-password")} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            className={inputClass}
                                            placeholder={t("changePassword.currentPassword")}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            autoComplete="current-password"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className={labelClass}>
                                            {t("m.new-password")} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            className={inputClass}
                                            placeholder={t("changePassword.newPassword")}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            autoComplete="new-password"
                                        />
                                        <div className="bg-[#f4f4f4] px-4 py-2 text-body-sm font-bold text-black/70 border border-gray-100 italic">
                                            {t("account.passwordStrength")}: {newPassword.length === 0 ? t("account.noPassword") : newPassword.length < 8 ? t("account.weak") : newPassword.length < 12 ? t("account.medium") : t("account.strong")}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className={labelClass}>
                                            {t("m.confirm-new-password")} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            className={inputClass}
                                            placeholder={t("changePassword.confirmNewPassword")}
                                            value={confirmNewPassword}
                                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                                            autoComplete="new-password"
                                        />
                                        {confirmNewPassword.length > 0 && newPassword !== confirmNewPassword && (
                                            <p className="text-red-500 text-label font-semibold">
                                                {t("changePassword.mismatch")}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Save Button */}
                        <div className="pt-4">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-primary hover:bg-black hover:text-white text-black text-body md:text-[15px] font-black px-8 md:px-12 py-3 md:py-3.5 uppercase transition-all rounded-sm shadow-md tracking-wider active:scale-95 w-full sm:w-auto"
                            >
                                {isSaving ? t("account.saving") : t("common.save")}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
