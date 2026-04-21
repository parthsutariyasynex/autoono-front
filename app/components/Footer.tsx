"use client";

import React from "react";
import Link from "next/link";
import { Mail, Share2, Facebook, Instagram, Twitter, Linkedin } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocalePath } from "@/hooks/useLocalePath";

/**
 * Global Site Footer
 * Matches the design requested by the user: 2-column center-aligned layout.
 */
const Footer: React.FC = () => {
    const { t } = useTranslation();
    const lp = useLocalePath();
    const pathname = usePathname();
    const isProductsPage = pathname.includes("/products");

    return (
        <footer className={`bg-black text-white py-20 font-rubik ${isProductsPage ? "xl:pb-44" : ""}`}>
            <div className="w-full px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 text-center pb-12 border-b border-gray-800/50">

                    {/* Left: Email Section */}
                    <div className="flex flex-col items-center group">
                        <div className="mb-6 text-white group-hover:scale-110 transition-transform duration-300">
                            <Mail className="w-12 h-12" strokeWidth={1.2} />
                        </div>
                        <h3 className="text-h3 font-bold mb-4 tracking-tight">{t("footer.email")}</h3>
                        <a
                            href="mailto:btire@al-talayi.com.sa"
                            className="text-gray-400 hover:text-primary transition-colors text-[15px] font-medium"
                        >
                            btire@al-talayi.com.sa
                        </a>
                    </div>

                    {/* Right: Social Section */}
                    <div className="flex flex-col items-center group">
                        <div className="mb-6 text-white group-hover:scale-110 transition-transform duration-300">
                            <Share2 className="w-12 h-12" strokeWidth={1.2} />
                        </div>
                        <h3 className="text-h3 font-bold mb-6 tracking-tight">{t("footer.socialConnect")}</h3>
                        <div className="flex items-center gap-4">
                            <Link href="https://www.facebook.com/BridgestoneKSA/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all transform hover:scale-110">
                                <Facebook size={18} fill="currentColor" />
                            </Link>
                            <Link href="https://www.instagram.com/bridgestone_ksa/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all transform hover:scale-110">
                                <Instagram size={18} />
                            </Link>
                            <Link href="https://twitter.com/bridgestone_KSA" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all transform hover:scale-110">
                                <Twitter size={18} fill="currentColor" />
                            </Link>
                            <Link href="https://www.linkedin.com/company/altalayi" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all transform hover:scale-110">
                                <Linkedin size={18} fill="currentColor" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 flex flex-col items-center">
                    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-body font-medium text-center">
                        <p className="text-gray-500">{t("footer.copyright")}</p>
                        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-2">
                            <Link href={lp("/privacy-policy")} className="text-white hover:text-primary transition-colors">{t("footer.privacyPolicy")}</Link>
                            <Link href={lp("/return-exchange-policy")} className="text-white hover:text-primary transition-colors">{t("footer.returnExchangePolicy")}</Link>
                            <Link href={lp("/terms-conditions")} className="text-white hover:text-primary transition-colors">{t("footer.termsConditions")}</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
