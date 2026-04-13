"use client";
import { useTranslation } from "@/hooks/useTranslation";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import { api } from "@/lib/api/api-client";

export default function EditAddressPage() {
    return (
        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#f5a623]"></div></div>}>
            <EditAddressPageContent />
        </Suspense>
    );
}

function EditAddressPageContent() {
    const { addressId } = useParams();
    const router = useRouter();
    const { t } = useTranslation();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [addressData, setAddressData] = useState<any>(null);

    // Form data state
    const [formData, setFormData] = useState({
        firstname: "",
        lastname: "",
        telephone: ""
    });

    // Form errors state
    const [errors, setErrors] = useState({
        firstname: "",
        lastname: "",
        telephone: ""
    });

    useEffect(() => {
        const fetchAddress = async () => {
            try {
                setLoading(true);

                let data = null;

                // Check if this is a sub-account session — address may be in localStorage
                const isSubAccount = typeof window !== "undefined" && localStorage.getItem("isSubAccount") === "true";
                if (isSubAccount) {
                    const storedData = localStorage.getItem("subAccountData");
                    if (storedData) {
                        const parsed = JSON.parse(storedData);
                        const subCustomer = parsed.customer || parsed;
                        const subAddresses = subCustomer.addresses || [];
                        data = subAddresses.find((a: any) => String(a.id) === String(addressId));
                    }
                }

                // If not found in sub-account data, fetch from parent API
                if (!data) {
                    const addresses = await api.get(`/kleverapi/addresses`);
                    data = Array.isArray(addresses)
                        ? addresses.find((a: any) => String(a.id) === String(addressId))
                        : null;
                }

                if (!data) {
                    throw new Error("Address not found");
                }

                setAddressData(data);
                setFormData({
                    firstname: data.firstname || "",
                    lastname: data.lastname || "",
                    telephone: data.telephone || "",
                });
            } catch (err: any) {
                toast.error(err || t("addressBook.addressFetchFailed"));
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (addressId) {
            fetchAddress();
        }
    }, [addressId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));

        // Clear error when typing
        if (value.trim()) {
            setErrors((prev) => ({
                ...prev,
                [name]: ""
            }));
        }
    };

    const validate = () => {
        const newErrors = {
            firstname: !formData.firstname.trim() ? t("addressBook.firstNameRequired") : "",
            lastname: !formData.lastname.trim() ? t("addressBook.lastNameRequired") : "",
            telephone: !formData.telephone.trim() ? t("addressBook.phoneRequired") : ""
        };

        setErrors(newErrors);
        return !newErrors.firstname && !newErrors.lastname && !newErrors.telephone;
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        try {
            setSaving(true);
            const updatePayload = {
                address: {
                    ...addressData,
                    firstname: formData.firstname,
                    lastname: formData.lastname,
                    telephone: formData.telephone,
                }
            };

            await api.put(`/kleverapi/addresses/${addressId}`, updatePayload);
            toast.success(t("addressBook.addressUpdated"));

            // Redirect back to original page or address book
            const redirectUrl = searchParams.get("redirect") || "/customer/address-book";
            router.push(redirectUrl);
        } catch (err: any) {
            toast.error(err || t("addressBook.addressUpdateFailed"));
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <>

                <div className="flex items-center justify-center min-h-[calc(100vh-100px)] mt-4 md:mt-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f5a623]"></div>
                </div>
            </>
        );
    }

    return (
        <div className="min-h-screen bg-white font-['Rubik'] text-[#333]">


            <div className="flex flex-col lg:flex-row flex-1 min-h-0 w-full min-w-full">
                <Sidebar />

                <main className="flex-1 w-full min-w-0 p-4 md:p-10 bg-[#fdfdfd]">
                    <h1 className="text-[22px] md:text-[32px] font-black text-black uppercase tracking-tight mb-6 md:mb-10 px-1 md:px-0">
                        {t("addressBook.editAddress")}
                    </h1>

                    <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden max-w-4xl">
                        {/* Section Header */}
                        <div className="bg-white px-5 md:px-8 py-3.5 md:py-4 border-b border-gray-100">
                            <h2 className="text-[14px] md:text-[16px] font-black text-black uppercase tracking-tight">
                                {t("addressBook.contactInformation")}
                            </h2>
                        </div>

                        <div className="p-5 md:p-10">
                            <form onSubmit={onSubmit} className="space-y-6 md:space-y-8">
                                {/* First Name */}
                                <div>
                                    <label className="block text-[14px] font-bold text-[#333] mb-2">
                                        {t("addressBook.firstName")} <span className="text-red-600 font-bold">*</span>
                                    </label>
                                    <input
                                        name="firstname"
                                        value={formData.firstname}
                                        onChange={handleInputChange}
                                        type="text"
                                        className={`w-full p-2.5 md:p-3 border ${errors.firstname ? 'border-red-500' : 'border-gray-300'} rounded-sm focus:outline-none focus:border-[#f5a623] text-sm text-gray-700`}
                                        placeholder={t("addressBook.firstName")}
                                    />
                                    {errors.firstname && (
                                        <p className="mt-1 text-xs text-red-500">{errors.firstname}</p>
                                    )}
                                </div>

                                {/* Last Name */}
                                <div>
                                    <label className="block text-[14px] font-bold text-[#333] mb-2">
                                        {t("addressBook.lastName")} <span className="text-red-600 font-bold">*</span>
                                    </label>
                                    <input
                                        name="lastname"
                                        value={formData.lastname}
                                        onChange={handleInputChange}
                                        type="text"
                                        className={`w-full p-2.5 md:p-3 border ${errors.lastname ? 'border-red-500' : 'border-gray-300'} rounded-sm focus:outline-none focus:border-[#f5a623] text-sm text-gray-700`}
                                        placeholder={t("addressBook.lastName")}
                                    />
                                    {errors.lastname && (
                                        <p className="mt-1 text-xs text-red-500">{errors.lastname}</p>
                                    )}
                                </div>

                                {/* Phone Number */}
                                <div>
                                    <label className="block text-[14px] font-bold text-[#333] mb-2">
                                        {t("addressBook.phoneNumber")} <span className="text-red-600 font-bold">*</span>
                                    </label>
                                    <input
                                        name="telephone"
                                        value={formData.telephone}
                                        onChange={handleInputChange}
                                        type="tel"
                                        className={`w-full p-2.5 md:p-3 border ${errors.telephone ? 'border-red-500' : 'border-gray-300'} rounded-sm focus:outline-none focus:border-[#f5a623] text-sm text-gray-700`}
                                        placeholder={t("addressBook.phoneNumber")}
                                    />
                                    {errors.telephone && (
                                        <p className="mt-1 text-xs text-red-500">{errors.telephone}</p>
                                    )}
                                </div>

                                {/* Save Button */}
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="w-full sm:w-auto bg-[#ffb12b] hover:bg-[#e5a026] text-black text-[14px] font-bold px-6 sm:px-10 py-2.5 md:py-3 uppercase transition-colors rounded-[3px] shadow-sm tracking-wide disabled:opacity-50 flex items-center justify-center min-w-[180px]"
                                    >
                                        {saving ? (
                                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
                                        ) : (
                                            t("addressBook.saveAddress")
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
