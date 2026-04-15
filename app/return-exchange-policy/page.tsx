"use client";
import { useTranslation } from "@/hooks/useTranslation";

export default function ReturnExchangePolicyPage() {
    const { t, isRtl } = useTranslation();

    return (
        <div className="min-h-screen bg-white">
            <div
                className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 py-8 sm:py-12 md:py-16 lg:py-20"
                dir={isRtl ? "rtl" : "ltr"}
            >
                <h1 className="text-[20px] sm:text-[24px] md:text-[28px] lg:text-[32px] font-black text-black uppercase tracking-tight mb-8 sm:mb-10 md:mb-12 text-center">
                    {t("returnPolicy.title")}
                </h1>

                <div className={`text-[13px] sm:text-[14px] md:text-[15px] leading-[1.8] sm:leading-[1.9] text-gray-700 font-medium ${isRtl ? 'text-right' : 'text-left'}`}>

                    <p>{t("returnPolicy.thanks")}</p>

                    <h2 className="text-[15px] sm:text-[17px] md:text-[19px] font-black text-black uppercase tracking-tight mt-8 sm:mt-10 mb-3">{t("returnPolicy.satisfactionTitle")}</h2>
                    <p>{t("returnPolicy.satisfactionText")}</p>
                    <p className="mt-4">{t("returnPolicy.satisfactionText2")}</p>

                    <h2 className="text-[15px] sm:text-[17px] md:text-[19px] font-black text-black uppercase tracking-tight mt-8 sm:mt-10 mb-3">{t("returnPolicy.cancellationTitle")}</h2>
                    <p>{t("returnPolicy.cancellationText1")}</p>
                    <p className="mt-4">{t("returnPolicy.cancellationText2")}</p>
                    <p className="mt-4">{t("returnPolicy.cancellationText3")}</p>

                    <h2 className="text-[15px] sm:text-[17px] md:text-[19px] font-black text-black uppercase tracking-tight mt-8 sm:mt-10 mb-3">{t("returnPolicy.returnsTitle")}</h2>
                    <p>{t("returnPolicy.returnsText1")}</p>
                    <p className="mt-4">{t("returnPolicy.returnsText2")}</p>

                    <h2 className="text-[15px] sm:text-[17px] md:text-[19px] font-black text-black uppercase tracking-tight mt-8 sm:mt-10 mb-3">{t("returnPolicy.refundsTitle")}</h2>
                    <p>{t("returnPolicy.refundsText")}</p>

                    <h2 className="text-[15px] sm:text-[17px] md:text-[19px] font-black text-black uppercase tracking-tight mt-8 sm:mt-10 mb-3">{t("returnPolicy.applicableLawTitle")}</h2>
                    <p>{t("returnPolicy.applicableLawText")}</p>

                    <h2 className="text-[15px] sm:text-[17px] md:text-[19px] font-black text-black uppercase tracking-tight mt-8 sm:mt-10 mb-3">{t("returnPolicy.sitePoliciesTitle")}</h2>
                    <p>{t("returnPolicy.sitePoliciesText")}</p>

                    <h2 className="text-[15px] sm:text-[17px] md:text-[19px] font-black text-black uppercase tracking-tight mt-8 sm:mt-10 mb-3">{t("returnPolicy.questionsTitle")}</h2>
                    <p>{t("returnPolicy.questionsText")}</p>
                </div>
            </div>
        </div>
    );
}
