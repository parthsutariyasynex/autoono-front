"use client";

import CmsPage from "@/components/CmsPage";

// AR heading phrases in document order — used to split Arabic content into H2 sections
// since Arabic has no case distinction for ALL-CAPS heading detection.
const AR_HEADINGS = [
    "جمع المعلومات، واستخدامها، ومشاركتها",
    "اطلاعك على المعلومات وقدرتك على التحكم بها",
];

export default function PrivacyPolicyPage() {
    return (
        <CmsPage
            identifier="privacy-policy"
            fallbackTitleKey="privacy.title"
            arabicHeadings={AR_HEADINGS}
        />
    );
}
