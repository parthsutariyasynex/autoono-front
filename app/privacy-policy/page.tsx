"use client";
import { useTranslation } from "@/hooks/useTranslation";

export default function PrivacyPolicyPage() {
    const { t, isRtl } = useTranslation();

    return (
        <div className="min-h-screen bg-white">
            <div
                className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 py-8 sm:py-12 md:py-16 lg:py-20"
                dir={isRtl ? "rtl" : "ltr"}
            >
                {/* Title */}
                <h1 className="text-[20px] sm:text-[24px] md:text-[28px] lg:text-[32px] font-black text-black uppercase tracking-tight mb-8 sm:mb-10 md:mb-12 text-center">
                    {t("privacy.title")}
                </h1>

                {/* Content */}
                <div className={`text-[13px] sm:text-[14px] md:text-[15px] leading-[1.8] sm:leading-[1.9] text-gray-700 font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
                    {/* Intro */}
                    <p>{t("privacy.intro")}</p>

                    <ul className={`list-disc ${isRtl ? 'pr-5 sm:pr-6' : 'pl-5 sm:pl-6'} space-y-1 mt-4 mb-6`}>
                        <li>{t("privacy.bullet1")}</li>
                        <li>{t("privacy.bullet2")}</li>
                        <li>{t("privacy.bullet3")}</li>
                        <li>{t("privacy.bullet4")}</li>
                    </ul>

                    {/* Section: Information Collection */}
                    <h2 className="text-[15px] sm:text-[17px] md:text-[19px] font-black text-black uppercase tracking-tight mt-8 sm:mt-10 mb-3 sm:mb-4">
                        {t("privacy.infoCollectionTitle")}
                    </h2>
                    <p>{t("privacy.infoCollectionText1")}</p>
                    <p className="mt-4">{t("privacy.infoCollectionText2")}</p>
                    <p className="mt-4">{t("privacy.infoCollectionText3")}</p>

                    {/* Section: Access & Control */}
                    <h2 className="text-[15px] sm:text-[17px] md:text-[19px] font-black text-black uppercase tracking-tight mt-8 sm:mt-10 mb-3 sm:mb-4">
                        {t("privacy.accessControlTitle")}
                    </h2>
                    <p>{t("privacy.accessControlText")}</p>
                    <ul className={`list-disc ${isRtl ? 'pr-5 sm:pr-6' : 'pl-5 sm:pl-6'} space-y-1 mt-4 mb-6`}>
                        <li>{t("privacy.accessBullet1")}</li>
                        <li>{t("privacy.accessBullet2")}</li>
                        <li>{t("privacy.accessBullet3")}</li>
                        <li>{t("privacy.accessBullet4")}</li>
                    </ul>

                    {/* Section: Security */}
                    <p>{t("privacy.securityText1")}</p>
                    <p className="mt-4">{t("privacy.securityText2")}</p>
                    <p className="mt-4">{t("privacy.securityText3")}</p>
                </div>
            </div>
        </div>
    );
}
