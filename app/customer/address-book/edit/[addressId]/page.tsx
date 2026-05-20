"use client";
import { useTranslation } from "@/hooks/useTranslation";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import { api } from "@/lib/api/api-client";

export default function EditAddressPage() {
    return (
        <Suspense fallback={<div className="max-w-xl mx-auto px-4 py-6 space-y-4 animate-pulse">{Array.from({length:6}).map((_,i)=><div key={i} className="h-10 bg-gray-200 rounded-lg"/>)}</div>}>
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
        company: "",
        telephone: "",
        fax: "",
        street: "",
        city: "",
        postcode: "",
        country_id: t("data.Saudi Arabia") === "data.Saudi Arabia" ? "Saudi Arabia" : t("data.Saudi Arabia")
    });

    // Form errors state
    const [errors, setErrors] = useState({
        firstname: "",
        lastname: "",
        telephone: "",
        street: "",
        city: ""
    });

    useEffect(() => {
        const fetchAddress = async () => {
            try {
                setLoading(true);

                if (addressId === "new" || String(addressId) === "new") {
                    setAddressData(null);
                    setFormData({
                        firstname: "",
                        lastname: "",
                        company: "",
                        telephone: "",
                        fax: "",
                        street: "",
                        city: "",
                        postcode: "",
                        country_id: t("data.Saudi Arabia") === "data.Saudi Arabia" ? "Saudi Arabia" : t("data.Saudi Arabia")
                    });
                    setLoading(false);
                    return;
                }

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
                    company: data.company || "",
                    telephone: data.telephone || "",
                    fax: data.fax || "",
                    street: Array.isArray(data.street) ? data.street[0] || "" : data.street || "",
                    city: data.city || "",
                    postcode: data.postcode || "",
                    country_id: data.country_id === "SA" ? (t("data.Saudi Arabia") === "data.Saudi Arabia" ? "Saudi Arabia" : t("data.Saudi Arabia")) : (data.country_id || (t("data.Saudi Arabia") === "data.Saudi Arabia" ? "Saudi Arabia" : t("data.Saudi Arabia"))),
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));

        // Clear error when typing
        if (value.trim() && name in errors) {
            setErrors((prev) => ({
                ...prev,
                [name]: ""
            }));
        }
    };

    const validate = () => {
        const newErrors = {
            firstname: !formData.firstname.trim() ? (t("addressBook.firstNameRequired") === "addressBook.firstNameRequired" ? "First Name is required" : t("addressBook.firstNameRequired")) : "",
            lastname: !formData.lastname.trim() ? (t("addressBook.lastNameRequired") === "addressBook.lastNameRequired" ? "Last Name is required" : t("addressBook.lastNameRequired")) : "",
            telephone: !formData.telephone.trim() ? (t("addressBook.phoneRequired") === "addressBook.phoneRequired" ? "Phone Number is required" : t("addressBook.phoneRequired")) : "",
            street: !formData.street.trim() ? (t("addressBook.streetRequired") === "addressBook.streetRequired" ? "Street Address is required" : t("addressBook.streetRequired")) : "",
            city: !formData.city.trim() ? (t("addressBook.cityRequired") === "addressBook.cityRequired" ? "City is required" : t("addressBook.cityRequired")) : ""
        };

        setErrors(newErrors);
        return !newErrors.firstname && !newErrors.lastname && !newErrors.telephone && !newErrors.street && !newErrors.city;
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        try {
            setSaving(true);

            const resolvedCountryCode = formData.country_id === "Saudi Arabia" || formData.country_id === t("data.Saudi Arabia") || formData.country_id === t("Saudi Arabia") ? "SA" : (formData.country_id === "SA" ? "SA" : "SA");

            if (addressId === "new" || String(addressId) === "new") {
                const newPayload = {
                    address: {
                        firstname: formData.firstname.trim(),
                        lastname: formData.lastname.trim(),
                        company: formData.company.trim(),
                        telephone: formData.telephone.trim(),
                        fax: formData.fax.trim(),
                        street: [formData.street.trim()],
                        city: formData.city.trim(),
                        postcode: formData.postcode.trim() || "12345",
                        country_id: resolvedCountryCode,
                        default_shipping: true,
                        default_billing: true
                    }
                };

                await api.post(`/kleverapi/addresses`, newPayload);
                toast.success(t("addressBook.addressAdded") === "addressBook.addressAdded" ? "Address added successfully" : t("addressBook.addressAdded"));
            } else {
                const updatePayload = {
                    address: {
                        ...addressData,
                        firstname: formData.firstname.trim(),
                        lastname: formData.lastname.trim(),
                        company: formData.company.trim(),
                        telephone: formData.telephone.trim(),
                        fax: formData.fax.trim(),
                        street: [formData.street.trim()],
                        city: formData.city.trim(),
                        postcode: formData.postcode.trim() || addressData?.postcode || "12345",
                        country_id: resolvedCountryCode,
                    }
                };

                await api.put(`/kleverapi/addresses/${addressId}`, updatePayload);
                toast.success(t("addressBook.addressUpdated") === "addressBook.addressUpdated" ? "Address updated successfully" : t("addressBook.addressUpdated"));
            }

            // Redirect back to original page or address book
            const redirectUrl = searchParams.get("redirect") || "/customer/address-book";
            router.push(redirectUrl);
        } catch (err: any) {
            toast.error(err || (addressId === "new" ? (t("addressBook.addressAddFailed") === "addressBook.addressAddFailed" ? "Failed to add address" : t("addressBook.addressAddFailed")) : (t("addressBook.addressUpdateFailed") === "addressBook.addressUpdateFailed" ? "Failed to update address" : t("addressBook.addressUpdateFailed"))));
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <>

                <div className="flex items-center justify-center min-h-[calc(100vh-100px)] mt-4 md:mt-8">
                    <div className="max-w-xl mx-auto px-4 py-4 space-y-3 animate-pulse">{Array.from({length:5}).map((_,i)=><div key={i} className="h-10 bg-gray-200 rounded-lg"/>)}</div>
                </div>
            </>
        );
    }

    return (
        <div className="min-h-screen bg-white text-black">


            <div className="flex flex-col lg:flex-row flex-1 min-h-0 w-full min-w-full">
                <Sidebar />

                <main className="flex-1 w-full min-w-0 p-4 md:p-10 bg-white">
                    <div className="max-w-3xl mx-auto ltr:ml-0 rtl:mr-0">
                        <h1 className="text-h3 md:text-h1 font-bold text-black uppercase tracking-tight mb-6 md:mb-8 px-1 md:px-0 ltr:text-left rtl:text-right">
                            {addressId === "new" || String(addressId) === "new" ? (t("addressBook.addAddress") === "addressBook.addAddress" ? "ADD NEW ADDRESS" : t("addressBook.addAddress")) : (t("addressBook.editAddress") === "addressBook.editAddress" ? "EDIT ADDRESS" : t("addressBook.editAddress"))}
                        </h1>

                        <div className="bg-white border border-gray-200 shadow-sm rounded-[3px] overflow-hidden">
                            <form onSubmit={onSubmit}>
                                {/* Section 1 Header */}
                                <div className="bg-[#f5f5f5] px-6 py-3.5 border-b border-gray-200">
                                    <h2 className="text-xs font-bold text-black uppercase tracking-wider ltr:text-left rtl:text-right">
                                        {t("addressBook.contactInformation") === "addressBook.contactInformation" ? "CONTACT INFORMATION" : t("addressBook.contactInformation")}
                                    </h2>
                                </div>

                                {/* Section 1 Body */}
                                <div className="p-6 space-y-5">
                                    {/* First Name */}
                                    <div>
                                        <label className="block text-xs font-bold text-black mb-1.5 ltr:text-left rtl:text-right">
                                            {t("addressBook.firstName") === "addressBook.firstName" ? "First Name" : t("addressBook.firstName")} <span className="text-red-600 font-bold">*</span>
                                        </label>
                                        <input
                                            name="firstname"
                                            value={formData.firstname}
                                            onChange={handleInputChange}
                                            type="text"
                                            className={`w-full p-2.5 border ${errors.firstname ? 'border-red-500' : 'border-gray-200'} rounded-[3px] focus:outline-none focus:border-[#3b71a8] text-sm text-black ltr:text-left rtl:text-right`}
                                            placeholder=""
                                        />
                                        {errors.firstname && (
                                            <p className="mt-1 text-xs text-red-500 ltr:text-left rtl:text-right">{errors.firstname}</p>
                                        )}
                                    </div>

                                    {/* Last Name */}
                                    <div>
                                        <label className="block text-xs font-bold text-black mb-1.5 ltr:text-left rtl:text-right">
                                            {t("addressBook.lastName") === "addressBook.lastName" ? "Last Name" : t("addressBook.lastName")} <span className="text-red-600 font-bold">*</span>
                                        </label>
                                        <input
                                            name="lastname"
                                            value={formData.lastname}
                                            onChange={handleInputChange}
                                            type="text"
                                            className={`w-full p-2.5 border ${errors.lastname ? 'border-red-500' : 'border-gray-200'} rounded-[3px] focus:outline-none focus:border-[#3b71a8] text-sm text-black ltr:text-left rtl:text-right`}
                                            placeholder=""
                                        />
                                        {errors.lastname && (
                                            <p className="mt-1 text-xs text-red-500 ltr:text-left rtl:text-right">{errors.lastname}</p>
                                        )}
                                    </div>

                                    {/* Company */}
                                    <div>
                                        <label className="block text-xs font-bold text-black mb-1.5 ltr:text-left rtl:text-right">
                                            {t("addressBook.company") === "addressBook.company" ? "Company" : t("addressBook.company")}
                                        </label>
                                        <input
                                            name="company"
                                            value={formData.company}
                                            onChange={handleInputChange}
                                            type="text"
                                            className="w-full p-2.5 border border-gray-200 rounded-[3px] focus:outline-none focus:border-[#3b71a8] text-sm text-black ltr:text-left rtl:text-right"
                                            placeholder=""
                                        />
                                    </div>

                                    {/* Phone Number */}
                                    <div>
                                        <label className="block text-xs font-bold text-black mb-1.5 ltr:text-left rtl:text-right">
                                            {t("addressBook.phoneNumber") === "addressBook.phoneNumber" ? "Phone Number" : t("addressBook.phoneNumber")} <span className="text-red-600 font-bold">*</span>
                                        </label>
                                        <input
                                            name="telephone"
                                            value={formData.telephone}
                                            onChange={handleInputChange}
                                            type="tel"
                                            dir="ltr"
                                            className={`w-full p-2.5 border ${errors.telephone ? 'border-red-500' : 'border-gray-200'} rounded-[3px] focus:outline-none focus:border-[#3b71a8] text-sm text-black ltr:text-left rtl:text-right`}
                                            placeholder="966 xxxxxxxxx"
                                        />
                                        {errors.telephone && (
                                            <p className="mt-1 text-xs text-red-500 ltr:text-left rtl:text-right">{errors.telephone}</p>
                                        )}
                                    </div>

                                    {/* Fax */}
                                    <div>
                                        <label className="block text-xs font-bold text-black mb-1.5 ltr:text-left rtl:text-right">
                                            {t("addressBook.fax") === "addressBook.fax" ? "Fax" : t("addressBook.fax")}
                                        </label>
                                        <input
                                            name="fax"
                                            value={formData.fax}
                                            onChange={handleInputChange}
                                            type="text"
                                            className="w-full p-2.5 border border-gray-200 rounded-[3px] focus:outline-none focus:border-[#3b71a8] text-sm text-black ltr:text-left rtl:text-right"
                                            placeholder=""
                                        />
                                    </div>
                                </div>

                                {/* Section 2 Header */}
                                <div className="bg-[#f5f5f5] px-6 py-3.5 border-t border-b border-gray-200">
                                    <h2 className="text-xs font-bold text-black uppercase tracking-wider ltr:text-left rtl:text-right">
                                        {t("addressBook.address") === "addressBook.address" ? "ADDRESS" : t("addressBook.address")}
                                    </h2>
                                </div>

                                {/* Section 2 Body */}
                                <div className="p-6 space-y-5">
                                    {/* Street Address */}
                                    <div>
                                        <label className="block text-xs font-bold text-black mb-1.5 ltr:text-left rtl:text-right">
                                            {t("addressBook.streetAddress") === "addressBook.streetAddress" ? "Street Address" : t("addressBook.streetAddress")} <span className="text-red-600 font-bold">*</span>
                                        </label>
                                        <input
                                            name="street"
                                            value={formData.street}
                                            onChange={handleInputChange}
                                            type="text"
                                            className={`w-full p-2.5 border ${errors.street ? 'border-red-500' : 'border-gray-200'} rounded-[3px] focus:outline-none focus:border-[#3b71a8] text-sm text-black ltr:text-left rtl:text-right`}
                                            placeholder=""
                                        />
                                        {errors.street && (
                                            <p className="mt-1 text-xs text-red-500 ltr:text-left rtl:text-right">{errors.street}</p>
                                        )}
                                    </div>

                                    {/* City */}
                                    <div>
                                        <label className="block text-xs font-bold text-black mb-1.5 ltr:text-left rtl:text-right">
                                            {t("addressBook.city") === "addressBook.city" ? "City" : t("addressBook.city")} <span className="text-red-600 font-bold">*</span>
                                        </label>
                                        <input
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            type="text"
                                            className={`w-full p-2.5 border ${errors.city ? 'border-red-500' : 'border-gray-200'} rounded-[3px] focus:outline-none focus:border-[#3b71a8] text-sm text-black ltr:text-left rtl:text-right`}
                                            placeholder=""
                                        />
                                        {errors.city && (
                                            <p className="mt-1 text-xs text-red-500 ltr:text-left rtl:text-right">{errors.city}</p>
                                        )}
                                    </div>

                                    {/* Zip Code / Postcode */}
                                    <div>
                                        <label className="block text-xs font-bold text-black mb-1.5 ltr:text-left rtl:text-right">
                                            {t("addressBook.zipCode") === "addressBook.zipCode" ? "Zip/Postal Code" : t("addressBook.zipCode")}
                                        </label>
                                        <input
                                            name="postcode"
                                            value={formData.postcode}
                                            onChange={handleInputChange}
                                            type="text"
                                            className="w-full p-2.5 border border-gray-200 rounded-[3px] focus:outline-none focus:border-[#3b71a8] text-sm text-black ltr:text-left rtl:text-right"
                                            placeholder=""
                                        />
                                    </div>

                                    {/* Country */}
                                    <div>
                                        <label className="block text-xs font-bold text-black mb-1.5 ltr:text-left rtl:text-right">
                                            {t("addressBook.country") === "addressBook.country" ? "Country" : t("addressBook.country")} <span className="text-red-600 font-bold">*</span>
                                        </label>
                                        <input
                                            name="country_id"
                                            value={formData.country_id}
                                            onChange={handleInputChange}
                                            type="text"
                                            className="w-full p-2.5 border border-gray-200 rounded-[3px] focus:outline-none focus:border-[#3b71a8] text-sm text-black ltr:text-left rtl:text-right"
                                            placeholder={t("data.Saudi Arabia") === "data.Saudi Arabia" ? "Saudi Arabia" : t("data.Saudi Arabia")}
                                        />
                                    </div>

                                    {/* Save Button */}
                                    <div className="pt-4 ltr:text-left rtl:text-right">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="bg-[#3b71a8] hover:bg-[#2c557e] text-white text-xs font-bold px-8 py-3 uppercase transition-colors rounded-[3px] shadow-sm tracking-wider disabled:opacity-50 flex items-center justify-center min-w-[160px]"
                                        >
                                            <span className={saving ? "opacity-50" : ""}>{t("addressBook.saveAddress") === "addressBook.saveAddress" ? "SAVE ADDRESS" : t("addressBook.saveAddress")}</span>
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
