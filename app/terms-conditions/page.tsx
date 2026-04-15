"use client";
import { useTranslation } from "@/hooks/useTranslation";

export default function TermsConditionsPage() {
    const { t, isRtl } = useTranslation();

    return (
        <div className="min-h-screen bg-white">
            <div
                className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 py-8 sm:py-12 md:py-16 lg:py-20"
                dir={isRtl ? "rtl" : "ltr"}
            >
                <h1 className="text-[20px] sm:text-[24px] md:text-[28px] lg:text-[32px] font-black text-black uppercase tracking-tight mb-8 sm:mb-10 md:mb-12 text-center">
                    {t("terms.title")}
                </h1>

                <div className={`text-[13px] sm:text-[14px] md:text-[15px] leading-[1.8] sm:leading-[1.9] text-gray-700 font-medium ${isRtl ? 'text-right' : 'text-left'}`}>

                    <p>{t("terms.welcome")}</p>

                    <h2 className="text-[15px] sm:text-[17px] md:text-[19px] font-black text-black uppercase tracking-tight mt-8 sm:mt-10 mb-3">{t("terms.privacyTitle")}</h2>
                    <p>{t("terms.privacyText")}</p>

                    <h2 className="text-[15px] sm:text-[17px] md:text-[19px] font-black text-black uppercase tracking-tight mt-8 sm:mt-10 mb-3">{t("terms.electronicTitle")}</h2>
                    <p>{t("terms.electronicText")}</p>

                    <h2 className="text-[15px] sm:text-[17px] md:text-[19px] font-black text-black uppercase tracking-tight mt-8 sm:mt-10 mb-3">{t("terms.copyrightTitle")}</h2>
                    <p>{t("terms.copyrightText")}</p>

                    <h2 className="text-[15px] sm:text-[17px] md:text-[19px] font-black text-black uppercase tracking-tight mt-8 sm:mt-10 mb-3">{t("terms.licenseTitle")}</h2>
                    <p>{t("terms.licenseText")}</p>

                    <h2 className="text-[15px] sm:text-[17px] md:text-[19px] font-black text-black uppercase tracking-tight mt-8 sm:mt-10 mb-3">{t("terms.membershipTitle")}</h2>
                    <p>{t("terms.membershipText")}</p>

                    <h2 className="text-[15px] sm:text-[17px] md:text-[19px] font-black text-black uppercase tracking-tight mt-8 sm:mt-10 mb-3">{t("terms.reviewsTitle")}</h2>
                    <p>{t("terms.reviewsText")}</p>

                    <h2 className="text-[15px] sm:text-[17px] md:text-[19px] font-black text-black uppercase tracking-tight mt-8 sm:mt-10 mb-3">{t("terms.riskTitle")}</h2>
                    <p>{t("terms.riskText")}</p>

                    <h2 className="text-[15px] sm:text-[17px] md:text-[19px] font-black text-black uppercase tracking-tight mt-8 sm:mt-10 mb-3">{t("terms.productDescTitle")}</h2>
                    <p>{t("terms.productDescText")}</p>

                    <h2 className="text-[15px] sm:text-[17px] md:text-[19px] font-black text-black uppercase tracking-tight mt-8 sm:mt-10 mb-3">{t("terms.disclaimerTitle")}</h2>
                    <p>{t("terms.disclaimerText")}</p>

                    <p className="mt-8 italic font-bold text-black">{t("terms.saudiLaw")}</p>
                </div>
            </div>
        </div>
    );
}
