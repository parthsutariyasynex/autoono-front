"use client";

import { Suspense, useEffect, useState, useMemo, useCallback, useRef } from "react";
import { ShoppingCart, X, Star, ChevronLeft, ChevronRight, ChevronDown, AlertTriangle, Info, Check, Filter } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import ProductDialog from "../components/ProductDialog";
import ProductEnquiryModal from "../components/ProductEnquiryModal";
import AddToCartPopup from "../components/AddToCartPopup";
import { checkAuth } from "../products/api";
import { useCart } from "@/modules/cart/hooks/useCart";
import SidebarFilter from "../components/SidebarFilter";
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

// Base headers/widths — Action column added dynamically only when products need it.
const BASE_HEADER_KEYS = ['m.brand', 'm.name', 'm.image', 'm.stock', 'm.price'] as const;
const BASE_COL_WIDTHS = ['10%', '40%', '10%', '12%', '18%'] as const;
const ACTION_COL_WIDTH = '120px';
const SHIMMER_ROWS = 10;
const ROW_HEIGHT = 'h-auto md:h-[52px]';

function TableColGroup({ showAction }: { showAction: boolean }) {
  return (
    <colgroup>
      {BASE_COL_WIDTHS.map((w, i) => <col key={i} style={{ width: w }} />)}
      {showAction && <col style={{ width: ACTION_COL_WIDTH }} />}
    </colgroup>
  );
}

