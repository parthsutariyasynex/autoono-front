"use client";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocalePath } from "@/hooks/useLocalePath";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import { api } from "@/lib/api/api-client";

export default function EditAddressPage() {
    const { addressId } = useParams();
    const router = useRouter();
    const { t } = useTranslation();
    const lp = useLocalePath();
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
                // Fetch the list of addresses to find the one with matching ID
                const addresses = await api.get(`/kleverapi/addresses`);

                const data = Array.isArray(addresses)
                    ? addresses.find((a: any) => String(a.id) === String(addressId))
                    : null;

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
                toast.error(err || "Failed to fetch address details");
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
            telephone: !formData.telephone.trim() ? "Phone Number is required" : ""
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
            toast.success("Address updated successfully!");
            router.push(lp("/customer/address-book"));
        } catch (err: any) {
            toast.error(err || "Failed to update address");
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


            <div className="flex flex-col lg:flex-row max-w-[1440px] mx-auto mt-4 md:mt-8">
                {/* Left Sidebar */}
                <Sidebar />

                {/* Right Content */}
                <main className="flex-1 p-4 md:p-8 bg-white min-h-screen">
                    <div className="max-w-[760px]">
                        <h1 className="text-[20px] sm:text-[24px] md:text-[28px] font-bold text-black uppercase tracking-tight mb-4 md:mb-6">
                            EDIT ADDRESS
                        </h1>

                        <div className="border border-gray-200 rounded-sm overflow-hidden">
                            {/* Section Header */}
                            <div className="bg-[#fcfcfc] px-4 md:px-6 py-3 border-b border-gray-200">
                                <h2 className="text-[17px] font-bold text-black uppercase tracking-wide">
                                    CONTACT INFORMATION
                                </h2>
                            </div>

                            <div className="p-4 md:p-8">
                                <form onSubmit={onSubmit} className="space-y-4 md:space-y-6">
                                    {/* First Name */}
                                    <div>
                                        <label className="block text-[14px] font-bold text-[#333] mb-2">
                                            First Name <span className="text-red-600 font-bold">*</span>
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
                                            Last Name <span className="text-red-600 font-bold">*</span>
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
                                            Phone Number <span className="text-red-600 font-bold">*</span>
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
                                            className="bg-[#ffb12b] hover:bg-[#e5a026] text-black text-[14px] font-bold px-6 md:px-10 py-3 uppercase transition-colors rounded-[3px] shadow-sm tracking-wide disabled:opacity-50 flex items-center justify-center w-full sm:w-auto sm:min-w-[180px]"
                                        >
                                            {saving ? (
                                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
                                            ) : (
                                                "SAVE ADDRESS"
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
