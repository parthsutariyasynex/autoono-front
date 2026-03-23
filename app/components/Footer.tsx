"use client";

import React from "react";
import Link from "next/link";
import { Mail, Share2, Facebook, Instagram, Twitter, Linkedin } from "lucide-react";

const Footer: React.FC = () => {
    return (
        <footer className="bg-black text-white py-14">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 text-center pb-12 border-b border-gray-800">

                {/* Send us an email */}
                <div className="flex flex-col items-center group">
                    <div className="mb-6 p-1 text-white opacity-90 group-hover:opacity-100 transition-opacity">
                        <Mail className="w-10 h-10" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[20px] font-bold mb-3 tracking-tight">Send us an email</h3>
                    <a
                        href="mailto:btire@al-talayi.com.sa"
                        className="text-gray-400 hover:text-[#f5a623] transition-colors text-[14px] font-medium"
                    >
                        btire@al-talayi.com.sa
                    </a>
                </div>

                {/* Connect with Us */}
                <div className="flex flex-col items-center group">
                    <div className="mb-5 p-1 text-white opacity-90 group-hover:opacity-100 transition-opacity">
                        <Share2 className="w-10 h-10" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[20px] font-bold mb-5 tracking-tight">Connect with Us</h3>
                    <div className="flex items-center gap-4">
                        <Link href="#" className="bg-white text-black p-2 rounded-full hover:bg-[#f5a623] hover:text-white transition-all transform hover:scale-110">
                            <Facebook className="w-4 h-4" />
                        </Link>
                        <Link href="#" className="bg-white text-black p-2 rounded-full hover:bg-[#f5a623] hover:text-white transition-all transform hover:scale-110">
                            <Instagram className="w-4 h-4" />
                        </Link>
                        <Link href="#" className="bg-white text-black p-2 rounded-full hover:bg-[#f5a623] hover:text-white transition-all transform hover:scale-110">
                            <Twitter className="w-4 h-4" />
                        </Link>
                        <Link href="#" className="bg-white text-black p-2 rounded-full hover:bg-[#f5a623] hover:text-white transition-all transform hover:scale-110">
                            <Linkedin className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Bottom Copyright Section */}
            <div className="max-w-7xl mx-auto px-6 pt-10 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 text-[13px] font-medium text-gray-500 tracking-wide text-center">
                <p className="whitespace-nowrap">Copyright @ 2025 Altalayi.com. All rights reserved.</p>

                <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-white">
                    <Link href="#" className="hover:text-[#f5a623] transition-colors">Privacy Policy</Link>
                    <Link href="#" className="hover:text-[#f5a623] transition-colors">Return Exchange Policy</Link>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
