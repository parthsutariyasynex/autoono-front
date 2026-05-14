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

/** Split plain text into styled paragraphs around known section headers */
function PlainTextContent({ text, isRtl }: { text: string; isRtl: boolean }) {
    // Section headings end with ":"  — split on them to create visual breaks
    const sectionRe = /(?=\b(?:Vision and Mission|Vision|Mission|Our Products|Brands Owned|Core Values|Branch Network|Closing Statement)\s*:)/g;
    const chunks = text.split(sectionRe).filter(Boolean);

    return (
        <div className={`space-y-6 text-[15px] leading-[1.9] text-black/75 font-medium ${isRtl ? "text-right" : "text-left"}`}>
            {chunks.map((chunk, i) => {
                // Detect if the chunk starts with a heading (word(s) followed by ":")
                const headingMatch = chunk.match(/^([A-Za-z &]+):\s*/);
                if (headingMatch && i > 0) {
                    const heading = headingMatch[1].trim();
                    const body = chunk.slice(headingMatch[0].length).trim();
                    return (
                        <div key={i}>
                            <h2 className="text-base font-black text-black uppercase tracking-widest mb-2 mt-4">
                                {heading}
                            </h2>
                            {body && <p>{body}</p>}
                        </div>
                    );
                }
                return <p key={i}>{chunk.trim()}</p>;
            })}
        </div>
    );
}

export default function AboutPage() {
    const { isRtl } = useTranslation();
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

    const title = page?.content_heading || page?.title || "";
    const content = page?.content || "";
    const isHtml = content.trimStart().startsWith("<");

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
                ) : (
                    <>
                        {title && (
                            <h1 className="text-2xl sm:text-3xl md:text-[2rem] font-black text-center mb-10 sm:mb-14 tracking-tight text-black uppercase">
                                {title}
                            </h1>
                        )}

                        {isHtml ? (
                            /* Magento returned HTML — render as-is with prose styles */
                            <div
                                className="cms-content"
                                dangerouslySetInnerHTML={{ __html: content }}
                            />
                        ) : (
                            /* Plain text — parse sections and render cleanly */
                            <PlainTextContent text={content} isRtl={isRtl} />
                        )}
                    </>
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
                .cms-content a  { color: var(--color-primary, #f7c430); text-decoration: underline; }
                .cms-content img { max-width: 100%; height: auto; border-radius: 6px; margin: 1em 0; }
                .cms-content table { width: 100%; border-collapse: collapse; margin-bottom: 1.2em; }
                .cms-content th,
                .cms-content td { border: 1px solid #e5e7eb; padding: 0.5em 0.75em; }
                .cms-content th { background: #f9fafb; font-weight: 700; }
            `}</style>
        </div>
    );
}
