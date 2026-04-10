// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//     // No rewrites — all API calls go through local route handlers in app/api/
//     // which use getBaseUrl(request) to build locale-aware Magento URLs.
//     //
//     // Previously had hardcoded /rest/en/ rewrites here which broke Arabic store view.
// };

// export default nextConfig;

import type { NextConfig } from "next";

// All 83 API routes have local route handlers in app/api/
// No rewrites needed — route handlers use getBaseUrl(request) for locale-aware Magento URLs
const nextConfig: NextConfig = {};

export default nextConfig;