"use client";

import type { Product } from "../../modules/types/product";
import Drawer from "./Drawer";
import { useTranslation } from "@/hooks/useTranslation";

interface ProductDialogProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDialog({ product, isOpen, onClose }: ProductDialogProps) {
  const { t, isRtl } = useTranslation();
  const p = (product || {}) as any;

  const getAttr = (code: string) => {
    if (p[code] !== undefined && p[code] !== null && p[code] !== "") return p[code];
    const labelKey = `${code}_label`;
    if (p[labelKey] !== undefined && p[labelKey] !== null && p[labelKey] !== "") return p[labelKey];
    const attr = p.custom_attributes?.find((a: any) => a.attribute_code === code);
    if (attr) return attr.value;
    return null;
  };

  const details = [
    { label: t("productDialog.itemCode"), value: getAttr("item_code") || p.sku || p.id },
    { label: t("productDialog.brand"), value: getAttr("brand") || p.manufacturer || (p.name ? p.name.split(' ')[0] : "N/A") },
    { label: t("productDialog.size"), value: getAttr("tyre_size") || p.size },
    { label: t("productDialog.pattern"), value: p.pattern },
    { label: t("productDialog.year"), value: getAttr("year") || p.model_year },
    { label: t("productDialog.origin"), value: getAttr("origin") || p.country_of_manufacture },
    {
      label: t("productDialog.productGroup"),
      value: getAttr("product_group") || getAttr("category_name") || getAttr("types") || getAttr("type")
    },
    {
      label: t("productDialog.tyreType"),
      value: getAttr("tyre_type") || getAttr("types") || getAttr("type_of_tyre") || getAttr("construction_type")
    },
    {
      label: t("productDialog.oemMarking"),
      value: getAttr("oem_marking") || getAttr("marking") || getAttr("oem")
    },
  ];

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col h-full bg-white" dir={isRtl ? "rtl" : "ltr"}>
        {/* Yellow Header */}
        <div className="bg-[#FFB82B] px-4 md:px-8 py-4 md:py-6 flex items-center justify-center relative flex-shrink-0">
          <h2 className="text-[14px] md:text-[17px] font-black text-black text-center uppercase tracking-tight">
            {p.pattern || p.name || t("productDialog.product")} {p.tyre_size ? `- ${p.tyre_size}` : ""}
          </h2>
        </div>

        {/* Body Section */}
        <div className="bg-white px-4 md:px-8 py-5 md:py-8 font-sans flex-1 overflow-y-auto">
          <div className="space-y-0">
            {details.map((row, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-3 md:py-4 border-b border-gray-100 last:border-0 gap-4"
              >
                <span className="text-[12px] md:text-[14px] font-bold text-gray-800 flex-shrink-0">
                  {row.label}
                </span>
                <span className="text-[12px] md:text-[14px] font-black text-black ltr:text-right rtl:text-left truncate">
                  {row.value || "-"}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 md:mt-10 py-4 md:py-6 border-t border-gray-100">
            <button
              onClick={onClose}
              className="w-full py-3 md:py-4 bg-gray-900 text-white text-[12px] md:text-[14px] font-black uppercase tracking-widest rounded shadow-lg hover:bg-black transition-all"
            >
              {t("productDialog.closeDetails")}
            </button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
