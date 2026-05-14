"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MousePointer2, Navigation, Layers, Map as MapIcon } from "lucide-react";

const MapSection: React.FC = () => {
    const [mounted, setMounted] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");

    useEffect(() => {
        setMounted(true);
    }, []);

    // Faster arrow animation duration
    const arrowDuration = 1.2;

    const mapUrl = mapType === "roadmap" 
        ? "https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d14856.228!2d39.2037785!3d21.4363427!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2ssa!4v1748000000000!5m2!1sen!2ssa"
        : "https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d14856.228!2d39.2037785!3d21.4363427!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2ssa!4v1748000000000!5m2!1sen!2ssa&maptype=satellite";

    return (
        <section className="w-full h-full relative bg-gray-50 overflow-hidden group">
            {/* Skeleton pulse shown until iframe loads */}
            <AnimatePresence mode="wait">
                {!loaded && (
                    <motion.div 
                        key="skeleton"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-10 bg-gray-200 animate-pulse"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-[shimmer_1.5s_infinite]" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Premium Gradient Overlays */}
            <div className="absolute inset-0 z-20 pointer-events-none ring-1 ring-inset ring-black/5">
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/40 to-transparent" />
            </div>

            {/* Custom Map/Satellite Toggle */}
            <div className="absolute top-6 left-6 z-40 flex bg-white rounded-md shadow-lg overflow-hidden border border-gray-100">
                <button
                    onClick={() => setMapType("roadmap")}
                    className={`px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all ${mapType === "roadmap" ? "bg-primary text-white" : "bg-white text-black hover:bg-gray-50"}`}
                >
                    Map
                </button>
                <div className="w-[1px] bg-gray-100" />
                <button
                    onClick={() => setMapType("satellite")}
                    className={`px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all ${mapType === "satellite" ? "bg-primary text-white" : "bg-white text-black hover:bg-gray-50"}`}
                >
                    Satellite
                </button>
            </div>

            {mounted && (
                <iframe
                    key={mapType}
                    src={mapUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0, display: "block" }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Autoono Location"
                    onLoad={() => setLoaded(true)}
                    className={`transition-opacity duration-1000 ${loaded ? "opacity-100" : "opacity-0"}`}
                />
            )}

            {/* Floating Animated Arrow / Indicator (Faster) */}
            {loaded && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ 
                        opacity: [0, 1, 1, 0],
                        y: [0, 10, 0]
                    }}
                    transition={{ 
                        duration: arrowDuration,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none flex flex-col items-center gap-2"
                >
                    <div className="p-3 bg-primary text-white rounded-full shadow-2xl ring-4 ring-white/30 backdrop-blur-sm">
                        <Navigation className="w-6 h-6 rotate-180" />
                    </div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                </motion.div>
            )}

            {/* Bottom Interaction Hint */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="absolute bottom-6 left-6 z-30 hidden sm:flex items-center gap-3 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-100 shadow-xl"
            >
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                    <MousePointer2 className="w-4 h-4 text-white" />
                </div>
                <p className="text-[11px] font-bold text-black uppercase tracking-widest">
                    Scroll to zoom
                </p>
            </motion.div>
        </section>
    );
};

export default MapSection;