function ShimmerRows({ colCount }: { colCount: number }) {
  return (
    <>
      {Array.from({ length: SHIMMER_ROWS }).map((_, i) => (
        <tr key={`shimmer-${i}`} className={`animate-pulse ${ROW_HEIGHT}`}>
          {Array.from({ length: colCount }).map((_, j) => (
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

interface ProductsPageProps {
  categoryId?: string | null;
  storeCode?: string | null;
}

export default function ProductsPage({ categoryId: propCategoryId, storeCode: propStoreCode }: ProductsPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, isRtl } = useTranslation();
  const lp = useLocalePath();
  const locale = useLocale();

  // Store code lives in the URL path prefix (e.g. /V101_en/products) — read it here
  // so the products API always uses the right warehouse without a ?store= query param.
  const STORE_CODE_RE_PL = /^[A-Za-z0-9]+_(en|ar)$/;
  const pathStoreCode = (() => {
    const firstSeg = (pathname || "").split("/").filter(Boolean)[0] || "";
    return STORE_CODE_RE_PL.test(firstSeg) ? firstSeg : "";
  })();
  const [searchParams, setSearchParamsState] = useState<URLSearchParams | null>(null);
  const handleParams = useCallback((sp: URLSearchParams) => setSearchParamsState(sp), []);
  const { cart, addToCart } = useCart();
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [isAddedPopupOpen, setIsAddedPopupOpen] = useState(false);
  const [addedProduct, setAddedProduct] = useState<any | null>(null);
  const [productQtys, setProductQtys] = useState<Record<string, number>>({});

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
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);
  const [searchByTerm, setSearchByTerm] = useState("");
  const [itemCodeTerm, setItemCodeTerm] = useState("");

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [inquiryProduct, setInquiryProduct] = useState<any | null>(null);
  const [previewProduct, setPreviewProduct] = useState<any | null>(null);
  const [urlCategoryId, setUrlCategoryId] = useState<string | null>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const isSyncingFromUrl = useRef(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favIds, setFavIds] = useState<number[]>([]);
  const [selectedStoreCode, setSelectedStoreCode] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string>("");

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem("favourites");
    if (stored) setFavIds(JSON.parse(stored));
    if (searchParams) {
      let changed = false;

      const cid = searchParams.get("categoryId");
      if (cid && cid !== urlCategoryId) {
        setUrlCategoryId(cid);
        setCurrentPage(1);
        setProducts([]);
        changed = true;
      }

      const sc = searchParams.get("store");
      if (sc !== selectedStoreCode) {
        setSelectedStoreCode(sc);
        setCurrentPage(1); // Reset page on store change
        setProducts([]);   // Clear old results
        changed = true;
        if (sc) {
          try { localStorage.setItem("selectedStoreCode", sc); } catch { }
        } else {
          try { localStorage.removeItem("selectedStoreCode"); } catch { }
        }
      }

      const sb = searchParams.get("search") || searchParams.get("searchBy") || "";
      if (sb !== searchByTerm) {
        setSearchByTerm(sb);
        setCurrentPage(1);
        setProducts([]);
        // Entering a new search: reset filters so results start clean.
        setSelectedFilters({});
        setSelectedFilterLabels({});
        setApiFilters(null);
        changed = true;
      }

      const ic = searchParams.get("item_code") || searchParams.get("itemCode") || "";
      if (ic !== itemCodeTerm) {
        setItemCodeTerm(ic);
        setCurrentPage(1);
        setProducts([]);
        setSelectedFilters({});
        setSelectedFilterLabels({});
        setApiFilters(null);
        changed = true;
      }

      const { filters, page, sortBy: parsedSortBy } = parseMagentoQueryParams(searchParams);

      if (JSON.stringify(filters) !== JSON.stringify(selectedFilters)) {
        setSelectedFilters(filters);
        setCurrentPage(1);
        changed = true;
      }
      if (page !== currentPage && !changed) { // Only sync page if store/search didn't change (as they force page 1)
        setCurrentPage(page);
        changed = true;
      }
      if (parsedSortBy !== sortBy) {
        setSortBy(parsedSortBy);
        changed = true;
      }

      if (changed) {
        isSyncingFromUrl.current = true;
      }
      setIsInitialized(true);

      // Sync store name from session storage
      if (typeof sessionStorage !== "undefined") {
        const sc = propStoreCode || pathStoreCode || searchParams.get("store") || sessionStorage.getItem("defaultStoreCode") || "";
        const sn = sessionStorage.getItem(`storeName_${sc}`);
        if (sn) setStoreName(sn);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isMounted || !searchParams || !isInitialized) return;

    if (isSyncingFromUrl.current) {
      isSyncingFromUrl.current = false;
      return;
    }

    const next = new URLSearchParams();
    if (currentPage > 1) next.set("page", String(currentPage));
    if (sortBy && sortBy !== "none") next.set("sortBy", sortBy);
    if (searchByTerm) next.set("search", searchByTerm);
    if (itemCodeTerm) next.set("item_code", itemCodeTerm);

    Object.entries(selectedFilters).forEach(([key, values]) => {
      if (Array.isArray(values)) {
        values.forEach((val, index) => next.append(`${key}[${index}]`, val));
      }
    });

    next.sort();
    const current = new URLSearchParams(searchParams.toString());
    current.sort();

    if (next.toString() !== current.toString()) {
      const newUrl = `${window.location.pathname}${next.toString() ? `?${next.toString()}` : ""}`;
      router.replace(newUrl, { scroll: false });
    }
  }, [selectedFilters, currentPage, sortBy, searchByTerm, itemCodeTerm, isMounted, router, searchParams, isInitialized]);

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
    router.push(lp(`/favorites?added=${encodeURIComponent(product.name || "")}`));
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
    const handler = setTimeout(() => setDebouncedFilters(selectedFilters), 300);
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
        // Derive locale from URL: handle both /ar/... and store-code URLs like /V102_ar/...
        const firstSeg = window.location.pathname.split("/").filter(Boolean)[0] || "";
        const storeLocaleMatch = firstSeg.match(/^[A-Za-z0-9]+_(en|ar)$/);
        const pathLocale = storeLocaleMatch ? storeLocaleMatch[1]
          : (firstSeg === "ar" || firstSeg === "en") ? firstSeg : "";
        const cookieLocale = document.cookie.match(/NEXT_LOCALE=([^;]+)/)?.[1] || "";
        const fetchLocale = pathLocale || cookieLocale || "en";
        const headers: HeadersInit = { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, "x-locale": fetchLocale };

        // Always use category-products: it handles search + filters simultaneously and
        // returns filter groups in the response. product-search is only used in the
        // search popup typeahead — it ignores filter params and returns no filter groups.
        const queryString = formatMagentoQueryParams(debouncedFilters, currentPage, sortBy);

        // Priority for categoryId: Prop > URL Param > Default (15)
        const categoryIdFromUrl = propCategoryId || urlCategoryId || "15";

        // Restore storeParam calculation
        const pathStoreCodeFromUrl = window.location.pathname.split("/").filter(Boolean)[0];
        // We avoid forcing a default warehouse code if none is active in the URL or props.
        const effectiveStoreCode = propStoreCode || (STORE_CODE_RE_PL.test(pathStoreCodeFromUrl) ? pathStoreCodeFromUrl : null) || selectedStoreCode || "";
        const storeParam = effectiveStoreCode ? `&storeCode=${encodeURIComponent(effectiveStoreCode)}` : "";

        const searchByParam = searchByTerm ? `&search=${encodeURIComponent(searchByTerm)}` : "";
        const itemCodeParam = itemCodeTerm ? `&item_code=${encodeURIComponent(itemCodeTerm)}` : "";
        const url = `/api/category-products?${queryString ? queryString + "&" : ""}categoryId=${encodeURIComponent(categoryIdFromUrl)}&pageSize=${PAGE_SIZE}&lang=${fetchLocale}${storeParam}${searchByParam}${itemCodeParam}`;
        const res = await fetch(url, { headers, signal: abortController.signal });
        if (!res.ok) {
          if (res.status === 401) { localStorage.removeItem("token"); redirectToLogin(router); return; }
          throw new Error(`API Error: ${res.status}`);
        }
        const data = await res.json();
        console.log("[PRODUCTS DEBUG] Response keys:", Object.keys(data), "products:", Array.isArray(data.products) ? data.products.length : "not array", "items:", Array.isArray(data.items) ? data.items.length : "not array", "total_count:", data.total_count);
        const productArray = Array.isArray(data.products) ? data.products : (Array.isArray(data.items) ? data.items : []);
        const total = typeof data.total_count === "number" ? data.total_count : productArray.length;

        // Normalise final_price only; keep all other API fields (show_old_price,
        // original_price, stock_label, stock_color, is_action, etc.) exactly as returned.
        const mappedProducts = productArray.map((p: any) => ({
          ...p,
          final_price: Number(p.final_price ?? p.special_price ?? p.price ?? 0),
        }));

        if (abortController.signal.aborted) return;
        setProducts(mappedProducts);
        setTotalCount(total);
        if (data.filters) {
          setApiFilters(data.filters);
        }
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
  }, [router, currentPage, debouncedFilters, sortBy, pathStoreCode, selectedStoreCode, searchByTerm, itemCodeTerm, isInitialized]);
  // Note: locale intentionally excluded — fetchLocale reads from window.location directly
  // Adding locale here causes double-fetch and abort race condition


  const handleFilterChange = useCallback(
    (filters: Record<string, string[]>, labels: Record<string, { value: string; label: string }[]>) => {
      setSelectedFilters(filters);
      setSelectedFilterLabels(labels);
      setCurrentPage(1);
    }, [],
  );

  const clearAllFilters = () => { setSelectedFilters({}); setSelectedFilterLabels({}); setIsFavorite(false); setCurrentPage(1); setSearchByTerm(""); setItemCodeTerm(""); };
  const clearSearchBy = () => { setSearchByTerm(""); setCurrentPage(1); };
  const clearItemCode = () => { setItemCodeTerm(""); setCurrentPage(1); };

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

  const handleAddToCart = useCallback(async (product: any) => {
    try {
      const qty = productQtys[product.sku] || 1;
      setAddingToCart(product.sku);
      await addToCart(product.sku, qty);
      setAddedProduct(product);
      setIsAddedPopupOpen(true);
      setJustAdded(product.sku);
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
  }, [addToCart, router, productQtys]);

  // Map the API-provided stock_color string → Tailwind dot class.
  // This is a presentation concern only — the label text comes directly from the API.
  const stockColorClass = (color: string) => {
    const c = (color || "").toLowerCase();
    if (c === "green") return "bg-green-500";
    if (c === "yellow" || c === "orange") return "bg-primary";
    if (c === "red") return "bg-red-500";
    return "bg-gray-400";
  };

  const getStockBadge = (product: any) => (
    <div className="flex flex-col items-center justify-center text-center gap-1">
      <span className={`w-4 h-4 rounded-full border border-gray-100 shadow-sm ${stockColorClass(product.stock_color)}`} />
      <span className="text-caption font-semibold text-black/80 uppercase leading-none">
        {product.stock_label || ""}
      </span>
    </div>
  );

  const sortedProducts = useMemo(() => {
    let result = [...products];
    if (isFavorite) result = result.filter(p => favIds.includes(p.product_id));
    const selectedOffers = selectedFilters["offers"];
    if (selectedOffers?.length) result = result.filter(p => p?.offer && selectedOffers.some((o: string) => o === p.offer));

    if (sortBy === "price-asc") return result.sort((a, b) => (a.final_price ?? 0) - (b.final_price ?? 0));
    if (sortBy === "price-desc") return result.sort((a, b) => (b.final_price ?? 0) - (a.final_price ?? 0));
    return result;
  }, [products, sortBy, isFavorite, favIds, selectedFilters]);

  // Show the Action column only if at least one loaded product has is_action === "Yes".
  // During loading we assume it may appear (prevents column count jump on shimmer → data).
  const showActionColumn = loading || sortedProducts.some(p => p.is_action === "Yes");
  const totalColumns = BASE_HEADER_KEYS.length + (showActionColumn ? 1 : 0);
  const displayCount = totalCount;
  const totalPages = Math.ceil(displayCount / PAGE_SIZE);


  /* ══════════════════════════════════════════════════════════════
     MOBILE PRODUCT CARD
  ══════════════════════════════════════════════════════════════ */
  const renderProductCard = (product: any, index: number) => {
    // All values come directly from the API — no hardcoded fallbacks.
    const showActions = product.is_action === "Yes";
    const showOldPrice = product.show_old_price !== false && product.original_price > product.final_price;
    const isOutOfStock = product.is_in_stock === false || product.stock_label === "Not Available";

    // Resolve relative path from the API-provided product_url.
    let productPath = "#";
    if (product.product_url) {
      try { productPath = new URL(product.product_url).pathname; }
      catch { productPath = product.product_url; }
    }

    return (
      <div key={index} className="bg-white rounded-lg border border-gray-100 shadow-sm p-2.5 sm:p-3 flex flex-col gap-1.5 hover:border-primary/30 transition-colors">
        {/* Top: content left + image right */}
        <Link href={productPath} className="flex gap-2.5 group/card">
          <div className="flex-1 min-w-0">
            <p className="text-caption font-semibold text-black/50 uppercase tracking-wider">{product.brand || "—"}</p>
            <p className="text-body-sm md:text-body font-semibold text-black leading-tight mt-0.5 truncate group-hover/card:text-primary transition-colors">{product.name || "—"}</p>
            {product.item_code && (
              <p className="text-caption text-black/40 font-medium mt-0.5 truncate">{product.item_code}</p>
            )}
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`w-2 h-2 rounded-full ${stockColorClass(product.stock_color)}`} />
              <span className="text-caption font-semibold text-black/70 uppercase">{product.stock_label || ""}</span>
            </div>
          </div>
          <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-lg border border-gray-100 overflow-hidden bg-gray-50 flex items-center justify-center group-hover/card:border-primary/20 transition-colors">
            {product.image_url
              ? <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
              : <span className="text-[8px] text-black/40 font-semibold uppercase">No Img</span>}
          </div>
        </Link>

        {/* Bottom: price left + actions right */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-2 gap-2">
          {/* Price */}
          <div className="flex flex-col min-w-0">
            {showOldPrice && (
              <span className="text-caption font-semibold text-black/50">
                <Price amount={product.original_price} className="font-semibold line-through" />
              </span>
            )}
            <span className="text-body font-semibold text-black rubik-sans truncate">
              <Price amount={product.final_price} />
            </span>
          </div>

          {/* Actions — only when API says is_action === "Yes" */}
          {showActions && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {!isOutOfStock ? (
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={addingToCart === product.sku}
                  className={`h-9 px-2.5 rounded-lg flex items-center gap-1.5 text-label font-semibold uppercase shadow-sm active:scale-95 cursor-pointer flex-shrink-0 ${justAdded === product.sku ? "bg-green-500 text-white" : "bg-primary text-black"}`}
                >
                  {addingToCart === product.sku
                    ? <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    : justAdded === product.sku
                      ? <><Check size={14} strokeWidth={3} />{t("favorites.cartAdded")}</>
                      : <ShoppingCart size={14} strokeWidth={2.5} />}
                </button>
              ) : (
                <button
                  onClick={() => { setInquiryProduct(product); setIsInquiryModalOpen(true); }}
                  className="h-9 px-2.5 bg-primary text-black rounded-lg flex items-center gap-1.5 text-label font-semibold uppercase shadow-sm active:scale-95 cursor-pointer flex-shrink-0"
                >
                  <Info size={14} strokeWidth={2.5} />
                </button>
              )}
              <button
                onClick={() => toggleFavorite(product)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center active:scale-95 cursor-pointer flex-shrink-0 ${favIds.includes(product.product_id) ? "bg-primary text-black" : "bg-gray-100 text-black/50"}`}
              >
                <Star size={16} fill={favIds.includes(product.product_id) ? "currentColor" : "none"} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════
     PAGINATION (shared)
  ══════════════════════════════════════════════════════════════ */
  const renderPagination = (compact = false) => {
    const show = !loading && displayCount > 0;
    const safeTotalPages = Math.max(1, totalPages);
    const WINDOW = 5;
    const endPage = Math.min(safeTotalPages, Math.max(1, currentPage - Math.floor(WINDOW / 2)) + WINDOW - 1);
    const startPage = Math.max(1, endPage - WINDOW + 1);
    const pageNumbers: number[] = [];
    for (let p = startPage; p <= endPage; p++) pageNumbers.push(p);
    return (
      <div className={`flex items-center justify-between ${compact ? 'py-3 px-1' : 'px-6 h-[52px] border-t border-gray-100 bg-gray-50/30'} ${show ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
        <span className={`font-semibold text-black/50 uppercase tracking-widest ${compact ? 'text-caption' : 'text-caption'}`}>
          {compact ? `${displayCount} ${t("m.products")}` : <>{t("m.found")} <span className="text-black">{displayCount}</span> {t("m.products")}</>}
        </span>
        <div className="flex items-center gap-1 md:gap-1.5">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className={`border border-gray-200 rounded-lg md:rounded-xl bg-white disabled:opacity-30 ${compact ? 'p-1.5' : 'p-2'}`}>{isRtl ? <ChevronRight size={compact ? 14 : 16} /> : <ChevronLeft size={compact ? 14 : 16} />}</button>
          {startPage > 1 && (
            <>
              <button onClick={() => setCurrentPage(1)} className={`rounded-lg md:rounded-xl font-semibold ${compact ? 'w-8 h-8 text-label' : 'w-9 h-9 text-xs'} bg-white text-black/50 border border-gray-200`}>1</button>
              {startPage > 2 && <span className="px-1 text-black/40 text-caption">…</span>}
            </>
          )}
          {pageNumbers.map((p) => (
            <button key={p} onClick={() => setCurrentPage(p)} className={`rounded-lg md:rounded-xl font-semibold ${compact ? 'w-8 h-8 text-label' : 'w-9 h-9 text-xs'} ${currentPage === p ? "bg-primary text-black" : "bg-white text-black/50 border border-gray-200"}`}>{p}</button>
          ))}
          {endPage < safeTotalPages && (
            <>
              {endPage < safeTotalPages - 1 && <span className="px-1 text-black/40 text-caption">…</span>}
              <button onClick={() => setCurrentPage(safeTotalPages)} className={`rounded-lg md:rounded-xl font-semibold ${compact ? 'w-8 h-8 text-label' : 'w-9 h-9 text-xs'} bg-white text-black/50 border border-gray-200`}>{safeTotalPages}</button>
            </>
          )}
          <button disabled={currentPage >= safeTotalPages} onClick={() => setCurrentPage(p => p + 1)} className={`border border-gray-200 rounded-lg md:rounded-xl bg-white disabled:opacity-30 ${compact ? 'p-1.5' : 'p-2'}`}>{isRtl ? <ChevronLeft size={compact ? 14 : 16} /> : <ChevronRight size={compact ? 14 : 16} />}</button>
        </div>
      </div>
    );
  };

  // Sidebar always reflects exactly what the current category-products call returns.
  // Magento narrows filter options to match the active query + selected filters,
  // so the sidebar stays in sync with the result set automatically.
  const sidebarFilters: any[] = apiFilters ?? [];

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <>
      <Suspense fallback={null}><SearchParamsReader onParams={handleParams} /></Suspense>
      <div className="flex">
        {/* Desktop Sidebar — hidden for exact SKU lookup or when no products found */}
        {!itemCodeTerm && (loading || products.length > 0) && (
          <div className="hidden xl:flex flex-col flex-shrink-0 self-stretch bg-white border-r border-gray-200">
            <SidebarFilter
              onFilterChange={handleFilterChange}
              selectedFilters={selectedFilters}
              isCollapsed={isSidebarCollapsed}
              setIsCollapsed={setIsSidebarCollapsed}
              initialFilters={sidebarFilters}
            />
          </div>
        )}

        {/* Mobile Filter Drawer — not available for exact SKU lookup */}
        {!itemCodeTerm && (
          <Drawer isOpen={isMobileFilterOpen} onClose={() => setIsMobileFilterOpen(false)}>
            <div className="flex flex-col h-full">
              <div className="bg-primary px-5 py-4 flex items-center justify-between flex-shrink-0">
                <h2 className="text-body-lg font-semibold text-black uppercase tracking-tight">{t("m.filter-options")}</h2>
                {Object.keys(selectedFilters).length > 0 && (
                  <button onClick={() => { clearAllFilters(); setIsMobileFilterOpen(false); }} className="text-label font-semibold text-black/70 uppercase underline">{t("m.clear-all")}</button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="[&>aside]:!w-full [&>aside]:!h-auto [&>aside]:!static [&>aside]:!border-0 [&>aside]:!overflow-visible [&>aside>div]:!static [&>aside>div]:!h-auto [&>aside>div>div:first-child]:!hidden">
                  <SidebarFilter onFilterChange={(f, l) => { handleFilterChange(f, l); setIsMobileFilterOpen(false); }} selectedFilters={selectedFilters} isCollapsed={false} setIsCollapsed={() => { }} initialFilters={sidebarFilters} />
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 flex-shrink-0">
                <button onClick={() => setIsMobileFilterOpen(false)} className="w-full h-[44px] bg-black text-white font-semibold uppercase text-body-sm tracking-widest rounded-lg active:scale-95 cursor-pointer">
                  {t("m.apply-filters")}
                </button>
              </div>
            </div>
          </Drawer>
        )}




        <div className="flex-1 flex flex-col w-full">

          {/* ── MOBILE CONTROLS ── */}
          <div className="xl:hidden flex flex-col gap-2 mb-3">
            {storeName && (loading || products.length > 0) && (
              <div className="px-1 mb-1">
                <h1 className="text-body-lg font-bold text-black uppercase tracking-tight">{storeName}</h1>
              </div>
            )}
            {/* Controls: 2 cols for SKU lookup (no filters), 3 cols otherwise */}
            <div className={`grid ${itemCodeTerm ? "grid-cols-2" : "grid-cols-3"} gap-2`}>
              <button onClick={() => router.push(lp("/favorites"))} className="h-[44px] bg-white border border-gray-200 rounded-xl flex items-center justify-center gap-2 text-label font-semibold uppercase tracking-wider shadow-sm active:scale-95 cursor-pointer">
                <Star className="w-4 h-4 fill-black text-black" /> {t("m.favourite-products")}
              </button>
              <button onClick={() => setIsMobileSortOpen(true)} className="h-[44px] bg-white border border-gray-200 rounded-xl flex items-center justify-center gap-2 text-label font-semibold uppercase tracking-wider shadow-sm active:scale-95 cursor-pointer">
                <ChevronDown className="w-4 h-4" />
                {sortBy === "none" ? t("products.sortByDefault") : sortBy === "price-asc" ? t("products.sortByLowToHigh") : t("products.sortByHighToLow")}
              </button>
              {!itemCodeTerm && (
                <button onClick={() => setIsMobileFilterOpen(true)} className="h-[44px] bg-white border border-gray-200 rounded-xl flex items-center justify-center gap-2 text-label font-semibold uppercase tracking-wider shadow-sm active:scale-95 cursor-pointer">
                  <Filter className="w-4 h-4" /> Filter
                  {Object.keys(selectedFilters).length > 0 && <span className="w-5 h-5 bg-primary rounded-full text-caption font-semibold flex items-center justify-center">{Object.keys(selectedFilters).length}</span>}
                </button>
              )}
            </div>
            {/* Active filter chips — wrapped in a stable-height slot so the
                grid below doesn't jump when chips appear/disappear. */}
            <div className="min-h-[38px] flex items-center">
              {(Object.keys(selectedFilterLabels).length > 0 || searchByTerm || itemCodeTerm || isFavorite) && (
                <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar-hide py-1 w-full">
                  <span className="text-caption font-black text-black uppercase tracking-tight whitespace-nowrap px-1">
                    {t("products.yourSelections")} :
                  </span>
                  {searchByTerm && (
                    <div className="flex items-center gap-1.5 bg-blue-50 border border-primary/30 px-3 py-1 rounded-lg text-caption font-bold text-primary whitespace-nowrap flex-shrink-0">
                      {searchByTerm} <button onClick={clearSearchBy} className="text-red-500 ml-0.5"><X size={12} strokeWidth={3} /></button>
                    </div>
                  )}
                  {itemCodeTerm && (
                    <div className="flex items-center gap-1.5 bg-blue-50 border border-primary/30 px-3 py-1 rounded-lg text-caption font-bold text-primary whitespace-nowrap flex-shrink-0">
                      {itemCodeTerm} <button onClick={clearItemCode} className="text-red-500 ml-0.5"><X size={12} strokeWidth={3} /></button>
                    </div>
                  )}
                  {isFavorite && (
                    <div className="flex items-center gap-1.5 bg-blue-50 border border-primary/30 px-3 py-1 rounded-lg text-caption font-bold text-primary whitespace-nowrap flex-shrink-0">
                      {t("sidebar.favoriteProducts")} <button onClick={() => setIsFavorite(false)} className="text-red-500 ml-0.5"><X size={12} strokeWidth={3} /></button>
                    </div>
                  )}
                  {Object.entries(selectedFilterLabels).flatMap(([code, items]) => items.map((item) => (
                    <div key={`${code}-${item.value}`} className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg text-caption font-bold text-black/80 whitespace-nowrap flex-shrink-0">
                      {item.label} <button onClick={() => removeSpecificFilter(code, item.value)} className="text-black/50 ml-0.5"><X size={12} strokeWidth={3} /></button>
                    </div>
                  )))}
                  <button onClick={clearAllFilters} className="text-caption font-black text-red-500 uppercase whitespace-nowrap flex-shrink-0 px-2 underline decoration-2 underline-offset-2">{t("products.clearAll")}</button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Sort Bottom Sheet */}
          {isMobileSortOpen && (
            <div className="xl:hidden fixed inset-0 z-[100]">
              <div className="absolute inset-0 bg-black/40" onClick={() => setIsMobileSortOpen(false)} />
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h3 className="text-body-lg font-semibold uppercase tracking-tight">{t("products.sortByDefault")}</h3>
                  <button onClick={() => setIsMobileSortOpen(false)} className="p-1 text-black/50 hover:text-black"><X size={20} /></button>
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
                      className={`px-5 py-3.5 text-body font-semibold text-start flex items-center justify-between transition-colors ${sortBy === opt.value ? "bg-primary/10 text-black" : "text-black/80 hover:bg-gray-50"}`}
                    >
                      {opt.label}
                      {sortBy === opt.value && <Check size={18} className="text-primary" strokeWidth={3} />}
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
              <div className="flex-1 flex items-center justify-center py-10 px-4 col-span-full">
                <div className="bg-[#FFF9E7] border border-[#FFE7A3] text-[#856404] px-5 py-4 rounded-xl flex items-center gap-3 w-full shadow-sm">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-xs font-semibold uppercase tracking-wider">{t("products.noProducts")}</span>
                </div>
              </div>
            ) : sortedProducts.map((p, i) => renderProductCard(p, i))}
          </div>
          <div className="xl:hidden">{renderPagination(true)}</div>

          {/* ── DESKTOP CONTROLS + TABLE ── */}
          {/* For SKU lookup or empty results the sidebar is gone → full rounding; otherwise right-rounded only */}
          <div className={`hidden xl:flex flex-col bg-white shadow-sm border border-gray-200 overflow-hidden ${itemCodeTerm || (!loading && products.length === 0) ? "md:rounded-2xl" : "md:rounded-r-2xl border-l-0"}`}>
            {/* Desktop header */}
            {(loading || products.length > 0) && (
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center gap-4 min-h-[60px]">
                <div className="flex items-center gap-4">
                  <button onClick={() => router.push(lp("/favorites"))} className="bg-gray-50 border border-gray-200 text-black px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm text-xs font-semibold active:scale-95 cursor-pointer uppercase tracking-wider">
                    <Star className="w-5 h-5 fill-black text-black" /> {t("sidebar.favoriteProducts")}
                  </button>
                  <div className="flex flex-1 items-center gap-3 overflow-x-auto custom-scrollbar-hide max-w-[800px]">
                    {(searchByTerm || itemCodeTerm || isFavorite || Object.keys(selectedFilterLabels).length > 0) && (
                      <span className="text-body-sm font-black text-black uppercase tracking-tight whitespace-nowrap">
                        {t("products.yourSelections")} :
                      </span>
                    )}
                    {/* Search term tag */}
                    {searchByTerm && (
                      <div className="flex items-center gap-1.5 bg-blue-50 border border-primary/30 px-3.5 py-1.5 rounded-lg text-body-sm font-bold text-primary shadow-sm whitespace-nowrap flex-shrink-0">
                        {searchByTerm}
                        <button onClick={clearSearchBy} className="hover:text-red-600 ml-1 transition-colors"><X size={14} strokeWidth={3} /></button>
                      </div>
                    )}
                    {itemCodeTerm && (
                      <div className="flex items-center gap-1.5 bg-blue-50 border border-primary/30 px-3.5 py-1.5 rounded-lg text-body-sm font-bold text-primary shadow-sm whitespace-nowrap flex-shrink-0">
                        {itemCodeTerm}
                        <button onClick={clearItemCode} className="hover:text-red-600 ml-1 transition-colors"><X size={14} strokeWidth={3} /></button>
                      </div>
                    )}
                    {isFavorite && (
                      <div className="flex items-center gap-1.5 bg-blue-50 border border-primary/30 px-3.5 py-1.5 rounded-lg text-body-sm font-bold text-primary shadow-sm flex-shrink-0">
                        {t("sidebar.favoriteProducts")} <button onClick={() => setIsFavorite(false)} className="hover:text-red-600 ml-1 transition-colors"><X size={14} strokeWidth={3} /></button>
                      </div>
                    )}
                    {Object.entries(selectedFilterLabels).flatMap(([code, items]) => items.map((item) => (
                      <div key={`${code}-${item.value}`} className="flex items-center gap-1.5 bg-white border border-gray-200 px-4 py-1.5 rounded-lg text-body-sm font-bold text-black/80 shadow-sm whitespace-nowrap flex-shrink-0">
                        {item.label} <button onClick={() => removeSpecificFilter(code, item.value)} className="hover:text-red-500 text-black/50 ml-1 transition-colors"><X size={14} strokeWidth={3} /></button>
                      </div>
                    )))}
                  </div>
                  {(Object.keys(selectedFilters).length > 0 || searchByTerm || itemCodeTerm || isFavorite) && (
                    <button onClick={clearAllFilters} className="text-caption font-bold text-red-500 uppercase flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-lg flex-shrink-0 hover:bg-red-100 transition-colors">
                      <X size={12} strokeWidth={3} /> {t("products.clearAll")}
                    </button>
                  )}
                </div>
                <PortalDropdown
                  value={sortBy}
                  onChange={setSortBy}
                  options={[{ label: t("products.sortByDefault"), value: "none" }, { label: t("products.sortByLowToHigh"), value: "price-asc" }, { label: t("products.sortByHighToLow"), value: "price-desc" }]}
                  buttonClassName="bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 text-xs font-medium text-black cursor-pointer shadow-sm hover:border-gray-300 whitespace-nowrap"
                  minWidth={190}
                />
              </div>
            )}

            {/* Desktop table area */}
            <div className="flex-1 overflow-x-auto">
              <table className="w-full border-collapse table-fixed min-w-[700px]">
                <TableColGroup showAction={showActionColumn} />
                {(loading || products.length > 0) && (
                  <thead className="sticky top-0 z-20">
                    <tr className="bg-gray-50 border-b-2 border-gray-200">
                      {BASE_HEADER_KEYS.map(key => (
                        <th key={key} className="px-2 md:px-4 py-2 md:py-3 text-label font-semibold text-black uppercase tracking-widest text-center">{t(key)}</th>
                      ))}
                      {showActionColumn && (
                        <th className="px-2 md:px-4 py-2 md:py-3 text-label font-semibold text-black uppercase tracking-widest text-center">{t('m.action')}</th>
                      )}
                    </tr>
                  </thead>
                )}
                <tbody className="divide-y divide-gray-50">
                  {loading ? <ShimmerRows colCount={totalColumns} /> : products.length === 0 ? (
                    <tr>
                      <td colSpan={totalColumns} className="py-24 px-6">
                        <div className="bg-[#FFF9E7] border border-[#FFE7A3] text-[#856404] px-5 py-4 rounded-xl flex items-center gap-3 w-full shadow-sm max-w-2xl mx-auto">
                          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                          <span className="text-xs font-semibold uppercase tracking-wider">{t("products.noProducts")}</span>
                        </div>
                      </td>
                    </tr>
                  ) : sortedProducts.map((product, index) => {
                    // All display values are taken directly from the API response.
                    const showActions = product.is_action === "Yes";
                    const showOldPrice = product.show_old_price !== false && product.original_price > product.final_price;
                    const isOutOfStock = product.is_in_stock === false || product.stock_label === "Not Available";

                    let productPath = "#";
                    if (product.product_url) {
                      try { productPath = new URL(product.product_url).pathname; }
                      catch { productPath = product.product_url; }
                    }

                    return (
                      <tr key={index} className={`hover:bg-primary/5 transition-colors group ${ROW_HEIGHT}`}>
                        {/* Brand — direct from API */}
                        <td className="px-2 md:px-4 text-body-sm font-normal text-black/80 text-center">
                          {product.brand || "—"}
                        </td>

                        {/* Name + item_code — direct from API */}
                        <td className="px-2 md:px-4 text-center">
                          {/* <Link href={productPath} className="hover:text-primary transition-colors"> */}
                          <span className="text-body-sm font-normal text-black block leading-tight">{product.name || "—"}</span>
                          {/* {product.item_code && (
                              <span className="text-caption text-black/40 font-medium block mt-0.5">{product.item_code}</span>
                            )} */}
                          {/* </Link> */}
                        </td>

                        {/* Image — direct from API */}
                        <td className="px-2 md:px-4 text-center">
                          <div className="w-10 h-10 mx-auto">
                            {product.image_url ? (
                              <div className="relative w-10 h-10 group/img cursor-pointer" onClick={() => { setSelectedImage(product.image_url); setPreviewProduct(product); setIsImageModalOpen(true); }}>
                                <img src={product.image_url} alt={product.name} width={40} height={40} className="w-10 h-10 object-contain rounded border border-gray-100 shadow-sm" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-center justify-center rounded">
                                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-black font-semibold text-caption shadow-lg transform scale-50 group-hover/img:scale-100 transition-transform duration-300">+</div>
                                </div>
                              </div>
                            ) : <span className="text-caption text-black/40 font-semibold uppercase leading-[40px]">No Image</span>}
                          </div>
                        </td>

                        {/* Stock — stock_label + stock_color direct from API */}
                        <td className="px-2 md:px-4 text-center">{getStockBadge(product)}</td>

                        {/* Price — final_price + show_old_price + original_price direct from API */}
                        <td className="px-2 md:px-4 text-center whitespace-nowrap">
                          <div className="flex flex-col items-center justify-center">
                            {showOldPrice && (
                              <span className="text-caption font-semibold text-black/50 mb-0.5">
                                <Price amount={product.original_price} className="font-semibold line-through" />
                              </span>
                            )}
                            <span className="text-body-sm font-semibold text-black tracking-tight rubik-sans">
                              <Price amount={product.final_price} />
                            </span>
                          </div>
                        </td>

                        {/* Action TD — only in DOM when the column is visible */}
                        {showActionColumn && (
                          <td className="px-1 text-center align-middle">
                            {showActions && (
                              <div className="inline-grid grid-cols-3 gap-1 items-center">
                                {!isOutOfStock ? (
                                  <input
                                    type="text"
                                    value={productQtys[product.sku] || 1}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/\D/g, "");
                                      setProductQtys({ ...productQtys, [product.sku]: parseInt(val) || 0 });
                                    }}
                                    className="w-8 h-8 border-2 border-gray-100 rounded-md flex items-center justify-center text-label font-semibold text-black bg-white shadow-sm text-center outline-none focus:border-primary transition-colors"
                                    onFocus={(e) => { const t = e.target; setTimeout(() => t.select(), 0); }}
                                    onClick={(e) => (e.target as HTMLInputElement).select()}
                                    onKeyDown={(e) => { if (e.key === "Enter") handleAddToCart(product); }}
                                  />
                                ) : <div className="w-8 h-8" />}

                                {!isOutOfStock ? (
                                  <button onClick={() => handleAddToCart(product)} disabled={addingToCart === product.sku} className={`w-8 h-8 rounded-md flex items-center justify-center shadow-md hover:-translate-y-0.5 transition-all cursor-pointer ${justAdded === product.sku ? "bg-green-500 text-white" : "bg-primary text-black"}`}>
                                    {addingToCart === product.sku
                                      ? <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                      : justAdded === product.sku
                                        ? <Check size={15} strokeWidth={3} />
                                        : <ShoppingCart size={15} strokeWidth={2.5} />}
                                  </button>
                                ) : (
                                  <button onClick={() => { setInquiryProduct(product); setIsInquiryModalOpen(true); }} className="w-8 h-8 bg-primary text-black rounded-md flex items-center justify-center shadow-md active:scale-95 cursor-pointer">
                                    <Info size={15} strokeWidth={2.5} />
                                  </button>
                                )}

                                <button onClick={() => toggleFavorite(product)} className={`w-8 h-8 rounded-md flex items-center justify-center shadow-md active:scale-95 cursor-pointer ${favIds.includes(product.product_id) ? "bg-primary text-black" : "bg-white text-black/50 border border-gray-100 hover:border-primary"}`}>
                                  <Star size={15} fill={favIds.includes(product.product_id) ? "currentColor" : "none"} strokeWidth={2.5} />
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {renderPagination()}
          </div>
        </div>



      </div>
      <ProductDialog product={selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} />
      <ProductEnquiryModal isOpen={isInquiryModalOpen} productSku={inquiryProduct?.sku || ""} productName={inquiryProduct?.name || ""} productPrice={inquiryProduct?.final_price || 0} onClose={() => { setIsInquiryModalOpen(false); setInquiryProduct(null); }} />
      <AddToCartPopup isOpen={isAddedPopupOpen} product={addedProduct} onClose={() => { setIsAddedPopupOpen(false); setAddedProduct(null); }} />
      <Drawer isOpen={isImageModalOpen && !!selectedImage} onClose={() => setIsImageModalOpen(false)}>
        <div className="flex flex-col h-full bg-white">
          <div className="bg-primary px-4 md:px-8 py-4 md:py-6 flex items-center justify-center flex-shrink-0">
            <h2 className="text-body-lg md:text-[17px] font-semibold text-black text-center uppercase tracking-tight">
              {previewProduct ? previewProduct?.name || t("m.preview") : t("m.preview")}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center justify-center">
            <div className="bg-white flex items-center justify-center min-h-[200px] md:min-h-[400px] w-full">
              <img src={selectedImage} alt={previewProduct ? previewProduct?.name || t("m.preview") : t("m.preview")} className="max-w-full max-h-[60vh] md:max-h-[75vh] object-contain rounded-lg" />
            </div>
            <button onClick={() => setIsImageModalOpen(false)} className="mt-6 w-full py-3 md:py-4 bg-black text-white font-semibold uppercase tracking-widest rounded shadow-xl hover:bg-gray-800 text-sm cursor-pointer active:scale-95">{t("m.close")}</button>
          </div>
        </div>
      </Drawer>
    </>
  );
}
