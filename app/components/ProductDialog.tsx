"use client";

import type { Product } from "../../modules/types/product";
import { X } from "lucide-react";

interface ProductDialogProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductDialog({ product, onClose }: ProductDialogProps) {
  if (!product) return null;

  // Cast to any to access additional fields that might not be in the formal Product type
  const p = product as any;

  // Helper to extract attributes from top-level or custom_attributes array
  const getAttr = (code: string) => {
    // 1. Check top level
    if (p[code] !== undefined && p[code] !== null && p[code] !== "") return p[code];

    // 2. Check labels/other common names
    const labelKey = `${code}_label`;
    if (p[labelKey] !== undefined && p[labelKey] !== null && p[labelKey] !== "") return p[labelKey];

    // 3. Check custom_attributes array
    const attr = p.custom_attributes?.find((a: any) => a.attribute_code === code);
    if (attr) return attr.value;

    return null;
  };

  const details = [
    { label: "Item Code", value: getAttr("item_code") || p.sku || p.id },
    { label: "Brand", value: getAttr("brand") || p.manufacturer || (p.name ? p.name.split(' ')[0] : "N/A") },
    { label: "Size", value: getAttr("tyre_size") || p.size },
    { label: "Pattern", value: p.pattern },
    { label: "Year", value: getAttr("year") || p.model_year },
    { label: "Origin", value: getAttr("origin") || p.country_of_manufacture },
    {
      label: "Product Group",
      value: getAttr("product_group") || getAttr("category_name") || getAttr("types") || getAttr("type")
    },
    {
      label: "Tyre Type",
      value: getAttr("tyre_type") || getAttr("types") || getAttr("type_of_tyre") || getAttr("construction_type")
    },
    {
      label: "OEM Marking",
      value: getAttr("oem_marking") || getAttr("marking") || getAttr("oem")
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[550px] bg-white rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 🔶 Yellow Header with Bold Black Text */}
        <div className="bg-[#FFB82B] px-8 py-5 flex items-center justify-center relative">
          <h2 className="text-[17px] font-black text-black text-center uppercase tracking-tight">
            {product.pattern} - {product.tyre_size}
          </h2>

          <button
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 
                       w-9 h-9 bg-white rounded-full 
                       flex items-center justify-center 
                       shadow hover:bg-gray-100 transition cursor-pointer"
          >
            <X size={20} strokeWidth={3} className="text-black" />
          </button>
        </div>

        {/* 🔘 Body Section */}
        <div className="bg-white px-8 py-6 font-sans">
          <div className="space-y-0.5">
            {details.map((row, index) => (
              <div
                key={index}
                className="flex justify-between py-3.5 border-b border-gray-100 last:border-0"
              >
                <span className="text-[14px] font-bold text-gray-800">
                  {row.label}
                </span>
                <span className="text-[14px] font-black text-black text-right">
                  {row.value || "-"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}