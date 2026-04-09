// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//     // No rewrites — all API calls go through local route handlers in app/api/
//     // which use getBaseUrl(request) to build locale-aware Magento URLs.
//     //
//     // Previously had hardcoded /rest/en/ rewrites here which broke Arabic store view.
// };

// export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async rewrites() {
        return {
            afterFiles: [
                // For other generic kleverapi calls, we still have the fallback rewrite
                // but we should eventually migrate them all to local routes for full locale support.
                {
                    source: "/api/:path((?!auth|login|cart|kleverapi|products|category-products|categories|tyre-size|filters|category-filters|category-filter-options|send-otp|login-otp|forgot-password).*)",
                    destination: "https://altalayi-demo.btire.com/rest/en/V1/kleverapi/:path*",
                },
            ],
        };
    },
};

export default nextConfig;