"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Navbar from "../components/Navbar";
import { ShoppingCart, X, Star, ChevronLeft, ChevronRight, AlertTriangle, Info, Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductDialog from "../components/ProductDialog";
import ProductEnquiryModal from "../components/ProductEnquiryModal";
import { checkAuth } from "./api";
import { useCart } from "@/modules/cart/hooks/useCart";
import SidebarFilter from "../components/SidebarFilter";
import { api } from "@/lib/api/api-client";
import { formatPrice } from "@/utils/helpers";
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

  // Image Modal State
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [inquiryProduct, setInquiryProduct] = useState<any | null>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favIds, setFavIds] = useState<number[]>([]);

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem("favourites");
    if (stored) setFavIds(JSON.parse(stored));
  }, []);

  const toggleFavorite = async (product: any) => {
    const { product_id: productId, sku } = product;
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

    router.push("/my-account/favourite-products");
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
    if (!checkAuth(router)) return;

    const abortController = new AbortController();

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const params = new URLSearchParams();
        params.append("categoryId", "5");
        params.append("page", String(currentPage));
        params.append("pageSize", String(PAGE_SIZE));

        Object.entries(debouncedFilters).forEach(([code, values]) => {
          if (values.length > 0) {
            params.append(code, values.join(","));
          }
        });

        const url = `/api/category-products?${params.toString()}`;
        const res = await fetch(url, { headers, signal: abortController.signal });

        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem("token");
            router.replace("/login");
            return;
          }
          throw new Error(`API Error: ${res.status}`);
        }

        const data = await res.json();
        const productArray = Array.isArray(data.products) ? data.products : (Array.isArray(data.items) ? data.items : []);
        const total = typeof data.total_count === "number" ? data.total_count : productArray.length;

        if (abortController.signal.aborted) return;
        setProducts(productArray);
        setTotalCount(total);
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

    // Requirement: If "Promotions and Offers" filter is active, only show products with offers
    // We check for filter keys that likely correspond to Promotions/Offers
    const hasOfferFilter = Object.keys(selectedFilters).some(key =>
      key.toLowerCase().includes('offer') || key.toLowerCase().includes('promotion') || key.toLowerCase().includes('pormotion')
    );

    if (hasOfferFilter) {
      result = result.filter(p => p.offer && p.offer !== "");
    }

    if (sortBy === "price-asc") return result.sort((a, b) => (a.final_price ?? 0) - (b.final_price ?? 0));
    if (sortBy === "price-desc") return result.sort((a, b) => (b.final_price ?? 0) - (a.final_price ?? 0));
    return result;
  }, [products, sortBy, isFavorite, favIds, selectedFilters]);

  const showActionColumn = useMemo(() => products.some(p => p.is_action === "Yes"), [products]);
  const totalColumns = 10 + (showActionColumn ? 1 : 0);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  if (!isMounted) return null;

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden font-sans">
      <div className="flex-shrink-0">
        <Navbar />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <SidebarFilter
          onFilterChange={handleFilterChange}
          selectedFilters={selectedFilters}
        />

        <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">

            {/* Header Controls */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center gap-4 flex-shrink-0">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push("/my-account/favourite-products")}
                  className="text-xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2 hover:opacity-80 transition-all"
                >
                  <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                  Favourite products
                </button>
                {Object.keys(selectedFilters).length > 0 && (
                  <button onClick={clearAllFilters} className="text-[10px] font-black text-red-500 hover:text-red-700 uppercase flex items-center gap-1.5 bg-red-50 px-2.5 py-1 rounded-full transition-colors">
                    <X size={12} strokeWidth={3} /> Clear Filters
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sort By</span>
                <select
                  className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 text-xs font-black text-gray-800 outline-none cursor-pointer focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all shadow-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="none">Default</option>
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
                    <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center border-b border-gray-100">Brand</th>
                    <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center border-b border-gray-100">Size</th>
                    <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center border-b border-gray-100">Item Code</th>
                    <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center border-b border-gray-100">Pattern</th>
                    <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center border-b border-gray-100">Year</th>
                    <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center border-b border-gray-100">Origin</th>
                    <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center border-b border-gray-100">Image</th>
                    <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center border-b border-gray-100">Offer</th>
                    <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center border-b border-gray-100">Stock</th>
                    <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center border-b border-gray-100">Price</th>
                    {showActionColumn && (
                      <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center border-b border-gray-100">Action</th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <tr key={`shimmer-${i}`} className="animate-pulse">
                        {Array.from({ length: totalColumns }).map((_, j) => (
                          <td key={`cell-${j}`} className="px-5 py-6"><div className="h-3 bg-gray-100 rounded w-full"></div></td>
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
                      const brandName = product?.name ? product.name.split(' ')[0] : "N/A";
                      const isOutOfStock = product.stock_status === "Not Available" || Number(product?.stock_qty ?? 0) <= 0;

                      return (
                        <tr key={index} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-5 py-5 text-sm font-black text-gray-900 text-center">{brandName}</td>
                          <td className="px-5 py-5 text-center">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-sm font-black text-gray-800 tracking-tight">{product?.tyre_size}</span>
                              <div
                                onClick={() => setSelectedProduct(product)}
                                className="w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center text-[9px] font-black text-white cursor-pointer hover:bg-yellow-400 hover:text-black transition-all shadow-sm"
                              >
                                i
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-5 text-center">
                            <div className="flex items-center justify-end gap-1.5 translate-x-3">
                              <span className="text-sm font-black text-gray-800 tracking-tight">{product?.item_code || "—"}</span>
                            </div>
                          </td>
                          <td className="px-5 py-5 text-sm font-bold text-gray-600 text-center">{product?.pattern || "—"}</td>
                          <td className="px-5 py-5 text-sm font-black text-gray-500 text-center font-mono">{product?.year || "—"}</td>
                          <td className="px-5 py-5 text-sm font-bold text-gray-600 text-center">{product?.origin || "—"}</td>
                          <td className="px-5 py-5 text-center">
                            {product?.image_url ? (
                              <div
                                className="relative inline-block group/img cursor-pointer"
                                onClick={() => { setSelectedImage(product.image_url); setIsImageModalOpen(true); }}
                              >
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-12 h-12 object-contain mx-auto rounded-lg border border-gray-100 shadow-sm transition-all duration-300"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-center justify-center rounded-lg">
                                  <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-black font-black text-sm shadow-lg transform scale-50 group-hover/img:scale-100 transition-transform duration-300">+</div>
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
                          <td className="px-5 py-5 text-center whitespace-nowrap">
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Price</span>
                              <div className="flex items-baseline gap-1">
                                <span className="text-sm font-black text-gray-400">﷼</span>
                                <span className="text-base font-black text-gray-900 tracking-tighter">
                                  {formatPrice(product?.final_price || 0).replace(/[^\d.,]/g, '')}
                                </span>
                              </div>
                            </div>
                          </td>
                          {showActionColumn && (
                            <td className="px-5 py-5 text-center">
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
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {!loading && totalCount > 0 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30 flex-shrink-0">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Found <span className="text-gray-900">{totalCount}</span> Products
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
      </div>

      {/* Modals */}
      <ProductDialog product={selectedProduct} onClose={() => setSelectedProduct(null)} />
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

      {isImageModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={() => setIsImageModalOpen(false)}>
          <div className="relative max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 ease-out" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-[#f4b400] px-6 py-4 flex items-center justify-between border-b border-yellow-500/20">
              <h3 className="text-[11px] font-black text-black uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
                Product Preview
              </h3>
              <button
                className="w-8 h-8 bg-white/20 hover:bg-white/40 text-black rounded-lg flex items-center justify-center transition-all"
                onClick={() => setIsImageModalOpen(false)}
              >
                <X size={18} strokeWidth={3} />
              </button>
            </div>

            {/* Image Container */}
            <div className="p-8 bg-white flex items-center justify-center min-h-[400px]">
              <img
                src={selectedImage}
                alt="Product Preview"
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm"
              />
            </div>

            {/* Footer Tip */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-center">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Click outside or press X to close</p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
        .scale-in { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
