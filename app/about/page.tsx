"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocale } from "@/lib/i18n/client";

interface CmsPage {
    title?: string;
    content?: string;
    content_heading?: string;
}

function Skeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-10" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-[95%]" />
            <div className="h-4 bg-gray-200 rounded w-[88%]" />
            <div className="h-4 bg-gray-200 rounded w-full mt-4" />
            <div className="h-4 bg-gray-200 rounded w-[92%]" />
            <div className="h-4 bg-gray-200 rounded w-[80%]" />
            <div className="h-4 bg-gray-200 rounded w-full mt-4" />
            <div className="h-4 bg-gray-200 rounded w-[85%]" />
        </div>
    );
}

/** Clean up common typographic typos/errors in Magento plain text responses */
function cleanText(text: string): string {
    return text
        .replace(/جميعاًنسعى/g, "جميعاً نسعى")
        .replace(/مع مع/g, "مع")
        .replace(/تفضيلاًللإطارات/g, "تفضيلاً للإطارات")
        .replace(/واحفاظ/g, "والحفاظ")
        .replace(/13ًسطحا/g, "13 سطحًا")
        .replace(/13ًسطحًا/g, "13 سطحًا")
        .replace(/\[/g, "")
        .replace(/\]/g, "")
        .replace(/distribuƟ\s*on/g, "distribution")
        .replace(/distribu\s*on/g, "distribution")
        .trim();
}

/** Parses the dynamic plain text from Magento CMS into structured sections */
function parseAboutUs(text: string) {
    const markers = [
        { key: "vision_mission", en: "Vision and Mission:", ar: "الرؤية والرسالة" },
        { key: "vision", en: "Vision:", ar: "الرؤية:" },
        { key: "mission", en: "Mission:", ar: "الرسالة:" },
        { key: "products", en: "Our Products:", ar: "منتجاتنا:" },
        { key: "brands", en: "Brands Owned", ar: "العلامات التجارية المعتمدة" },
        { key: "values", en: "Core Values:", ar: "القيم الأساسية:" },
        { key: "network", en: "Branch Network:", ar: "فروعنا وانتشارنا" },
        { key: "closing", en: "Closing Statement:", ar: "كلمة ختامية" }
    ];

    // Find indices for all markers in the text
    const foundMarkers = markers.map(m => {
        let idx = text.indexOf(m.en);
        if (idx === -1) {
            idx = text.indexOf(m.ar);
        }
        // Fallback for variation in core values title
        if (m.key === "values" && idx === -1) {
            idx = text.indexOf("Autoono Core Values:");
        }
        return { ...m, idx };
    }).filter(m => m.idx !== -1).sort((a, b) => a.idx - b.idx);

    if (foundMarkers.length === 0) {
        return { intro: cleanText(text) };
    }

    const sections: Record<string, string> = {};
    sections["intro"] = cleanText(text.slice(0, foundMarkers[0].idx));

    for (let i = 0; i < foundMarkers.length; i++) {
        const current = foundMarkers[i];
        const next = foundMarkers[i + 1];
        
        let markerLength = current.en.length;
        if (text.startsWith(current.ar, current.idx)) {
            markerLength = current.ar.length;
        } else if (text.startsWith("Autoono Core Values:", current.idx)) {
            markerLength = "Autoono Core Values:".length;
        }

        const startIdx = current.idx + markerLength;
        const endIdx = next ? next.idx : text.length;
        
        let chunk = text.slice(startIdx, endIdx).trim();
        if (chunk.startsWith(":")) {
            chunk = chunk.slice(1).trim();
        }
        sections[current.key] = cleanText(chunk);
    }

    return sections;
}

