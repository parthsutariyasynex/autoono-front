"use client";

// ─── Skeleton primitives ──────────────────────────────────────────────────────
const Pulse = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

// ─── Navbar Skeleton ──────────────────────────────────────────────────────────
export function NavbarSkeleton() {
  return (
    <div className="w-full h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-4 animate-pulse">
      <Pulse className="h-8 w-28 rounded" />
      <div className="flex-1" />
      <Pulse className="h-8 w-32 rounded hidden md:block" />
      <Pulse className="h-8 w-8 rounded-full" />
      <Pulse className="h-8 w-8 rounded-full" />
    </div>
  );
}

// ─── Sidebar Skeleton ─────────────────────────────────────────────────────────
export function SidebarSkeleton() {
  return (
    <aside className="w-full lg:w-64 flex-shrink-0 bg-surfaceMuted border-b lg:border-b-0 ltr:lg:border-r rtl:lg:border-l border-gray-200 z-30 sticky top-[56px] sm:top-[64px] lg:top-[108px] h-auto lg:h-[calc(100vh-108px)] overflow-hidden">
      <nav className="p-0 lg:p-4">
        <ul className="flex flex-row lg:flex-col space-y-0 lg:space-y-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <li key={i} className="flex-shrink-0 px-6 lg:px-4 py-3">
              <Pulse className="h-4 w-full max-w-[140px] rounded" />
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

// ─── Product Card Skeleton ────────────────────────────────────────────────────
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden animate-pulse">
      <Pulse className="w-full aspect-square" />
      <div className="p-3 space-y-2">
        <Pulse className="h-4 w-3/4 rounded" />
        <Pulse className="h-3 w-1/2 rounded" />
        <div className="flex items-center justify-between pt-1">
          <Pulse className="h-5 w-16 rounded" />
          <Pulse className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ─── Product Listing Skeleton ─────────────────────────────────────────────────
export function ProductListingSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="flex-1">
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4 animate-pulse">
        <Pulse className="h-9 w-28 rounded" />
        <Pulse className="h-9 w-28 rounded" />
        <Pulse className="h-9 w-28 rounded" />
        <div className="flex-1" />
        <Pulse className="h-9 w-24 rounded" />
      </div>
      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// ─── Product Detail Skeleton ──────────────────────────────────────────────────
export function ProductDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image */}
        <Pulse className="w-full aspect-square rounded-xl" />
        {/* Info */}
        <div className="space-y-4">
          <Pulse className="h-7 w-3/4 rounded" />
          <Pulse className="h-5 w-1/3 rounded" />
          <Pulse className="h-6 w-1/4 rounded" />
          <div className="space-y-2 pt-2">
            <Pulse className="h-4 w-full rounded" />
            <Pulse className="h-4 w-5/6 rounded" />
            <Pulse className="h-4 w-4/6 rounded" />
          </div>
          <div className="flex gap-3 pt-4">
            <Pulse className="h-11 flex-1 rounded" />
            <Pulse className="h-11 w-11 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Cart Item Skeleton ───────────────────────────────────────────────────────
export function CartItemSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 border-b border-gray-100 animate-pulse">
      <Pulse className="h-20 w-20 flex-shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Pulse className="h-4 w-3/4 rounded" />
        <Pulse className="h-3 w-1/2 rounded" />
        <div className="flex items-center justify-between pt-2">
          <Pulse className="h-8 w-24 rounded" />
          <Pulse className="h-5 w-16 rounded" />
        </div>
      </div>
    </div>
  );
}

// ─── Cart Page Skeleton ───────────────────────────────────────────────────────
export function CartPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6 animate-pulse">
        <Pulse className="h-7 w-32 rounded" />
        <Pulse className="h-9 w-28 rounded" />
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Items */}
        <div className="flex-1 bg-white rounded-xl border border-gray-100 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <CartItemSkeleton key={i} />
          ))}
        </div>
        {/* Summary */}
        <div className="w-full lg:w-80 space-y-3 animate-pulse">
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <Pulse className="h-5 w-32 rounded" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Pulse className="h-4 w-24 rounded" />
                <Pulse className="h-4 w-16 rounded" />
              </div>
            ))}
            <Pulse className="h-px w-full rounded" />
            <div className="flex justify-between">
              <Pulse className="h-5 w-20 rounded" />
              <Pulse className="h-5 w-20 rounded" />
            </div>
            <Pulse className="h-11 w-full rounded-lg mt-2" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Checkout Skeleton ────────────────────────────────────────────────────────
