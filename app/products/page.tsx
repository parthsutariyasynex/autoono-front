"use client";

import { Suspense, useEffect, useState, useMemo, useCallback, useRef } from "react";
import { ShoppingCart, X, Star, ChevronLeft, ChevronRight, ChevronDown, AlertTriangle, Info, Check, Filter, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductDialog from "../components/ProductDialog";
import ProductEnquiryModal from "../components/ProductEnquiryModal";
import { checkAuth } from "./api";
import { useCart } from "@/modules/cart/hooks/useCart";
import SidebarFilter from "../components/SidebarFilter";
import HorizontalFilter from "../components/HorizontalFilter";
import Drawer from "../components/Drawer";
import Modal from "../components/Modal";
import { api } from "@/lib/api/api-client";
import { formatPrice, redirectToLogin, formatMagentoQueryParams, parseMagentoQueryParams } from "@/utils/helpers";
import Price from "../components/Price";
import PortalDropdown from "@/components/PortalDropdown";

import { toast } from "react-hot-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocalePath } from "@/hooks/useLocalePath";
import { useLocale } from "@/lib/i18n/client";

const PAGE_SIZE = 20;

// Translation keys for table headers — resolved inside the component using t()
const TABLE_HEADER_KEYS = ['m.brand', 'm.size', 'm.pattern', 'm.year', 'm.origin', 'm.image', 'm.offer', 'm.stock', 'm.price', 'm.action'] as const;
const COL_WIDTHS = ['8%', '13%', '13%', '6%', '7%', '7%', '9%', '9%', '10%', '110px'] as const;
const SHIMMER_ROWS = 10;
const ROW_HEIGHT = 'h-auto md:h-[52px]';

function TableColGroup() {
  return (
    <colgroup>
      {COL_WIDTHS.map((w, i) => <col key={i} style={{ width: w }} />)}
    </colgroup>
  );
}

function ShimmerRows() {
  return (
    <>
      {Array.from({ length: SHIMMER_ROWS }).map((_, i) => (
        <tr key={`shimmer-${i}`} className={`animate-pulse ${ROW_HEIGHT}`}>
          {TABLE_HEADER_KEYS.map((_, j) => (
            <td key={j} className="px-4">
              <div className="h-3 bg-gray-100 rounded w-full"></div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// Tiny wrapper to satisfy Next.js Suspense requirement for useSearchParams
function SearchParamsReader({ onParams }: { onParams: (sp: URLSearchParams) => void }) {
  const sp = useSearchParams();
  useEffect(() => { onParams(sp); }, [sp, onParams]);
  return null;
}

function MobileCardShimmer() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-100 p-3 animate-pulse">
          <div className="flex gap-2.5">
            <div className="flex-1 space-y-1.5">
              <div className="h-2 bg-gray-200 rounded w-14"></div>
              <div className="h-3 bg-gray-200 rounded w-full max-w-[140px]"></div>
              <div className="h-2.5 bg-gray-200 rounded w-24"></div>
              <div className="h-2 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
            <div className="h-3.5 bg-gray-200 rounded w-20"></div>
            <div className="flex gap-1">
              <div className="h-8 w-16 bg-gray-200 rounded-lg"></div>
              <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export default function ProductsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const lp = useLocalePath();
  const locale = useLocale();
  const [searchParams, setSearchParamsState] = useState<URLSearchParams | null>(null);
  const handleParams = useCallback((sp: URLSearchParams) => setSearchParamsState(sp), []);
  const { cart, addToCart } = useCart();
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [sortBy, setSortBy] = useState<string>("none");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [selectedFilterLabels, setSelectedFilterLabels] = useState<Record<string, { value: string; label: string }[]>>({});
  const [apiFilters, setApiFilters] = useState<any[] | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [inquiryProduct, setInquiryProduct] = useState<any | null>(null);
  const [previewProduct, setPreviewProduct] = useState<any | null>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favIds, setFavIds] = useState<number[]>([]);

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem("favourites");
    if (stored) setFavIds(JSON.parse(stored));
    if (searchParams) {
      const { filters, page, sortBy } = parseMagentoQueryParams(searchParams);
      if (Object.keys(filters).length > 0) setSelectedFilters(filters);
      setCurrentPage(page);
      setSortBy(sortBy);
    }
    setIsInitialized(true);
  }, [searchParams]);

  useEffect(() => {
    if (!isMounted) return;
    const newUrlParams = formatMagentoQueryParams(selectedFilters, currentPage, sortBy);
    const currentUrlParams = searchParams?.toString() || "";
    if (newUrlParams !== currentUrlParams) {
      const newUrl = `${window.location.pathname}${newUrlParams ? `?${newUrlParams}` : ""}`;
      router.replace(newUrl, { scroll: false });
    }
  }, [selectedFilters, currentPage, sortBy, isMounted, router, searchParams]);

  const toggleFavorite = async (product: any) => {
    const { product_id: productId } = product;
    const stored = localStorage.getItem("favourites");
    const favIds: number[] = stored ? JSON.parse(stored) : [];
    if (!favIds.includes(productId)) {
      favIds.push(productId);
      localStorage.setItem("favourites", JSON.stringify(favIds));
      setFavIds(favIds);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        const toastId = toast.loading("Adding to favorites...");
        try {
          await api.post("/kleverapi/favorite-products", { product_id: productId });
          toast.success(t("favorites.cartAdded"), { id: toastId });
        } catch (err) {
          console.error("API favorite add error:", err);
          toast.error("Could not sync favorites", { id: toastId });
        }
      }
    }
    router.push(lp("/favorites"));
  };

  const [debouncedFilters, setDebouncedFilters] = useState(selectedFilters);
  const isFirstRender = useRef(true);
  useEffect(() => {
    // On first render after init, apply filters immediately (no debounce)
    if (isFirstRender.current && isInitialized) {
      isFirstRender.current = false;
      setDebouncedFilters(selectedFilters);
      return;
    }
    const handler = setTimeout(() => setDebouncedFilters(selectedFilters), 500);
    return () => clearTimeout(handler);
  }, [selectedFilters, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return; // Don't fetch until URL params are parsed
    const abortController = new AbortController();
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");
        // Token comes from localStorage (set by ProtectedLayout after session sync).
        // If token is missing, just skip the fetch silently (ProtectedLayout will set it).
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) return;
        // Read locale from multiple sources for reliability
        let fetchLocale = "en";
        if (window.location.pathname.startsWith("/ar")) fetchLocale = "ar";
        else {
          const cookieMatch = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
          if (cookieMatch?.[1] === "ar") fetchLocale = "ar";
        }
        // console.log("[PRODUCTS FETCH]", fetchLocale);
        const headers: HeadersInit = { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, "x-locale": fetchLocale };
        const queryString = formatMagentoQueryParams(debouncedFilters, currentPage, sortBy);
        const url = `/api/category-products?${queryString}&categoryId=5&pageSize=${PAGE_SIZE}&lang=${fetchLocale}`;
        const res = await fetch(url, { headers, signal: abortController.signal });
        if (!res.ok) {
          if (res.status === 401) { localStorage.removeItem("token"); redirectToLogin(router); return; }
          throw new Error(`API Error: ${res.status}`);
        }
        const data = await res.json();
        // Debug removed
        const productArray = Array.isArray(data.products) ? data.products : (Array.isArray(data.items) ? data.items : []);
        const total = typeof data.total_count === "number" ? data.total_count : productArray.length;
        if (abortController.signal.aborted) return;
        setProducts(productArray);
        setTotalCount(total);
        if (data.filters) setApiFilters(data.filters);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(t("products.noProducts"));
        console.error(err);
      } finally {
        if (!abortController.signal.aborted) setLoading(false);
      }
    };
    loadProducts();
    return () => abortController.abort();
  }, [router, currentPage, debouncedFilters, sortBy, isInitialized]);
  // Note: locale intentionally excluded — fetchLocale reads from window.location directly
  // Adding locale here causes double-fetch and abort race condition

  const handleFilterChange = useCallback(
    (filters: Record<string, string[]>, labels: Record<string, { value: string; label: string }[]>) => {
      setSelectedFilters(filters);
      setSelectedFilterLabels(labels);
      setCurrentPage(1);
    }, [],
  );

  const clearAllFilters = () => { setSelectedFilters({}); setSelectedFilterLabels({}); setIsFavorite(false); setCurrentPage(1); };

  const removeSpecificFilter = (code: string, value: string) => {
    const nextFilters = { ...selectedFilters };
    nextFilters[code] = (nextFilters[code] || []).filter(v => v !== value);
    if (nextFilters[code].length === 0) delete nextFilters[code];
    const nextLabels = { ...selectedFilterLabels };
    if (nextLabels[code]) { nextLabels[code] = nextLabels[code].filter(l => l.value !== value); if (nextLabels[code].length === 0) delete nextLabels[code]; }
    setSelectedFilters(nextFilters);
    setSelectedFilterLabels(nextLabels);
    setCurrentPage(1);
  };

  const handleAddToCart = useCallback(async (sku: string) => {
    try {
      setAddingToCart(sku);
      await addToCart(sku, 1);
      toast.success("Product added to cart!");
      setJustAdded(sku);
      setTimeout(() => setJustAdded(null), 2000);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "401") {
        localStorage.removeItem("token");
        router.replace(lp("/login"));
      }
      else toast.error("Failed to add to cart");
    } finally {
      setAddingToCart(null);
    }
  }, [addToCart, router]);

  const getStockBadge = (product: any) => {
    const label = product?.stock_label === "Available" ? t("stock.available") : product?.stock_label === "Not Available" ? t("stock.not_available") : product?.stock_label === "Limited" ? t("stock.limited") : product?.stock_label || (product?.is_in_stock ? t("stock.available") : t("stock.not_available"));
    const apiColor = product?.stock_color?.toLowerCase() || (product?.is_in_stock ? "green" : "red");
    const colorClass = apiColor === "green" ? "bg-green-500" : apiColor === "yellow" ? "bg-yellow-400" : "bg-red-500";
    return (
      <div className="flex flex-col items-center justify-center text-center gap-1">
        <span className={`w-4 h-4 rounded-full border border-gray-100 shadow-sm ${colorClass}`}></span>
        <span className="text-[10px] font-black text-gray-700 uppercase leading-none">{label}</span>
      </div>
    );
  };

  const sortedProducts = useMemo(() => {
    let result = [...products];
    if (isFavorite) result = result.filter(p => favIds.includes(p.product_id));
    const selectedOffers = selectedFilters["offers"];
    if (selectedOffers?.length) result = result.filter(p => p?.offer && selectedOffers.some((o: string) => o === p.offer));
    const sw = selectedFilters["width"]?.[0], sh = selectedFilters["height"]?.[0], sr = selectedFilters["rim"]?.[0];
    if (sw || sh || sr) {
      result = result.filter(p => {
        const m = String(p?.tyre_size || "").trim().match(/^(\d+)\/?(\d+)?\s*R?\s*(\d+\.?\d*)?/i);
        if (!m) return false;
        return (!sw || m[1] === sw) && (!sh || m[2] === sh) && (!sr || m[3] === sr);
      });
    }
    if (sortBy === "price-asc") return result.sort((a, b) => (a.final_price ?? 0) - (b.final_price ?? 0));
    if (sortBy === "price-desc") return result.sort((a, b) => (b.final_price ?? 0) - (a.final_price ?? 0));
    return result;
  }, [products, sortBy, isFavorite, favIds, selectedFilters]);

  const totalColumns = 10;
  const hasSizeFilter = selectedFilters["width"] || selectedFilters["height"] || selectedFilters["rim"];
  const displayCount = hasSizeFilter ? sortedProducts.length : totalCount;
  const totalPages = Math.ceil(displayCount / PAGE_SIZE);

  const handleHorizontalSearch = useCallback((width: string, height: string, rim: string) => {
    setSelectedFilters(prev => {
      const nf = { ...prev };
      if (width) nf["width"] = [width]; else delete nf["width"];
      if (height) nf["height"] = [height]; else delete nf["height"];
      if (rim) nf["rim"] = [rim]; else delete nf["rim"];
      return nf;
    });
    setSelectedFilterLabels(prev => {
      const nl = { ...prev };
      if (width) nl["width"] = [{ value: width, label: width }]; else delete nl["width"];
      if (height) nl["height"] = [{ value: height, label: height }]; else delete nl["height"];
      if (rim) nl["rim"] = [{ value: rim, label: rim }]; else delete nl["rim"];
      return nl;
    });
    setCurrentPage(1);
  }, []);

  /* ══════════════════════════════════════════════════════════════
     MOBILE PRODUCT CARD
  ══════════════════════════════════════════════════════════════ */
  const renderProductCard = (product: any, index: number) => {
    const brandName = product?.brand || (product?.name ? product.name.split(' ')[0] : "N/A");
    const isOutOfStock = product.stock_status === "Not Available" || Number(product?.stock_qty ?? 0) <= 0;
    const stockLabel = product?.stock_label === "Available" ? t("stock.available") : product?.stock_label === "Not Available" ? t("stock.not_available") : product?.stock_label === "Limited" ? t("stock.limited") : product?.stock_label || (product?.is_in_stock ? t("stock.available") : t("stock.not_available"));
    const stockColor = product?.stock_color?.toLowerCase() || (product?.is_in_stock ? "green" : "red");
    const dotColor = stockColor === "green" ? "bg-green-500" : stockColor === "yellow" ? "bg-yellow-400" : "bg-red-500";

    return (
      <div key={index} className="bg-white rounded-lg border border-gray-100 shadow-sm p-2.5 sm:p-3 flex flex-col gap-1.5">
        {/* Top: content left + image right */}
        <div className="flex gap-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{brandName}</p>
            <p className="text-[12px] md:text-[13px] font-black text-gray-900 leading-tight mt-0.5 truncate">{product?.pattern || product?.name || "—"}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[12px] font-bold text-black">{product?.tyre_size || "—"}</span>
              <div onClick={() => setSelectedProduct(product)} className="w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center text-[9px] font-bold text-white cursor-pointer hover:bg-yellow-400 hover:text-black transition-all shadow-sm active:scale-95 flex-shrink-0">i</div>
              {product?.origin && <span className="text-[11px] text-gray-400 font-normal">{t(`data.${product.origin}`) !== `data.${product.origin}` ? t(`data.${product.origin}`) : product.origin}</span>}
              {product?.year && <span className="text-[11px] text-gray-400 font-mono font-normal">{product.year}</span>}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
              <span className="text-[10px] font-bold text-gray-600 uppercase">{stockLabel}</span>
            </div>
            {product?.offer && <p className="text-[10px] font-bold text-red-600 uppercase mt-1">{product.offer}</p>}
          </div>
          <div
            className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-lg border border-gray-100 overflow-hidden bg-gray-50 flex items-center justify-center cursor-pointer"
            onClick={() => { if (product?.image_url) { setSelectedImage(product.image_url); setPreviewProduct(product); setIsImageModalOpen(true); } }}
          >
            {product?.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" /> : <span className="text-[8px] text-gray-300 font-bold uppercase">No Img</span>}
          </div>
        </div>
        {/* Bottom: price left + actions right */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-2 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[13px] font-black text-black rubik-sans truncate">
              <Price amount={product?.final_price || 0} />
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {!isOutOfStock ? (
              <button
                onClick={() => handleAddToCart(product.sku)}
                disabled={addingToCart === product.sku}
                className={`h-9 px-2.5 rounded-lg flex items-center gap-1.5 text-[11px] font-black uppercase shadow-sm active:scale-95 cursor-pointer flex-shrink-0 ${justAdded === product.sku ? "bg-green-500 text-white" : "bg-[#f5b21a] text-black"}`}
              >
                {addingToCart === product.sku ? (
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : justAdded === product.sku ? (
                  <><Check size={14} strokeWidth={3} /> {t("favorites.cartAdded")}</>
                ) : (
                  <><ShoppingCart size={14} strokeWidth={2.5} /></>
                )}
              </button>
            ) : (
              <button
                onClick={() => { setInquiryProduct(product); setIsInquiryModalOpen(true); }}
                className="h-9 px-2.5 bg-[#f5b21a] text-black rounded-lg flex items-center gap-1.5 text-[11px] font-black uppercase shadow-sm active:scale-95 cursor-pointer flex-shrink-0"
              >
                <Info size={14} strokeWidth={2.5} />
              </button>
            )}
            <button
              onClick={() => toggleFavorite(product)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center active:scale-95 cursor-pointer flex-shrink-0 ${favIds.includes(product.product_id) ? "bg-[#f5b21a] text-black" : "bg-gray-100 text-gray-400"}`}
            >
              <Star size={16} fill={favIds.includes(product.product_id) ? "currentColor" : "none"} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════
     PAGINATION (shared)
  ══════════════════════════════════════════════════════════════ */
  const renderPagination = (compact = false) => {
    const show = !loading && displayCount > 0;
    return (
      <div className={`flex items-center justify-between ${compact ? 'py-3 px-1' : 'px-6 h-[52px] border-t border-gray-100 bg-gray-50/30'} ${show ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
        <span className={`font-black text-gray-400 uppercase tracking-widest ${compact ? 'text-[10px]' : 'text-[10px]'}`}>
          {compact ? `${displayCount} ${t("m.products")}` : <>{t("m.found")} <span className="text-gray-900">{displayCount}</span> {t("m.products")}</>}
        </span>
        <div className="flex items-center gap-1 md:gap-1.5">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className={`border border-gray-200 rounded-lg md:rounded-xl bg-white disabled:opacity-30 ${compact ? 'p-1.5' : 'p-2'}`}><ChevronLeft size={compact ? 14 : 16} /></button>
          {Array.from({ length: Math.min(5, totalPages || 1) }).map((_, i) => (
            <button key={i} onClick={() => setCurrentPage(i + 1)} className={`rounded-lg md:rounded-xl font-black ${compact ? 'w-8 h-8 text-[11px]' : 'w-9 h-9 text-xs'} ${currentPage === i + 1 ? "bg-[#f5b21a] text-black" : "bg-white text-gray-400 border border-gray-200"}`}>{i + 1}</button>
          ))}
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className={`border border-gray-200 rounded-lg md:rounded-xl bg-white disabled:opacity-30 ${compact ? 'p-1.5' : 'p-2'}`}><ChevronRight size={compact ? 14 : 16} /></button>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <>
      <Suspense fallback={null}><SearchParamsReader onParams={handleParams} /></Suspense>
      <div className="flex">
        {/* Desktop Sidebar Track */}
        <div className="hidden xl:flex flex-col flex-shrink-0 self-stretch bg-white border-r border-gray-200">
          <SidebarFilter
            onFilterChange={handleFilterChange}
            selectedFilters={selectedFilters}
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
            initialFilters={apiFilters}
          />
        </div>

        {/* Mobile Filter Drawer */}
        <Drawer isOpen={isMobileFilterOpen} onClose={() => setIsMobileFilterOpen(false)}>
          <div className="flex flex-col h-full">
            <div className="bg-[#f5b21a] px-5 py-4 flex items-center justify-between flex-shrink-0">
              <h2 className="text-[14px] font-black text-black uppercase tracking-tight">Filter Options</h2>
              {Object.keys(selectedFilters).length > 0 && (
                <button onClick={() => { clearAllFilters(); setIsMobileFilterOpen(false); }} className="text-[11px] font-bold text-black/70 uppercase underline">{t("m.clear-all")}</button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {/* Render SidebarFilter content directly — override its aside wrapper via CSS */}
              <div className="[&>aside]:!w-full [&>aside]:!h-auto [&>aside]:!static [&>aside]:!border-0 [&>aside]:!overflow-visible [&>aside>div]:!static [&>aside>div]:!h-auto [&>aside>div>div:first-child]:!hidden">
                <SidebarFilter onFilterChange={(f, l) => { handleFilterChange(f, l); setIsMobileFilterOpen(false); }} selectedFilters={selectedFilters} isCollapsed={false} setIsCollapsed={() => { }} initialFilters={apiFilters} />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={() => setIsMobileFilterOpen(false)} className="w-full h-[44px] bg-black text-white font-black uppercase text-[12px] tracking-widest rounded-lg active:scale-95 cursor-pointer">
                Apply Filters
              </button>
            </div>
          </div>
        </Drawer>

        {/* Mobile Search Drawer */}
        <Drawer isOpen={isMobileSearchOpen} onClose={() => setIsMobileSearchOpen(false)}>
          <div className="flex flex-col h-full">
            <div className="bg-[#f5b21a] px-5 py-4 flex-shrink-0">
              <h2 className="text-[14px] font-black text-black uppercase tracking-tight">{t("m.search-by-size")}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <HorizontalFilter vertical onSearch={(w, h, r) => { handleHorizontalSearch(w, h, r); if (w && h && r) setIsMobileSearchOpen(false); }} initialValues={{ width: debouncedFilters["width"]?.[0] || "", height: debouncedFilters["height"]?.[0] || "", rim: debouncedFilters["rim"]?.[0] || "" }} />
            </div>
          </div>
        </Drawer>

        <div className="flex-1 flex flex-col w-full">

          {/* ── MOBILE CONTROLS ── */}
          <div className="xl:hidden flex flex-col gap-2 mb-3">
            {/* Controls: 2 cols on mobile, 4 cols on tablet */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button onClick={() => router.push(lp("/favorites"))} className="h-[44px] bg-white border border-gray-200 rounded-xl flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider shadow-sm active:scale-95 cursor-pointer">
                <Star className="w-4 h-4 fill-black text-black" /> Favourites
              </button>
              <button onClick={() => setIsMobileSearchOpen(true)} className="h-[44px] bg-[#f5b21a] rounded-xl flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider shadow-sm active:scale-95 cursor-pointer">
                <Search className="w-4 h-4" /> {t("m.search")}
              </button>
              <button onClick={() => setIsMobileSortOpen(true)} className="h-[44px] bg-white border border-gray-200 rounded-xl flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider shadow-sm active:scale-95 cursor-pointer">
                <ChevronDown className="w-4 h-4" />
                {sortBy === "none" ? t("products.sortByDefault") : sortBy === "price-asc" ? t("products.sortByLowToHigh") : t("products.sortByHighToLow")}
              </button>
              <button onClick={() => setIsMobileFilterOpen(true)} className="h-[44px] bg-white border border-gray-200 rounded-xl flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider shadow-sm active:scale-95 cursor-pointer">
                <Filter className="w-4 h-4" /> Filter
                {Object.keys(selectedFilters).length > 0 && <span className="w-5 h-5 bg-[#f5b21a] rounded-full text-[10px] font-black flex items-center justify-center">{Object.keys(selectedFilters).length}</span>}
              </button>
            </div>
            {/* Active filter chips */}
            {Object.keys(selectedFilterLabels).length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar-hide py-1">
                {Object.entries(selectedFilterLabels).flatMap(([code, items]) => items.map((item) => (
                  <div key={`${code}-${item.value}`} className="flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-full text-[10px] font-bold text-gray-700 whitespace-nowrap flex-shrink-0">
                    {item.label} <button onClick={() => removeSpecificFilter(code, item.value)} className="text-gray-400"><X size={12} /></button>
                  </div>
                )))}
                <button onClick={clearAllFilters} className="text-[10px] font-black text-red-500 uppercase whitespace-nowrap flex-shrink-0 px-2">Clear</button>
              </div>
            )}
          </div>

          {/* Mobile Sort Bottom Sheet */}
          {isMobileSortOpen && (
            <div className="xl:hidden fixed inset-0 z-[100]">
              <div className="absolute inset-0 bg-black/40" onClick={() => setIsMobileSortOpen(false)} />
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h3 className="text-[14px] font-black uppercase tracking-tight">Sort By</h3>
                  <button onClick={() => setIsMobileSortOpen(false)} className="p-1 text-gray-400 hover:text-black"><X size={20} /></button>
                </div>
                <div className="flex flex-col py-2">
                  {[
                    { value: "none", label: t("products.sortByDefault") },
                    { value: "price-asc", label: t("products.sortByLowToHigh") },
                    { value: "price-desc", label: t("products.sortByHighToLow") },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortBy(opt.value); setIsMobileSortOpen(false); }}
                      className={`px-5 py-3.5 text-[13px] font-bold text-left flex items-center justify-between transition-colors ${sortBy === opt.value ? "bg-[#f5b21a]/10 text-black" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      {opt.label}
                      {sortBy === opt.value && <Check size={18} className="text-[#f5b21a]" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
                <div className="h-[env(safe-area-inset-bottom,0px)]" />
              </div>
            </div>
          )}

          {/* ── MOBILE/TABLET CARD LIST ── */}
          <div className="xl:hidden flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 overflow-y-auto">
            {loading ? <MobileCardShimmer /> : sortedProducts.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-20 col-span-full"><p className="text-xs font-black text-gray-400 uppercase tracking-widest">{t("products.noProducts")}</p></div>
            ) : sortedProducts.map((p, i) => renderProductCard(p, i))}
          </div>
          <div className="xl:hidden">{renderPagination(true)}</div>

          {/* ── DESKTOP CONTROLS + TABLE ── */}
          <div className="hidden xl:flex flex-col bg-white rounded-none md:rounded-r-2xl shadow-sm border border-gray-200 border-l-0 overflow-hidden">
            {/* Desktop header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center gap-4 min-h-[60px]">
              <div className="flex items-center gap-4">
                <button onClick={() => router.push(lp("/favorites"))} className="bg-gray-50 border border-gray-200 text-black px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm text-xs font-bold active:scale-95 cursor-pointer uppercase tracking-wider">
                  <Star className="w-5 h-5 fill-black text-black" /> {t("sidebar.favoriteProducts")}
                </button>
                <div className="flex flex-1 items-center gap-2 overflow-x-auto custom-scrollbar-hide max-w-[800px]">
                  {isFavorite && (
                    <div className="flex items-center gap-1.5 bg-yellow-400 border border-yellow-500 px-3 py-1.5 rounded-full text-[12px] font-bold text-black shadow-sm flex-shrink-0">
                      {t("sidebar.favoriteProducts")} <button onClick={() => setIsFavorite(false)} className="hover:text-red-700"><X size={14} /></button>
                    </div>
                  )}
                  {Object.entries(selectedFilterLabels).flatMap(([code, items]) => items.map((item) => (
                    <div key={`${code}-${item.value}`} className="flex items-center gap-1 bg-white border border-gray-200 px-4 py-2 rounded-full text-[12px] font-bold text-gray-700 shadow-sm whitespace-nowrap flex-shrink-0">
                      {item.label} <button onClick={() => removeSpecificFilter(code, item.value)} className="hover:text-red-500 text-gray-400"><X size={14} strokeWidth={2.5} /></button>
                    </div>
                  )))}
                </div>
                {Object.keys(selectedFilters).length > 0 && (
                  <button onClick={clearAllFilters} className="text-[10px] font-black text-red-500 uppercase flex items-center gap-1.5 bg-red-50 px-2.5 py-1 rounded-full flex-shrink-0"><X size={12} strokeWidth={3} /> {t("m.clear")}</button>
                )}
              </div>
              <PortalDropdown
                value={sortBy}
                onChange={setSortBy}
                options={[{ label: t("products.sortByDefault"), value: "none" }, { label: t("products.sortByLowToHigh"), value: "price-asc" }, { label: t("products.sortByHighToLow"), value: "price-desc" }]}
                buttonClassName="bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 cursor-pointer shadow-sm hover:border-gray-300 whitespace-nowrap"
                minWidth={150}
              />
            </div>

            {/* Desktop table area */}
            <div className="flex-1 overflow-x-auto">
              <table className="w-full border-collapse table-fixed min-w-[900px]">
                <TableColGroup />
                <thead className="sticky top-0 z-20">
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    {TABLE_HEADER_KEYS.map(key => (
                      <th key={key} className="px-2 md:px-4 py-2 md:py-3 text-[11px] font-black text-black uppercase tracking-widest text-center">{t(key)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? <ShimmerRows /> : products.length === 0 ? (
                    <tr><td colSpan={totalColumns} className="py-24 text-center"><p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">{t("products.noProducts")}</p></td></tr>
                  ) : sortedProducts.map((product, index) => {
                    const brandName = product?.brand || (product?.name ? product.name.split(' ')[0] : "N/A");
                    const isOutOfStock = product.stock_status === "Not Available" || Number(product?.stock_qty ?? 0) <= 0;
                    return (
                      <tr key={index} className={`hover:bg-gray-50/50 transition-colors group ${ROW_HEIGHT}`}>
                        <td className="px-2 md:px-4 text-[12px] font-normal text-gray-700 text-center">{t(`data.${brandName}`) !== `data.${brandName}` ? t(`data.${brandName}`) : brandName}</td>
                        <td className="px-2 md:px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="text-[12px] font-normal text-gray-900 tracking-tight">{product?.tyre_size}</span>
                            <div onClick={() => setSelectedProduct(product)} className="w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center text-[9px] font-bold text-white cursor-pointer hover:bg-yellow-400 hover:text-black transition-all shadow-sm flex-shrink-0">i</div>
                          </div>
                        </td>
                        <td className="px-2 md:px-4 text-[12px] font-normal text-gray-600 text-center">{product?.pattern || "—"}</td>
                        <td className="px-2 md:px-4 text-[12px] font-normal text-gray-500 text-center font-mono">{product?.year || "—"}</td>
                        <td className="px-2 md:px-4 text-[12px] font-normal text-gray-600 text-center">{product?.origin ? (t(`data.${product.origin}`) !== `data.${product.origin}` ? t(`data.${product.origin}`) : product.origin) : "—"}</td>
                        <td className="px-2 md:px-4 text-center">
                          <div className="w-10 h-10 mx-auto">
                            {product?.image_url ? (
                              <div className="relative w-10 h-10 group/img cursor-pointer" onClick={() => { setSelectedImage(product.image_url); setPreviewProduct(product); setIsImageModalOpen(true); }}>
                                <img src={product.image_url} alt={product.name} width={40} height={40} className="w-10 h-10 object-contain rounded border border-gray-100 shadow-sm" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-center justify-center rounded">
                                  <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-black font-bold text-[10px] shadow-lg transform scale-50 group-hover/img:scale-100 transition-transform duration-300">+</div>
                                </div>
                              </div>
                            ) : <span className="text-[10px] text-gray-300 font-black uppercase leading-[40px]">No Image</span>}
                          </div>
                        </td>
                        <td className="px-2 md:px-4 text-center">{product.offer ? <span className="text-red-600 font-bold text-[10px] uppercase tracking-tight block max-w-[150px] mx-auto">{product.offer}</span> : <span className="text-gray-200">—</span>}</td>
                        <td className="px-2 md:px-4 text-center">{getStockBadge(product)}</td>
                        <td className="px-2 md:px-4 text-center whitespace-nowrap"><span className="text-[12px] font-black text-black tracking-tight rubik-sans"><Price amount={product?.final_price || 0} /></span></td>
                        <td className="px-1 text-center align-middle">
                          <div className="inline-grid grid-cols-3 gap-1 items-center">
                            {/* Col 1: Qty */}
                            {!isOutOfStock ? (
                              <div className="w-8 h-8 border-2 border-gray-100 rounded-md flex items-center justify-center text-[11px] font-black text-gray-900 bg-white shadow-sm">1</div>
                            ) : (
                              <div className="w-8 h-8" />
                            )}
                            {/* Col 2: Cart or Enquiry */}
                            {!isOutOfStock ? (
                              <button onClick={() => handleAddToCart(product.sku)} disabled={addingToCart === product.sku} className={`w-8 h-8 rounded-md flex items-center justify-center shadow-md hover:-translate-y-0.5 transition-all cursor-pointer ${justAdded === product.sku ? "bg-green-500 text-white" : "bg-yellow-400 text-black hover:bg-yellow-500"}`}>
                                {addingToCart === product.sku ? <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : justAdded === product.sku ? <Check size={15} strokeWidth={3} /> : <ShoppingCart size={15} strokeWidth={2.5} />}
                              </button>
                            ) : (
                              <button onClick={() => { setInquiryProduct(product); setIsInquiryModalOpen(true); }} className="w-8 h-8 bg-yellow-400 hover:bg-yellow-500 text-black rounded-md flex items-center justify-center shadow-md active:scale-95 cursor-pointer"><Info size={15} strokeWidth={2.5} /></button>
                            )}
                            {/* Col 3: Wishlist */}
                            <button onClick={() => toggleFavorite(product)} className={`w-8 h-8 rounded-md flex items-center justify-center shadow-md active:scale-95 cursor-pointer ${favIds.includes(product.product_id) ? "bg-yellow-400 text-black" : "bg-white text-gray-400 border border-gray-100 hover:border-yellow-200"}`}>
                              <Star size={15} fill={favIds.includes(product.product_id) ? "currentColor" : "none"} strokeWidth={2.5} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {renderPagination()}
          </div>
        </div>

        {/* Desktop bottom search bar */}
        <div className="hidden xl:flex fixed bottom-0 left-0 right-0 z-[40] bg-white border-t-[4px] border-[#f5a623] shadow-[0_-10px_30px_rgba(0,0,0,0.12)] h-[90px] items-center" style={{ paddingRight: "var(--scrollbar-width)" }}>
          <div className={`w-full transition-all duration-300 ${isSidebarCollapsed ? "pl-[50px]" : "pl-[300px]"}`}>
            <div className="w-full max-w-[1400px] mx-auto px-4">
              <HorizontalFilter onSearch={handleHorizontalSearch} initialValues={{ width: debouncedFilters["width"]?.[0] || "", height: debouncedFilters["height"]?.[0] || "", rim: debouncedFilters["rim"]?.[0] || "" }} />
            </div>
          </div>
        </div>
      </div>
      <ProductDialog product={selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} />
      <ProductEnquiryModal isOpen={isInquiryModalOpen} productSku={inquiryProduct?.sku || ""} productName={inquiryProduct?.name || ""} productPrice={inquiryProduct?.final_price || 0} onClose={() => { setIsInquiryModalOpen(false); setInquiryProduct(null); }} />
      <Drawer isOpen={isImageModalOpen && !!selectedImage} onClose={() => setIsImageModalOpen(false)}>
        <div className="flex flex-col h-full bg-white">
          <div className="bg-[#FFB82B] px-4 md:px-8 py-4 md:py-6 flex items-center justify-center flex-shrink-0">
            <h2 className="text-[14px] md:text-[17px] font-black text-black text-center uppercase tracking-tight">
              {previewProduct ? `${previewProduct?.pattern || '-'} - ${previewProduct?.tyre_size || '-'}` : t("m.preview")}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center justify-center">
            <div className="bg-white flex items-center justify-center min-h-[200px] md:min-h-[400px] w-full">
              <img src={selectedImage} alt={previewProduct ? `${previewProduct?.pattern} - ${previewProduct?.tyre_size}` : t("m.preview")} className="max-w-full max-h-[60vh] md:max-h-[75vh] object-contain rounded-lg" />
            </div>
            <button onClick={() => setIsImageModalOpen(false)} className="mt-6 w-full py-3 md:py-4 bg-black text-white font-black uppercase tracking-widest rounded shadow-xl hover:bg-gray-800 text-sm cursor-pointer active:scale-95">{t("m.close")}</button>
          </div>
        </div>
      </Drawer>
    </>
  );
}
