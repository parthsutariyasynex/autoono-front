// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async rewrites() {
        return {
            afterFiles: [
                {
                    source: "/api/products",
                    destination:
                        "https://altalayi-demo.btire.com/rest/V1/kleverapi/favorite-products?pageSize=10&currentPage=1",
                },
                // Removed the global /api/kleverapi rewrite to allow local route.ts handlers to work
                // {
                //     source: "/api/kleverapi/:path*",
                //     destination: "https://altalayi-demo.btire.com/rest/V1/kleverapi/:path*",
                // },
                {
                    source: "/api/:path((?!auth|login|cart|kleverapi|category-products|categories|tyre-size|filters|category-filters|category-filter-options|send-otp|login-otp|forgot-password).*)",
                    destination: "https://altalayi-demo.btire.com/rest/V1/kleverapi/:path*",
                },
            ],
        };
    },
};

export default nextConfig;