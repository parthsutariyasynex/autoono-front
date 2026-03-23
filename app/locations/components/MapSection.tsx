"use client";

import React from "react";

const MapSection: React.FC = () => {
    return (
        <section className="w-full h-[400px] md:h-[500px] relative shadow-inner animate-fade-in group">
            <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3714.2828552174624!2d39.2131238!3d21.4180425!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x15c3d11b8fd6a2e9%3A0xe74e78a63f707f59!2sFazCo%20Trading%20Company%20Limited%20Head%20Office!5e0!3m2!1sen!2ssa!4v1711204000000!5m2!1sen!2ssa"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Al-Talayi Locations"
                className="transition-all duration-700 opacity-100 group-hover:scale-[1.02] transform"
            ></iframe>
            <div className="absolute inset-0 pointer-events-none border-y border-black/5"></div>
        </section>
    );
};

export default MapSection;
