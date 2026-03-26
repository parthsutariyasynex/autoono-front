"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { ShoppingCart, X, Star, ChevronLeft, ChevronRight, AlertTriangle, Info, Check } from "lucide-react";
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

import { toast } from "react-hot-toast";

const PAGE_SIZE = 20;

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  // Image Modal State
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [inquiryProduct, setInquiryProduct] = useState<any | null>(null);
  const [previewProduct, setPreviewProduct] = useState<any | null>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favIds, setFavIds] = useState<number[]>([]);

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem("favourites");
    if (stored) setFavIds(JSON.parse(stored));

    // Handle initial filters from URL params (Magento format: key[0]=val)
    if (searchParams) {
      const { filters, page, sortBy } = parseMagentoQueryParams(searchParams);
      if (Object.keys(filters).length > 0) {
        setSelectedFilters(filters);
      }
      setCurrentPage(page);
      setSortBy(sortBy);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isMounted) return;

    const newUrlParams = formatMagentoQueryParams(selectedFilters, currentPage, sortBy);
    const currentUrlParams = searchParams.toString();

    // Only update if the meaningful params have changed
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
          toast.success("Added to favorites", { id: toastId });
        } catch (err) {
          console.error("API favorite add error:", err);
          toast.error("Could not sync favorites", { id: toastId });
        }
      }
    }

    router.push("/favorites");
  };

  const [debouncedFilters, setDebouncedFilters] = useState(selectedFilters);

  // Debounce filters
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(selectedFilters);
    }, 500); // 500ms delay

    return () => clearTimeout(handler);
  }, [selectedFilters]);

  /* ── Load Products ── */
  useEffect(() => {
    const abortController = new AbortController();

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");

        // Get token from localStorage (set by ProtectedLayout on auth)
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

        if (!token) {
          redirectToLogin(router);
          return;
        }

        const headers: HeadersInit = { "Content-Type": "application/json" };
        headers["Authorization"] = `Bearer ${token}`;

        const queryString = formatMagentoQueryParams(debouncedFilters, currentPage, sortBy);
        // Ensure categoryId and pageSize are also in the query string
        const finalQueryString = `${queryString}&categoryId=5&pageSize=${PAGE_SIZE}`;

        const url = `/api/category-products?${finalQueryString}`;
        const res = await fetch(url, { headers, signal: abortController.signal });

        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem("token");
            redirectToLogin(router);
            return;
          }

          let errorInfo = `API Error: ${res.status}`;
          try {
            // Clone the response to avoid "body stream already read" if json() fails
            const resCopy = res.clone();
            try {
              const errorData = await resCopy.json();
              errorInfo += ` - ${JSON.stringify(errorData)}`;
              console.error("Direct API failure body:", errorData);
            } catch {
              const text = await res.text();
              errorInfo += ` - ${text}`;
              console.error("Direct API failure text:", text);
            }
          } catch (e) {
            console.error("Critical error in error handling:", e);
          }
          throw new Error(errorInfo);
        }

        const data = await res.json();
        const productArray = Array.isArray(data.products) ? data.products : (Array.isArray(data.items) ? data.items : []);
        const total = typeof data.total_count === "number" ? data.total_count : productArray.length;

        if (abortController.signal.aborted) return;
        setProducts(productArray);
        setTotalCount(total);
        if (data.filters) setApiFilters(data.filters);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError("Unable to load products. Please try again.");
        console.error(err);
      } finally {
        if (!abortController.signal.aborted) setLoading(false);
      }
    };

    loadProducts();
    return () => abortController.abort();
  }, [router, currentPage, debouncedFilters]);

  const handleFilterChange = useCallback(
    (filters: Record<string, string[]>, labels: Record<string, { value: string; label: string }[]>) => {
      setSelectedFilters(filters);
      setSelectedFilterLabels(labels);
      setCurrentPage(1);
    },
    [],
  );

  const clearAllFilters = () => {
    setSelectedFilters({});
    setSelectedFilterLabels({});
    setCurrentPage(1);
  };

  /* ── Add To Cart ── */
  const handleAddToCart = async (sku: string) => {
    try {
      setAddingToCart(sku);
      await addToCart(sku, 1);
      toast.success("Product added to cart!");
      setJustAdded(sku);
      setTimeout(() => setJustAdded(null), 2000); // Reset icon after 2s
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "401") {
        localStorage.removeItem("token");
        router.replace("/login");
      } else {
        toast.error("Failed to add to cart");
      }
    } finally {
      setAddingToCart(null);
    }
  };

  /* ── Stock Badge (Dynamic Design) ── */
  const getStockBadge = (product: any) => {
    const baseStyle = "flex flex-col items-center justify-center text-center gap-1";
    const dotStyle = "w-4 h-4 rounded-full border border-gray-100 shadow-sm";

    // Use dynamic data from API
    const label = product?.stock_label || (product?.is_in_stock ? "Available" : "Not Available");
    const apiColor = product?.stock_color?.toLowerCase() || (product?.is_in_stock ? "green" : "red");

    const colorMap: Record<string, string> = {
      green: "bg-green-500",
      red: "bg-red-500",
      yellow: "bg-yellow-400",
    };

    const colorClass = colorMap[apiColor] || "bg-gray-400";

    return (
      <div className={baseStyle}>
        <span className={`${dotStyle} ${colorClass}`}></span>
        <span className="text-[10px] font-black text-gray-700 uppercase leading-none">{label}</span>
      </div>
    );
  };

  const sortedProducts = useMemo(() => {
    let result = [...products];

    if (isFavorite) {
      result = result.filter(p => favIds.includes(p.product_id));
    }

    // Client-side filtering for "offers" group (backend doesn't support this code natively)
    const selectedOffers = selectedFilters["offers"];
    if (selectedOffers && selectedOffers.length > 0) {
      result = result.filter(p => p?.offer && selectedOffers.some((o: string) => o === p.offer));
    }

    // Client-side tyre size filtering
    // Magento REST API does NOT filter by width/height/rim — only the live frontend does.
    // We parse tyre_size (e.g. "195/65 R15") and filter locally to match live site behavior.
    const sw = selectedFilters["width"]?.[0];
    const sh = selectedFilters["height"]?.[0];
    const sr = selectedFilters["rim"]?.[0];
    if (sw || sh || sr) {
      result = result.filter(p => {
        const size = String(p?.tyre_size || "").trim();
        if (!size) return false;
        // Parse: "195/65 R15" or "195 R15" or "315/80 R22.5"
        const m = size.match(/^(\d+)\/?(\d+)?\s*R?\s*(\d+\.?\d*)?/i);
        if (!m) return false;
        if (sw && m[1] !== sw) return false;
        if (sh && m[2] !== sh) return false;
        if (sr && m[3] !== sr) return false;
        return true;
      });
    }

    // Sorting — other filtering is handled by the API
    if (sortBy === "price-asc") return result.sort((a, b) => (a.final_price ?? 0) - (b.final_price ?? 0));
    if (sortBy === "price-desc") return result.sort((a, b) => (b.final_price ?? 0) - (a.final_price ?? 0));
    return result;
  }, [products, sortBy, isFavorite, favIds, selectedFilters]);

  const showActionColumn = useMemo(() => products.some(p => p.is_action === "Yes"), [products]);
  // Always use 11 columns to keep header/shimmer width constant and avoid horizontal shifts
  const totalColumns = 11;

  // Use filtered count when tyre size search is active
  const hasSizeFilter = selectedFilters["width"] || selectedFilters["height"] || selectedFilters["rim"];
  const displayCount = hasSizeFilter ? sortedProducts.length : totalCount;
  const totalPages = Math.ceil(displayCount / PAGE_SIZE);

  if (!isMounted) return null;

  const handleHorizontalSearch = (width: string, height: string, rim: string) => {
    const newFilters = { ...selectedFilters };
    if (width) newFilters["width"] = [width]; else delete newFilters["width"];
    if (height) newFilters["height"] = [height]; else delete newFilters["height"];
    if (rim) newFilters["rim"] = [rim]; else delete newFilters["rim"];

    setSelectedFilters(newFilters);
    setCurrentPage(1);
  };

  return (
    <>
      <div className="flex flex-1">
        <SidebarFilter
          onFilterChange={handleFilterChange}
          selectedFilters={selectedFilters}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          initialFilters={apiFilters}
        />

        <div className="flex-1 flex flex-col p-4 md:p-6 pb-28">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">

            {/* Header Controls */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center gap-4 flex-shrink-0">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push("/favorites")}
                  className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 outline-none cursor-pointer focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all flex items-center gap-2 shadow-sm"
                >
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  Favorite products
                </button>
                {Object.keys(selectedFilters).length > 0 && (
                  <button onClick={clearAllFilters} className="text-[10px] font-black text-red-500 hover:text-red-700 uppercase flex items-center gap-1.5 bg-red-50 px-2.5 py-1 rounded-full transition-colors">
                    <X size={12} strokeWidth={3} /> Clear Filters
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <select
                  className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 outline-none cursor-pointer focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all shadow-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="none">Sort By</option>
                  <option value="price-asc">Price: Low-High</option>
                  <option value="price-desc">Price: High-Low</option>
                </select>
              </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full border-separate border-spacing-0">
                <thead className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-[11px] font-bold text-black uppercase tracking-wider text-center border-b border-gray-100">Brand</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-black uppercase tracking-wider text-center border-b border-gray-100">Size</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-black uppercase tracking-wider text-center border-b border-gray-100">Pattern</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-black uppercase tracking-wider text-center border-b border-gray-100">Year</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-black uppercase tracking-wider text-center border-b border-gray-100">Origin</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-black uppercase tracking-wider text-center border-b border-gray-100">Image</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-black uppercase tracking-wider text-center border-b border-gray-100">Offer</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-black uppercase tracking-wider text-center border-b border-gray-100">Stock</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-black uppercase tracking-wider text-center border-b border-gray-100">Price</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-black uppercase tracking-wider text-center border-b border-gray-100 min-w-[120px]">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <tr key={`shimmer-${i}`} className="animate-pulse">
                        {Array.from({ length: totalColumns }).map((_, j) => (
                          <td key={`cell-${j}`} className="px-5 py-6">
                            <div className="h-3 bg-gray-100 rounded w-full"></div>
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={totalColumns} className="py-24 text-center">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">No products matched your search</p>
                      </td>
                    </tr>
                  ) : (
                    sortedProducts.map((product, index) => {
                      const brandName = product?.brand || (product?.name ? product.name.split(' ')[0] : "N/A");
                      const isOutOfStock = product.stock_status === "Not Available" || Number(product?.stock_qty ?? 0) <= 0;

                      return (
                        <tr key={index} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-5 py-3 text-[13px] font-normal text-gray-700 text-center">{brandName}</td>
                          <td className="px-5 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-[13px] font-medium text-gray-900 tracking-tight">{product?.tyre_size}</span>
                              <div
                                onClick={() => setSelectedProduct(product)}
                                className="w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center text-[9px] font-bold text-white cursor-pointer hover:bg-yellow-400 hover:text-black transition-all shadow-sm"
                              >
                                i
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3 text-[13px] font-normal text-gray-600 text-center">{product?.pattern || "—"}</td>
                          <td className="px-5 py-3 text-[13px] font-normal text-gray-500 text-center font-mono">{product?.year || "—"}</td>
                          <td className="px-5 py-3 text-[13px] font-normal text-gray-600 text-center">{product?.origin || "—"}</td>
                          <td className="px-5 py-3 text-center">
                            {product?.image_url ? (
                              <div
                                className="relative inline-block group/img cursor-pointer"
                                onClick={() => {
                                  setSelectedImage(product.image_url);
                                  setPreviewProduct(product);
                                  setIsImageModalOpen(true);
                                }}
                              >
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-10 h-10 object-contain mx-auto rounded border border-gray-100 shadow-sm transition-all duration-300"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-center justify-center rounded">
                                  <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-black font-bold text-[10px] shadow-lg transform scale-50 group-hover/img:scale-100 transition-transform duration-300">+</div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-300 font-black uppercase">No Image</span>
                            )}
                          </td>
                          <td className="px-5 py-5 text-center">
                            {product.offer ? (
                              <span className="text-red-600 font-bold text-[10px] leading-tight uppercase tracking-tight block max-w-[150px] mx-auto">
                                {product.offer}
                              </span>
                            ) : (
                              <span className="text-gray-200">—</span>
                            )}
                          </td>
                          <td className="px-5 py-5 text-center">
                            {getStockBadge(product)}
                          </td>
                          <td className="px-5 py-3 text-center whitespace-nowrap">
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-bold text-gray-900 tracking-tight price currency-riyal">

                                <Price amount={product?.final_price || 0} />

                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-5 text-center min-w-[120px]">
                            <div className="flex flex-col items-center gap-2">
                              {/* Action Row: [Qty/Spacer] [Add to Cart/Inquiry] [Favourite] */}
                              <div className="grid grid-cols-3 gap-1.5">
                                {!isOutOfStock ? (
                                  <div className="w-9 h-9 border-2 border-gray-100 rounded-lg flex items-center justify-center text-xs font-black text-gray-900 bg-white shadow-sm">
                                    1
                                  </div>
                                ) : (
                                  <div className="w-9 h-9" />
                                )}

                                {!isOutOfStock ? (
                                  <button
                                    onClick={() => handleAddToCart(product.sku)}
                                    disabled={addingToCart === product.sku}
                                    className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-md hover:-translate-y-0.5 transition-all ${justAdded === product.sku ? "bg-green-500 text-white" : "bg-yellow-400 text-black hover:bg-yellow-500"}`}
                                    title={justAdded === product.sku ? "Added!" : "Add to Cart"}
                                  >
                                    {addingToCart === product.sku ? (
                                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                    ) : justAdded === product.sku ? (
                                      <Check size={16} strokeWidth={3} />
                                    ) : (
                                      <ShoppingCart size={16} strokeWidth={2.5} />
                                    )}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => { setInquiryProduct(product); setIsInquiryModalOpen(true); }}
                                    className="w-9 h-9 bg-yellow-400 text-black rounded-lg flex items-center justify-center shadow-md hover:bg-yellow-500 hover:-translate-y-0.5 transition-all"
                                    title="Make Inquiry"
                                  >
                                    <Info size={16} strokeWidth={2.5} />
                                  </button>
                                )}

                                <button
                                  onClick={() => toggleFavorite(product)}
                                  className="w-9 h-9 rounded-lg flex items-center justify-center shadow-md hover:-translate-y-0.5 transition-all bg-yellow-400 text-black hover:bg-yellow-500"
                                  title={favIds.includes(product.product_id) ? "Remove from Favourites" : "Add to Favourites"}
                                >
                                  <Star size={16} strokeWidth={2.5} fill={favIds.includes(product.product_id) ? "currentColor" : "none"} />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {!loading && displayCount > 0 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30 flex-shrink-0">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Found <span className="text-gray-900">{displayCount}</span> Products
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-9 h-9 rounded-xl text-xs font-black transition-all shadow-sm ${currentPage === i + 1 ? "bg-yellow-400 text-gray-900" : "bg-white text-gray-400 hover:text-gray-900 border border-transparent hover:border-gray-200"}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* STICKY BOTTOM SIZE SEARCH BAR - ENHANCED WITH LOGO */}
        <div className={`fixed bottom-0 left-0 right-0 z-[40] transition-all bg-white border-t-[4px] border-[#f5a623] shadow-[0_-10px_30px_rgba(0,0,0,0.12)] py-1.5`}>
          <div className={`transition-all duration-300 ${isSidebarCollapsed ? "pl-[50px]" : "pl-[300px]"}`}>
            {/* Search Content */}
            <div className="flex-1">
              <HorizontalFilter
                onSearch={handleHorizontalSearch}
                initialValues={{
                  width: debouncedFilters["width"]?.[0] || "",
                  height: debouncedFilters["height"]?.[0] || "",
                  rim: debouncedFilters["rim"]?.[0] || ""
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProductDialog
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
      <ProductEnquiryModal
        isOpen={isInquiryModalOpen}
        productSku={inquiryProduct?.sku || ""}
        productName={inquiryProduct?.name || ""}
        productPrice={inquiryProduct?.final_price || 0}
        onClose={() => {
          setIsInquiryModalOpen(false);
          setInquiryProduct(null);
        }}
      />

      {/* Product Image Preview - Side Drawer */}
      <Drawer
        isOpen={isImageModalOpen && !!selectedImage}
        onClose={() => setIsImageModalOpen(false)}
      >
        <div className="flex flex-col h-full bg-white">
          {/* Header */}
          <div className="bg-[#FFB82B] px-8 py-6 flex items-center justify-center relative flex-shrink-0">
            <h2 className="text-[17px] font-black text-black text-center uppercase tracking-tight">
              {previewProduct ? `${previewProduct?.pattern || '-'} - ${previewProduct?.tyre_size || '-'}` : "Product Preview"}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center">
            {/* Image Container */}
            <div className="p-4 bg-white flex items-center justify-center min-h-[400px] w-full">
              <img
                src={selectedImage}
                alt={previewProduct ? `${previewProduct?.pattern} - ${previewProduct?.tyre_size}` : "Product Preview"}
                className="max-w-full max-h-[75vh] object-contain rounded-lg transition-transform duration-500 hover:scale-[1.02]"
              />
            </div>

            {/* Footer Section */}
            <div className="mt-10 w-full flex flex-col items-center gap-4">
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="w-full py-4.5 bg-black text-white font-black uppercase tracking-widest rounded shadow-xl hover:bg-gray-800 transition-all text-sm cursor-pointer active:scale-95"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      </Drawer>


    </>
  );
}