export function CheckoutSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-pulse">
      <Pulse className="h-7 w-40 rounded mb-6" />
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: form */}
        <div className="flex-1 space-y-4">
          {/* Address */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <Pulse className="h-5 w-36 rounded" />
            <Pulse className="h-16 w-full rounded-lg" />
            <Pulse className="h-16 w-full rounded-lg" />
          </div>
          {/* Shipping */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <Pulse className="h-5 w-40 rounded" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Pulse className="h-4 w-4 rounded-full" />
                <Pulse className="h-4 flex-1 rounded" />
                <Pulse className="h-4 w-16 rounded" />
              </div>
            ))}
          </div>
          {/* Payment */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <Pulse className="h-5 w-32 rounded" />
            <div className="flex items-center gap-3">
              <Pulse className="h-4 w-4 rounded-full" />
              <Pulse className="h-4 w-32 rounded" />
            </div>
          </div>
        </div>
        {/* Right: summary */}
        <div className="w-full lg:w-80 space-y-3">
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <Pulse className="h-5 w-28 rounded" />
            {Array.from({ length: 3 }).map((_, i) => (
              <CartItemSkeleton key={i} />
            ))}
            <div className="pt-2 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Pulse className="h-4 w-24 rounded" />
                  <Pulse className="h-4 w-16 rounded" />
                </div>
              ))}
            </div>
            <Pulse className="h-11 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Table Row Skeleton ───────────────────────────────────────────────────────
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="animate-pulse border-b border-gray-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Pulse className={`h-4 rounded ${i === 0 ? "w-24" : i === cols - 1 ? "w-16" : "w-full"}`} />
        </td>
      ))}
    </tr>
  );
}

// ─── Orders Table Skeleton ────────────────────────────────────────────────────
export function OrdersTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <Pulse className="h-9 w-48 rounded" />
        <Pulse className="h-9 w-28 rounded" />
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {["w-28", "w-24", "w-20", "w-20", "w-16", "w-20"].map((w, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <Pulse className={`h-4 ${w} rounded`} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} cols={6} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Order Detail Skeleton ────────────────────────────────────────────────────
export function OrderDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-pulse space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Pulse className="h-7 w-48 rounded" />
        <Pulse className="h-9 w-28 rounded" />
      </div>
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
            <Pulse className="h-3 w-20 rounded" />
            <Pulse className="h-5 w-28 rounded" />
          </div>
        ))}
      </div>
      {/* Items table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <Pulse className="h-5 w-24 rounded" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <CartItemSkeleton key={i} />
        ))}
      </div>
      {/* Totals */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-2 w-full md:w-72 md:ml-auto">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <Pulse className="h-4 w-24 rounded" />
            <Pulse className="h-4 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Dashboard Skeleton ───────────────────────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <div className="flex-1 p-4 md:p-6 animate-pulse space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
            <Pulse className="h-3 w-24 rounded" />
            <Pulse className="h-7 w-20 rounded" />
            <Pulse className="h-3 w-16 rounded" />
          </div>
        ))}
      </div>
      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <Pulse className="h-5 w-32 rounded" />
        <Pulse className="w-full h-48 rounded-lg" />
      </div>
      {/* Table */}
      <OrdersTableSkeleton rows={5} />
    </div>
  );
}

// ─── Search Results Skeleton ──────────────────────────────────────────────────
export function SearchResultsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-1 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2">
          <Pulse className="h-10 w-10 flex-shrink-0 rounded-md" />
          <div className="flex-1 space-y-1.5">
            <Pulse className="h-3.5 w-3/4 rounded" />
            <Pulse className="h-3 w-1/3 rounded" />
          </div>
          <Pulse className="h-4 w-14 rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Wishlist / Favorites Skeleton ────────────────────────────────────────────
