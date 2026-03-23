"use client";

import type { Product } from "../../modules/types/product";
import Drawer from "./Drawer";

interface ProductDialogProps {
  product: Product | null;
  isOpen: boolean; // Added isOpen prop to align with Drawer pattern
  onClose: () => void;
}

export default function ProductDialog({ product, isOpen, onClose }: ProductDialogProps) {
  if (!product) return null;

  const p = product as any;

  const getAttr = (code: string) => {
    if (p[code] !== undefined && p[code] !== null && p[code] !== "") return p[code];
    const labelKey = `${code}_label`;
    if (p[labelKey] !== undefined && p[labelKey] !== null && p[labelKey] !== "") return p[labelKey];
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
    <Drawer isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col h-full bg-white">
        {/* 🔶 Yellow Header */}
        <div className="bg-[#FFB82B] px-8 py-6 flex items-center justify-center relative flex-shrink-0">
          <h2 className="text-[17px] font-black text-black text-center uppercase tracking-tight">
            {product.pattern} - {product.tyre_size}
          </h2>
        </div>

        {/* 🔘 Body Section */}
        <div className="bg-white px-8 py-8 font-sans flex-1 overflow-y-auto">
          <div className="space-y-1">
            {details.map((row, index) => (
              <div
                key={index}
                className="flex justify-between py-4 border-b border-gray-100 last:border-0"
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

          <div className="mt-10 py-6 border-t border-gray-100">
            <button
              onClick={onClose}
              className="w-full py-4 bg-gray-900 text-white font-black uppercase tracking-widest rounded shadow-lg hover:bg-black transition-all"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}