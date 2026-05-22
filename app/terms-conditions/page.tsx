"use client";

import CmsPage from "@/components/CmsPage";

const AR_HEADINGS = [
    "الخصوصية",
    "المراسلات الإلكترونية",
    "حقوق التأليف والنشر",
    "الترخيص والوصول إلى الموقع",
    "حساب العضوية الخاص بك",
    "الآراء والملاحظات والرسائل الإلكترونية والمحتويات الأخرى",
    "مخاطر الخسارة",
    "وصف المنتجات",
    "التنصل من الضمانات وحدود المسؤولية",
];

export default function TermsConditionsPage() {
    return (
        <CmsPage
            identifier="terms-and-conditions"
            fallbackTitleKey="termsConditions.title"
            arabicHeadings={AR_HEADINGS}
        />
    );
}
