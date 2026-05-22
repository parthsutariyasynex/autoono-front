"use client";

import CmsPage from "@/components/CmsPage";

const AR_HEADINGS = [
    "رضا العميل",
    "الإلغاء",
    "الارتجاع",
    "رد الأموال",
    "القانون المعمول به",
    "سياسات الموقع والتعديل والفصل بين الأحكام",
    "الاستفسارات",
];

export default function ReturnExchangePolicyPage() {
    return (
        <CmsPage
            identifier="return-exchange-policy"
            fallbackTitleKey="returnExchange.title"
            arabicHeadings={AR_HEADINGS}
        />
    );
}
