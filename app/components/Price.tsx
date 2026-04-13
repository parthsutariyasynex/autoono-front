"use client";

import { formatPrice } from "@/utils/helpers";
import { useLocale } from "@/lib/i18n/client";

interface PriceProps {
    amount: number | string | null | undefined;
    className?: string;
    symbolClassName?: string;
}

export default function Price({ amount, className = "price", symbolClassName = "" }: PriceProps) {
    const locale = useLocale();
    const formatted = formatPrice(amount, locale);

    // The formatPrice utility returns "SAR 1,234.56"
    // We want to replace the text "SAR" with the custom font character mapping (Unicode E900)
    const parts = formatted.split(" ");
    const value = parts.length > 1 ? parts.slice(1).join(" ") : formatted;

    // Mapping for the Saudi Riyal custom font icon
    const riyalIcon = "\uE900";

    return (
        <span className={`font-black ${className}`}>
            <span className={`currency-riyal ${symbolClassName}`}>{riyalIcon}</span> {value}
        </span>
    );
}

