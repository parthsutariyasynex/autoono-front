"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "@/app/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { RootState } from "@/store/store";
import { fetchCustomerInfo } from "@/store/actions/customerActions";
import { axiosPost } from "@/store/axiosHelper";
import toast from "react-hot-toast";

export default function EditAccountPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useDispatch();
    const { data: session, status } = useSession();
    const { data: customer, loading } = useSelector((state: RootState) => state.customer);
    const token = useSelector((state: RootState) => state.auth.token);

    // Form States
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [isChangeEmail, setIsChangeEmail] = useState(false);
    const [isChangePassword, setIsChangePassword] = useState(searchParams.get("change") === "password");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/login");
            return;
        }

        if (status === "authenticated" && token && !customer) {
            // @ts-ignore
            dispatch(fetchCustomerInfo());
        }
    }, [dispatch, status, router, token, customer]);

    useEffect(() => {
        if (customer) {
            setFirstName(customer.firstname || "");
            setLastName(customer.lastname || "");
            setEmail(customer.email || "");
        }
    }, [customer]);

    const handleSave = async () => {
        // Validation
        if (!firstName || !lastName) {
            toast.error("First name and last name are required");
            return;
        }

        if (isChangeEmail && !email) {
            toast.error("Email is required for change");
            return;
        }

        if (isChangePassword) {
            if (!currentPassword) {
                toast.error("Current password is required to change password");
                return;
            }
            if (!newPassword || !confirmPassword) {
                toast.error("New password and confirmation are required");
                return;
            }
            if (newPassword !== confirmPassword) {
                toast.error("New passwords do not match");
                return;
            }
        }

        setIsSaving(true);

        try {
            // 1. If password change is requested, call the specific change-password API
            if (isChangePassword) {
                const passRes = await new Promise<any>((resolve) => {
                    axiosPost({
                        url: "/change-password",
                        reqBody: {
                            current_password: currentPassword,
                            new_password: newPassword,
                        }
                    }, resolve);
                });

                if (passRes.status !== 200) {
                    throw new Error(passRes.data?.message || "Failed to change password");
                }
                toast.success("Password updated successfully");
            }

            // 2. Call the general my-account API for name/email update
            const profilePayload: any = {
                customer: {
                    firstname: firstName,
                    lastname: lastName,
                    email: email,
                }
            };

            // If email is changing, Magento needs current password for security
            if (isChangeEmail) {
                profilePayload.currentPassword = currentPassword;
            }

            const profileRes = await new Promise<any>((resolve) => {
                axiosPost({
                    url: "/my-account",
                    reqBody: profilePayload
                }, resolve);
            });

            if (profileRes.status !== 200) {
                throw new Error(profileRes.data?.message || "Failed to update profile information");
            }

            toast.success("Profile information updated successfully");

            // Finalizing
            // @ts-ignore
            dispatch(fetchCustomerInfo());
            router.push("/customer/account");

        } catch (error: any) {
            console.error("Update Error:", error);
            toast.error(error.message || "An error occurred while saving");
        } finally {
            setIsSaving(false);
        }
    };

    if (status === "loading" || loading || !customer) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="p-10 text-center font-['Rubik']">Loading...</div>
            </div>
        );
    }

    const inputClass = "w-full border border-gray-300 px-4 py-2 text-sm focus:border-yellow-400 outline-none transition-colors rounded-sm";
    const labelClass = "block text-sm font-semibold text-gray-700 mb-1";
    const buttonYellow = "bg-[#F5B21B] hover:bg-yellow-500 text-black text-[13px] font-bold px-8 py-3 uppercase transition-all rounded-sm shadow-sm tracking-[1px] disabled:opacity-50";

    return (
        <div className="min-h-screen bg-white font-['Rubik']">
            <Navbar />

            <div className="flex max-w-[1440px] mx-auto mt-[100px]">
                <Sidebar />

                <main className="flex-1 p-8 bg-[#fcfcfc] min-h-screen">
                    <div className="max-w-[700px]">
                        <h1 className="text-2xl font-black text-gray-900 mb-8 uppercase tracking-[1px]">
                            Edit Account Information
                        </h1>

                        <div className="bg-white border border-gray-200 shadow-sm overflow-hidden rounded-sm">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <h2 className="text-[14px] font-black text-black uppercase tracking-[1px]">
                                    Account Information
                                </h2>
                            </div>

                            <div className="p-8 space-y-6">
                                {/* First Name */}
                                <div className="space-y-1">
                                    <label className={labelClass}>First Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                    />
                                </div>

                                {/* Last Name */}
                                <div className="space-y-1">
                                    <label className={labelClass}>Last Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                    />
                                </div>

                                {/* Checkboxes */}
                                <div className="space-y-3 pt-2">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                className="peer hidden"
                                                checked={isChangeEmail}
                                                onChange={(e) => setIsChangeEmail(e.target.checked)}
                                            />
                                            <div className="w-5 h-5 border-2 border-gray-300 rounded-sm peer-checked:bg-[#F5B21B] peer-checked:border-[#F5B21B] transition-all"></div>
                                            <svg className="absolute top-1 left-1 w-3 h-3 text-black opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                                <path d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-black transition-colors">Change Email</span>
                                    </label>

                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                className="peer hidden"
                                                checked={isChangePassword}
                                                onChange={(e) => setIsChangePassword(e.target.checked)}
                                            />
                                            <div className="w-5 h-5 border-2 border-gray-300 rounded-sm peer-checked:bg-[#F5B21B] peer-checked:border-[#F5B21B] transition-all"></div>
                                            <svg className="absolute top-1 left-1 w-3 h-3 text-black opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                                <path d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-black transition-colors">Change Password</span>
                                    </label>
                                </div>

                                {/* Change Email Section */}
                                {isChangeEmail && (
                                    <div className="space-y-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="space-y-1">
                                            <label className={labelClass}>Email <span className="text-red-500">*</span></label>
                                            <input
                                                type="email"
                                                className={inputClass}
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                        {!isChangePassword && (
                                            <div className="space-y-1">
                                                <label className={labelClass}>Current Password <span className="text-red-500">*</span></label>
                                                <input
                                                    type="password"
                                                    className={inputClass}
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Change Password Separate Box */}
                        {isChangePassword && (
                            <div className="mt-8 bg-white border border-gray-200 shadow-sm overflow-hidden rounded-sm animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-[14px] font-black text-black uppercase tracking-[1px]">
                                        Change Password
                                    </h2>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div className="space-y-1">
                                        <label className={labelClass}>Current Password <span className="text-red-500">*</span></label>
                                        <input
                                            type="password"
                                            className={inputClass}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={labelClass}>New Password <span className="text-red-500">*</span></label>
                                        <input
                                            type="password"
                                            className={inputClass}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                        {/* Password Strength Bar */}
                                        <div className="mt-2 bg-gray-100 h-8 flex items-center px-3 rounded-sm border border-gray-200">
                                            <span className="text-[12px] font-medium text-gray-600">
                                                Password Strength: {newPassword ? (newPassword.length > 8 ? "Strong" : "Medium") : "No Password"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={labelClass}>Confirm New Password <span className="text-red-500">*</span></label>
                                        <input
                                            type="password"
                                            className={inputClass}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-8">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className={buttonYellow}
                            >
                                {isSaving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