export default function AboutPage() {
    const { t, isRtl } = useTranslation();
    const locale = useLocale();

    const [page, setPage] = useState<CmsPage | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        setHasError(false);
        fetch("/api/kleverapi/cms-page/about-us", {
            headers: { "x-locale": locale },
        })
            .then(r => {
                if (!r.ok) throw new Error("not ok");
                return r.json();
            })
            .then((data: CmsPage) => {
                setPage(data);
                setIsLoading(false);
            })
            .catch(() => {
                setHasError(true);
                setIsLoading(false);
            });
    }, [locale]);

    let title = page?.content_heading || page?.title || "";
    if (title.toLowerCase().trim() === "about us") {
        title = t("nav.aboutUs") || title;
    }
    const content = page?.content || "";
    const isHtml = content.trimStart().startsWith("<");

    const parsed = parseAboutUs(content);

    // Get Intro Paragraphs
    const getIntroParagraphs = () => {
        if (!parsed.intro) return [];
        const cleanIntro = parsed.intro
            .replace(/^About Autoono\s+/i, "")
            .replace(/^المقدمة عن الشركة\s+/, "")
            .trim();

        const sentences = cleanIntro.split(/(?<=\.)\s+/).filter(Boolean);
        if (!isRtl && sentences.length >= 5) {
            return [
                sentences[0],
                sentences[1] + " " + sentences[2],
                sentences[3],
                sentences[4]
            ];
        }
        return sentences;
    };

    // Get Vision Items (paragraphs)
    const getVisionItems = () => {
        if (!parsed.vision) return [];
        return parsed.vision.split(/(?<=\.)\s+/).map(s => s.trim()).filter(Boolean);
    };

    // Get Product Items
    const getProductsList = () => {
        if (!parsed.products) return [];
        if (isRtl) {
            return parsed.products.split(/(?<=\.)\s+/).map(s => s.replace(/\.$/, "").trim()).filter(Boolean);
        } else {
            const knownProducts = [
                "Automotive Lubricants",
                "Industrial Lubricants",
                "Marine Lubricants",
                "Greases",
                "Brake Fluids",
                "Coolants"
            ];
            const found: string[] = [];
            knownProducts.forEach(kp => {
                if (parsed.products.toLowerCase().includes(kp.toLowerCase())) {
                    found.push(kp);
                }
            });
            if (found.length > 0) return found;
            return parsed.products.split(/(?=[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/).map(s => s.trim()).filter(Boolean);
        }
    };

    // Get Values List
    const getValuesList = () => {
        if (!parsed.values) return [];
        if (isRtl) {
            return parsed.values.split(".").map(s => s.trim()).filter(Boolean);
        } else {
            const knownValues = [
                "Quality",
                "Service",
                "Trust",
                "Efficiency with continuous improvement",
                "Customer Centric"
            ];
            const found: string[] = [];
            knownValues.forEach(kv => {
                if (parsed.values.toLowerCase().includes(kv.toLowerCase())) {
                    found.push(kv);
                }
            });
            if (found.length > 0) return found;
            return parsed.values.split(/\s{2,}/).map(s => s.trim()).filter(Boolean);
        }
    };

    // Get Branch Network Paragraphs
    const getNetworkParagraphs = () => {
        if (!parsed.network) return [];
        return parsed.network.split(/(?<=\.)\s+/).map(s => s.trim()).filter(Boolean);
    };

    const introParagraphs = getIntroParagraphs();
    const visionItems = getVisionItems();
    const productList = getProductsList();
    const valuesList = getValuesList();
    const networkParagraphs = getNetworkParagraphs();

    return (
        <div className="min-h-screen bg-white">

            {/* Hero banner */}
            <div className="w-full h-[200px] sm:h-[280px] md:h-[360px] lg:h-[440px] overflow-hidden">
                <img
                    src="/images/about-tyresonline-uae.jpg"
                    alt="About Autoono"
                    className="w-full h-full object-cover"
                />
            </div>

            <div
                className="max-w-[1000px] mx-auto px-5 sm:px-8 md:px-12 py-10 sm:py-16 md:py-20 pb-28"
                dir={isRtl ? "rtl" : "ltr"}
            >
                {isLoading ? (
                    <Skeleton />
                ) : hasError || !content ? (
                    <p className="text-center text-gray-400 py-12 text-sm">
                        Page content unavailable.
                    </p>
                ) : isHtml ? (
                    /* Magento returned HTML — render as-is with prose styles */
                    <div
                        className="cms-content"
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                ) : (
                    /* Plain text — parse sections and render cleanly exactly as in image */
                    <div className={`space-y-6 text-[15px] leading-[1.9] text-black/75 font-medium ${isRtl ? "text-right" : "text-left"}`}>
                        
                        {title && (
                            <h1 className="text-2xl sm:text-3xl md:text-[2rem] font-black text-center mb-10 sm:mb-14 tracking-tight text-black uppercase">
                                {title}
                            </h1>
                        )}

                        {/* Intro Paragraphs */}
                        {introParagraphs.map((para, idx) => (
                            <p key={idx}>{para}</p>
                        ))}

                        {/* Vision & Mission Heading */}
                        {(parsed.vision || parsed.mission) && (
                            <h2 className="text-base font-black text-black uppercase tracking-widest mb-2 mt-4">
                                {isRtl ? "الرؤية والرسالة" : "Vision and Mission:"}
                            </h2>
                        )}

                        {/* Vision Section */}
                        {parsed.vision && (
                            <div className="space-y-4">
                                <h3 className="font-bold text-black">{isRtl ? "الرؤية:" : "Vision:"}</h3>
                                {visionItems.map((item, idx) => (
                                    <p key={idx}>{item}</p>
                                ))}
                            </div>
                        )}

                        {/* Mission Section */}
                        {parsed.mission && (
                            <div className="space-y-2">
                                <h3 className="font-bold text-black">{isRtl ? "الرسالة:" : "Mission:"}</h3>
                                <p>{parsed.mission}</p>
                            </div>
                        )}

                        {/* Our Products Section */}
                        {productList.length > 0 && (
                            <div className="space-y-2">
                                <h2 className="text-base font-black text-black uppercase tracking-widest mb-2 mt-4">
                                    {isRtl ? "منتجاتنا:" : "Our Products:"}
                                </h2>
                                <ul className={`list-disc ${isRtl ? "pr-5" : "pl-5"} space-y-1`}>
                                    {productList.map((item, idx) => (
                                        <li key={idx}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Brands Section */}
                        {parsed.brands && (
                            <div className="space-y-2">
                                <h2 className="text-base font-black text-black uppercase tracking-widest mb-2 mt-4">
                                    {isRtl ? "العلامات التجارية المعتمدة" : "Brands Owned"}
                                </h2>
                                <p>{parsed.brands}</p>
                            </div>
                        )}

                        {/* Core Values Section */}
                        {valuesList.length > 0 && (
                            <div className="space-y-2">
                                <h2 className="text-base font-black text-black uppercase tracking-widest mb-2 mt-4">
                                    {isRtl ? "القيم الأساسية:" : "Autoono Core Values:"}
                                </h2>
                                <ul className={`list-disc ${isRtl ? "pr-5" : "pl-5"} space-y-1`}>
                                    {valuesList.map((item, idx) => (
                                        <li key={idx}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Branch Network Section */}
                        {parsed.network && (
                            <div className="space-y-2">
                                <h2 className="text-base font-black text-black uppercase tracking-widest mb-2 mt-4">
                                    {isRtl ? "فروعنا وانتشارنا" : "Branch Network:"}
                                </h2>
                                {networkParagraphs.map((para, idx) => (
                                    <p key={idx}>{para}</p>
                                ))}
                            </div>
                        )}

                        {/* Closing Section */}
                        {parsed.closing && (
                            <div className="space-y-2">
                                <h2 className="text-base font-black text-black uppercase tracking-widest mb-2 mt-4">
                                    {isRtl ? "كلمة ختامية" : "Closing Statement:"}
                                </h2>
                                <p>{parsed.closing.replace(/[“”"”]/g, "")}</p>
                            </div>
                        )}

                    </div>
                )}
            </div>

            <style jsx global>{`
                .cms-content {
                    color: rgba(0, 0, 0, 0.75);
                    font-size: 15px;
                    line-height: 1.9;
                    font-weight: 500;
                }
                .cms-content h1,
                .cms-content h2,
                .cms-content h3,
                .cms-content h4 {
                    font-weight: 800;
                    color: #111;
                    margin-top: 2em;
                    margin-bottom: 0.6em;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                }
                .cms-content h1 { font-size: 1.5rem; }
                .cms-content h2 { font-size: 1.2rem; }
                .cms-content h3 { font-size: 1.05rem; }
                .cms-content p  { margin-bottom: 1.2em; }
                .cms-content ul,
                .cms-content ol { padding-left: 1.5em; margin-bottom: 1.2em; }
                .cms-content li { margin-bottom: 0.4em; }
                .cms-content a  { color: var(--color-primary, #4E81C2); text-decoration: underline; }
                .cms-content img { max-width: 100%; height: auto; border-radius: 6px; margin: 1em 0; }
                .cms-content table { width: 100%; border-collapse: collapse; margin-bottom: 1.2em; }
                .cms-content th,
                .cms-content td { border: 1px solid #e5e7eb; padding: 0.5em 0.75em; }
                .cms-content th { background: #f9fafb; font-weight: 700; }
            `}</style>
        </div>
    );
}
