"use client";

import React from "react";
import { Check } from "lucide-react";
import { Address } from "@/modules/checkout/hooks/useCheckout";

interface SelectedAddressCardProps {
    address: Address;
    onEdit: () => void;
}

const SelectedAddressCard: React.FC<SelectedAddressCardProps> = ({ address, onEdit }) => {
    return (
        <div className="relative flex items-center justify-between w-full p-6 bg-[#F8F9FA] border-2 border-[#00A651] rounded-sm transition-all duration-300">
            {/* Green Square Box with Check Icon at Top-Right */}
            <div className="absolute top-0 right-0 bg-[#00A651] w-8 h-8 flex items-center justify-center">
                <Check className="text-white w-5 h-5" strokeWidth={3} />
            </div>

            {/* Left side: Address Text */}
            <div className="flex-1 pr-6">
                <p className="text-[14px] text-[#333] leading-relaxed font-medium">
                    <span className="font-bold text-black">{address.firstname} {address.lastname}</span>{" "}
                    {address.street} {address.city}, {address.postcode}{" "}
                    {address.country_id === 'SA' ? 'Saudi Arabia' : address.country_id} {address.telephone}
                    {[
                        address.custom_attributes?.find(ca => ca.attribute_code === 'store_view')?.value,
                        address.custom_attributes?.find(ca => ca.attribute_code === 'region_ship_to_party')?.value
                    ].filter(Boolean).map(val => ` ${val}`).join("")}
                </p>
            </div>

            {/* Right side: EDIT ADDRESS Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                }}
                className="bg-[#F5B21B] text-black text-[12px] font-black px-6 py-3 uppercase tracking-widest hover:bg-black hover:text-white transition-all duration-300 flex-shrink-0"
            >
                EDIT ADDRESS
            </button>
        </div>
    );
};

export default SelectedAddressCard;
