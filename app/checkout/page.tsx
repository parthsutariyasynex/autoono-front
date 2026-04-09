"use client";
import { useTranslation } from "@/hooks/useTranslation";

import CheckoutPageUI from "../../components/CheckoutPage";

export default function Page() {
    const { t } = useTranslation();
    return <CheckoutPageUI />;
}
