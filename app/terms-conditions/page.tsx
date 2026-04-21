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
                <h1 className="text-h3 sm:text-h2 md:text-h1-sm lg:text-h1 font-black text-black uppercase tracking-tight mb-6 sm:mb-8 text-center">
                    {t("terms.title")}
                </h1>

                <div className={`text-body-lg md:text-[15px] leading-[1.7] text-black/70 ${isRtl ? 'text-right' : 'text-left'}`}>

                    <p className="mb-6">{t("terms.welcome")}</p>

                    <h2 className="text-[15px] md:text-[17px] font-black text-black uppercase tracking-tight mb-2">{t("terms.privacyTitle")}</h2>
                    <p className="mb-6">{t("terms.privacyText")}</p>

                    <h2 className="text-[15px] md:text-[17px] font-black text-black uppercase tracking-tight mb-2">{t("terms.electronicTitle")}</h2>
                    <p className="mb-6">{t("terms.electronicText")}</p>

                    <h2 className="text-[15px] md:text-[17px] font-black text-black uppercase tracking-tight mb-2">{t("terms.copyrightTitle")}</h2>
                    <p className="mb-6">{t("terms.copyrightText")}</p>

                    <h2 className="text-[15px] md:text-[17px] font-black text-black uppercase tracking-tight mb-2">{t("terms.licenseTitle")}</h2>
                    <p className="mb-6">{t("terms.licenseText")}</p>

                    <h2 className="text-[15px] md:text-[17px] font-black text-black uppercase tracking-tight mb-2">{t("terms.membershipTitle")}</h2>
                    <p className="mb-6">{t("terms.membershipText")}</p>

                    <h2 className="text-[15px] md:text-[17px] font-black text-black uppercase tracking-tight mb-2">{t("terms.reviewsTitle")}</h2>
                    <p className="mb-6">{t("terms.reviewsText")}</p>

                    <h2 className="text-[15px] md:text-[17px] font-black text-black uppercase tracking-tight mb-2">{t("terms.riskTitle")}</h2>
                    <p className="mb-6">{t("terms.riskText")}</p>

                    <h2 className="text-[15px] md:text-[17px] font-black text-black uppercase tracking-tight mb-2">{t("terms.productDescTitle")}</h2>
                    <p className="mb-6">{t("terms.productDescText")}</p>

                    <h2 className="text-[15px] md:text-[17px] font-black text-black uppercase tracking-tight mb-2">{t("terms.disclaimerTitle")}</h2>
                    <p className="mb-6">{t("terms.disclaimerText")}</p>

                    <p className="italic font-bold text-black text-body sm:text-body-lg">{t("terms.saudiLaw")}</p>
                </div>
            </div>
        </div>
    );
}
