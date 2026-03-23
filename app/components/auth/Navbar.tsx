"use client";

import Link from "next/link";

export function Navbar() {
  return (
    <nav className="bg-[#f4b400] shadow-md w-full h-[50px] md:h-[60px] flex items-center justify-center">
      <div className="max-w-7xl w-full flex items-center justify-center px-4">
        <div className="flex items-center justify-center gap-8 md:gap-16 text-black font-semibold">
          <Link
            href="/products"
            className="px-6 h-[60px] flex items-center transition-all duration-200 hover:bg-gray-900 hover:text-white cursor-pointer"
          >
            All Tyres
          </Link>
          <Link
            href="/about"
            className="px-6 h-[60px] flex items-center transition-all duration-200 hover:bg-gray-900 hover:text-white cursor-pointer"
          >
            About Us
          </Link>
          <Link
            href="/catalogue"
            className="px-6 h-[60px] flex items-center transition-all duration-200 hover:bg-gray-900 hover:text-white cursor-pointer"
          >
            Product Catalogue
          </Link>
        </div>
      </div>
    </nav>
  );
}

