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
                <h1 className="text-h3 sm:text-h2 md:text-h1-sm lg:text-h1 font-black text-black uppercase tracking-tight mb-6 sm:mb-8 text-center">
                    {t("returnPolicy.title")}
                </h1>

                <div className={`text-body-lg md:text-[15px] leading-[1.7] text-gray-600 ${isRtl ? 'text-right' : 'text-left'}`}>

                    <p className="mb-6">{t("returnPolicy.thanks")}</p>

                    <h2 className="text-[15px] md:text-[17px] font-black text-black uppercase tracking-tight mb-2">{t("returnPolicy.satisfactionTitle")}</h2>
                    <p>{t("returnPolicy.satisfactionText")}</p>
                    <p className="mb-6">{t("returnPolicy.satisfactionText2")}</p>

                    <h2 className="text-[15px] md:text-[17px] font-black text-black uppercase tracking-tight mb-2">{t("returnPolicy.cancellationTitle")}</h2>
                    <p>{t("returnPolicy.cancellationText1")}</p>
                    <p>{t("returnPolicy.cancellationText2")}</p>
                    <p className="mb-6">{t("returnPolicy.cancellationText3")}</p>

                    <h2 className="text-[15px] md:text-[17px] font-black text-black uppercase tracking-tight mb-2">{t("returnPolicy.returnsTitle")}</h2>
                    <p>{t("returnPolicy.returnsText1")}</p>
                    <p className="mb-6">{t("returnPolicy.returnsText2")}</p>

                    <h2 className="text-[15px] md:text-[17px] font-black text-black uppercase tracking-tight mb-2">{t("returnPolicy.refundsTitle")}</h2>
                    <p className="mb-6">{t("returnPolicy.refundsText")}</p>

                    <h2 className="text-[15px] md:text-[17px] font-black text-black uppercase tracking-tight mb-2">{t("returnPolicy.applicableLawTitle")}</h2>
                    <p className="mb-6">{t("returnPolicy.applicableLawText")}</p>

                    <h2 className="text-[15px] md:text-[17px] font-black text-black uppercase tracking-tight mb-2">{t("returnPolicy.sitePoliciesTitle")}</h2>
                    <p className="mb-6">{t("returnPolicy.sitePoliciesText")}</p>

                    <h2 className="text-[15px] md:text-[17px] font-black text-black uppercase tracking-tight mb-2">{t("returnPolicy.questionsTitle")}</h2>
                    <p>{t("returnPolicy.questionsText")}</p>
                </div>
            </div>
        </div>
    );
}