export function WishlistSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── Notifications Skeleton ───────────────────────────────────────────────────
export function NotificationsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3">
          <Pulse className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Pulse className="h-4 w-3/4 rounded" />
            <Pulse className="h-3 w-1/2 rounded" />
          </div>
          <Pulse className="h-8 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Form Skeleton ────────────────────────────────────────────────────────────
export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Pulse className="h-4 w-28 rounded" />
          <Pulse className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <Pulse className="h-11 w-36 rounded-lg mt-2" />
    </div>
  );
}

// ─── Credit Limit Skeleton ────────────────────────────────────────────────────
export function CreditLimitSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-4">
      <Pulse className="h-4 w-32 rounded" />
      <Pulse className="h-2 w-full rounded-full" />
      <div className="flex justify-between">
        <Pulse className="h-3 w-20 rounded" />
        <Pulse className="h-3 w-20 rounded" />
      </div>
    </div>
  );
}

// ─── Forecast Skeleton ────────────────────────────────────────────────────────
export function ForecastSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <Pulse className="h-7 w-32 rounded" />
        <Pulse className="h-9 w-28 rounded" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-gray-100">
            <Pulse className="h-4 w-40 rounded" />
            <Pulse className="h-4 flex-1 rounded" />
            <Pulse className="h-4 w-20 rounded" />
            <Pulse className="h-8 w-20 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Statement Skeleton ───────────────────────────────────────────────────────
export function StatementSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <Pulse className="h-7 w-36 rounded" />
        <Pulse className="h-9 w-32 rounded" />
      </div>
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
            <Pulse className="h-3 w-24 rounded" />
            <Pulse className="h-6 w-28 rounded" />
          </div>
        ))}
      </div>
      <OrdersTableSkeleton rows={8} />
    </div>
  );
}

// ─── Multi-Shipping Skeleton ──────────────────────────────────────────────────
export function MultiShippingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-pulse space-y-6">
      <Pulse className="h-7 w-48 rounded" />
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Pulse className="h-8 w-8 rounded-full" />
            {i < 3 && <Pulse className="h-1 w-12 rounded" />}
          </div>
        ))}
      </div>
      {/* Address blocks */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
          <Pulse className="h-5 w-40 rounded" />
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j} className="flex items-center gap-3">
              <Pulse className="h-4 w-4 rounded" />
              <Pulse className="h-4 flex-1 rounded" />
              <Pulse className="h-4 w-16 rounded" />
            </div>
          ))}
        </div>
      ))}
      <div className="flex justify-end gap-3">
        <Pulse className="h-11 w-28 rounded-lg" />
        <Pulse className="h-11 w-36 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Quick Order Skeleton ─────────────────────────────────────────────────────
export function QuickOrderSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-pulse space-y-4">
      <Pulse className="h-7 w-36 rounded" />
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <Pulse className="h-10 w-full rounded-lg" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100">
              <Pulse className="h-10 w-10 rounded-md" />
              <div className="flex-1 space-y-1">
                <Pulse className="h-4 w-3/4 rounded" />
                <Pulse className="h-3 w-1/3 rounded" />
              </div>
              <Pulse className="h-8 w-20 rounded" />
              <Pulse className="h-8 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Order Attachments Skeleton ───────────────────────────────────────────────
export function OrderAttachmentsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <Pulse className="h-7 w-40 rounded" />
        <Pulse className="h-9 w-28 rounded" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-gray-100">
            <Pulse className="h-8 w-8 rounded flex-shrink-0" />
            <Pulse className="h-4 flex-1 rounded" />
            <Pulse className="h-4 w-24 rounded" />
            <Pulse className="h-8 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page-level loading wrappers (for loading.tsx files) ──────────────────────

/** Full-width centered skeleton wrapper — used as Suspense fallbacks */
export function PageSkeleton({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[60vh]">{children}</div>;
}
