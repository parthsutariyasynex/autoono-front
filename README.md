# Altalayi - B2B Tyre E-Commerce Platform

A full-featured B2B tyre trading platform built with Next.js 15 and integrated with a Magento backend. The platform supports product browsing, advanced tyre filtering, multi-location delivery, customer dashboards, and sub-account management.

## Tech Stack

| Layer              | Technology                                    |
| ------------------ | --------------------------------------------- |
| Framework          | Next.js 15 (App Router)                       |
| Language           | TypeScript 5                                  |
| UI                 | React 19, Tailwind CSS 4                      |
| Authentication     | NextAuth (JWT + Magento Credentials Provider) |
| State Management   | Redux Toolkit, React Context, Zustand         |
| HTTP Client        | Axios, SWR                                    |
| Charts             | Recharts                                      |
| PDF/Excel Export   | jsPDF, html2canvas, ExcelJS                   |
| Icons              | Lucide React                                  |
| Notifications      | React Hot Toast                               |
| Backend            | Magento REST API (via KleverAPI proxy)        |

## Features

### Product Management
- Browse tyres with advanced filtering (brand, size, pattern, year, origin)
- Tyre size search (width, height, rim)
- Product detail pages with stock info
- Wishlist / favorites

### Shopping Cart & Checkout
- Persistent cart with real-time totals (subtotal, tax, grand total)
- Multi-step checkout: address -> shipping -> payment -> review
- Pickup time slot selection
- PO number & file upload support

### Multi-Location Delivery
- Ship products to multiple addresses in a single order
- Assign items to different delivery locations
- Separate billing/shipping per location

### Order Management
- Order history with filters
- Order status tracking & detail views
- PDF & Excel export
- Reorder functionality
- Order attachments / documents

### Customer Dashboard
- Business overview with analytics
- Quarterly/monthly sales comparisons
- Product group performance charts

### Account & Auth
- Email/password and OTP-based login (SMS/email)
- Password recovery/reset
- Address book management
- Sub-account management (create/manage sub-users)
- Notification center

## Project Structure

```
altalayi-front/
├── app/
│   ├── api/                  # API routes (auth, kleverapi proxy, filters, etc.)
│   ├── products/             # Product catalog & detail pages
│   ├── cart/                 # Shopping cart
│   ├── checkout/             # Multi-step checkout + success page
│   ├── multi-location-delivery/  # Bulk shipping flow
│   ├── customer/             # Dashboard, orders, addresses, notifications
│   ├── my-orders/            # Order history & details
│   ├── favorites/            # Wishlist
│   ├── login/                # Login (OTP & password modes)
│   ├── forgot-password/      # Password recovery
│   ├── catalogue/            # Product catalog download
│   ├── locations/            # Store/location finder
│   └── layout.tsx            # Root layout with providers
├── components/               # Shared UI components
├── modules/                  # Feature modules (cart, checkout, notifications, multishipping)
├── store/                    # Redux store, actions, reducers
├── lib/                      # API client & auth config
├── utils/                    # Helper utilities
├── context/                  # React Context providers
├── public/                   # Static assets (images, logos)
└── middleware.ts             # Route protection & auth redirects
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
NEXT_PUBLIC_BASE_URL=<kleverapi-base-url>
NEXTAUTH_SECRET=<your-secret>
MAGENTO_AUTH_TOKEN_URL=<magento-token-endpoint>
NEXTAUTH_URL=http://localhost:3000   # Required in production
```

### Development

```bash
npm run dev
```

The app starts at [http://localhost:3000](http://localhost:3000).

### Production

```bash
npm run build
npm start
```

### Scripts

| Script                 | Description             |
| ---------------------- | ----------------------- |
| `npm run dev`          | Start dev server        |
| `npm run build`        | Production build        |
| `npm start`            | Start production server |
| `npm run lint`         | Run ESLint              |
| `npm run seed:products`| Seed product data       |

## Architecture Notes

- **API Proxy**: Next.js `/api/kleverapi/*` routes proxy requests to the Magento backend, keeping credentials server-side.
- **Auth Flow**: Login credentials are sent to NextAuth -> Magento token exchange -> JWT stored in session & localStorage -> passed as `Authorization: Bearer` header on API calls.
- **Route Protection**: `middleware.ts` checks for NextAuth JWT or a custom `auth-token` cookie, redirecting unauthenticated users to `/login`.
- **State Split**: Redux handles auth, customer, and address state. React Context manages cart state. Both are initialized at the root layout.
- **Styling**: Tailwind CSS with a custom brand color (`#F5B21B`) and a custom Saudi Riyal (SAR) currency font.
