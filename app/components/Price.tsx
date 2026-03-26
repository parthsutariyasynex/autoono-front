import { formatPrice } from "@/utils/helpers";

interface PriceProps {
    amount: number | string | null | undefined;
    className?: string;
    symbolClassName?: string;
}

export default function Price({ amount, className = "price currency-riyal", symbolClassName = "" }: PriceProps) {
    const formatted = formatPrice(amount);

    // The formatPrice utility returns "SAR 1,234.56"
    // We want to replace the text "SAR" with the custom font character mapping (Unicode E900)
    const parts = formatted.split(" ");
    const value = parts.length > 1 ? parts.slice(1).join(" ") : formatted;

    // Mapping for the Saudi Riyal custom font icon
    const riyalIcon = "\uE900";

    return (
        <span className={className}>
            <span className={`currency-riyal ${symbolClassName}`}>{riyalIcon}</span> {value}
        </span>
    );
}

