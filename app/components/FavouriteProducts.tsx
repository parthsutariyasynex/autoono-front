"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, X, Info, Star, Trash2 } from "lucide-react";
import { formatPrice, redirectToLogin } from "@/utils/helpers";
import { toast } from "react-hot-toast";
import ProductEnquiryModal from "./ProductEnquiryModal";
import ProductDialog from "./ProductDialog";
import Drawer from "./Drawer";
import Modal from "./Modal";
import Price from "./Price";

import { api } from "@/lib/api/api-client";
import Pagination from "@/components/Pagination";
import { useCart } from "@/modules/cart/context/CartContext";
import { useSession } from "next-auth/react";
import PortalDropdown from "@/components/PortalDropdown";

interface Product {
    product_id: number;
    name: string;
    sku: string;
    tyre_size: string;
    pattern: string;
    year: string;
    origin: string;
    image_url: string;
    stock_qty: number;
    stock_status: string;
    price?: number;
    final_price: number;
    offer?: string;
    brand?: string;
    favorite_id?: number | string;
}

const TABLE_HEADERS = ['Brand', 'Size', 'Pattern', 'Year', 'Origin', 'Image', 'Offer', 'Stock', 'Price', 'Action'] as const;
const COL_WIDTHS = ['8%', '13%', '13%', '6%', '7%', '7%', '9%', '9%', '10%', '115px'] as const;
const ROW_HEIGHT = 'h-auto md:h-[52px]';

function TableColGroup() {
    return (
        <colgroup>
            {COL_WIDTHS.map((w, i) => <col key={i} style={{ width: w }} />)}
        </colgroup>
    );
}

export default function FavouriteProducts() {
    const router = useRouter();
    const { data: session } = useSession();
    const { refetchCart } = useCart();

    const [favProducts, setFavProducts] = useState<Product[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [addingToCart, setAddingToCart] = useState<string | null>(null);
    const [quantities, setQuantities] = useState<Record<number, number>>({});
    const [removing, setRemoving] = useState<number | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
    const [inquiryProduct, setInquiryProduct] = useState<Product | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

    const loadFavourites = useCallback(async () => {
        setLoading(true);
        try {
            // Using centralized api client which handles tokens and sessions
            const data = await api.get(`/kleverapi/favorite-products?currentPage=${currentPage}&pageSize=${pageSize}`);

            // Handle different API response formats
            const rawItems = Array.isArray(data.products) ? data.products : (Array.isArray(data.items) ? data.items : []);

            // Map items with all fields needed for ProductDialog popup
            const items = rawItems.map((p: any) => {
                const finalPrice = Number(p.final_price || p.special_price || p.price || 0);
                // In Magento, 'price' is often the original/old price if 'final_price' is different
                const potentialOldPrice = Number(p.price || p.regular_price || p.original_price || p.old_price || 0);

                // Only show as old price if it's strictly greater than the final price
                const originalPrice = potentialOldPrice > finalPrice ? potentialOldPrice : 0;
                const hasDiscount = originalPrice > finalPrice;
                const offerLabel = p.offer || p.discount_label || "";

                return {
                    ...p,
                    product_id: p.product_id || p.id,
                    name: p.name || p.sku || "N/A",
                    image_url: p.image_url || p.image || "/placeholder-tyre.png",
                    final_price: finalPrice,
                    original_price: originalPrice,
                    offer: offerLabel,
                    stock_qty: Number(p.stock_qty || 0),
                    brand: p.brand || (p.name ? p.name.split(' ')[0] : "—"),
                    tyre_size: p.tyre_size || "—",
                    favorite_id: p.favorite_id || p.id,
                    item_code: p.item_code || p.sku,
                    product_group: p.product_group || "",
                    tyre_type: p.tyre_type || "",
                    oem_marking: p.oem_marking || "",
                };
            });

            const total = typeof data.total_count === "number" ? data.total_count : items.length;

            setFavProducts(items);
            setTotalCount(total);

            const initialQtys: Record<number, number> = {};
            items.forEach((p: Product) => {
                initialQtys[p.product_id] = 1;
            });
            setQuantities(prev => ({ ...prev, ...initialQtys }));
        } catch (err) {
            console.error("Failed to load favourites", err);
            // Don't show toast error if it's just empty or loading
            if (err !== "Unauthorized" && err !== "Something went wrong") {
                toast.error("Error loading products");
            }
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize]);

    useEffect(() => {
        // Trigger load even if session is loading/null (it will check localStorage fallback)
        loadFavourites();
    }, [loadFavourites]);

    // Scroll and Layout shift is now managed internally by the Modal/Drawer component

    const handleQtyChange = (productId: number, val: string) => {
        const num = parseInt(val) || 1;
        setQuantities(prev => ({ ...prev, [productId]: Math.max(1, num) }));
    };

    const handleRemove = async (product: Product) => {
        setRemoving(product.product_id);
        const toastId = toast.loading("Removing product...");
        try {
            // Updating local storage to maintain consistency with other components
            const stored = localStorage.getItem("favourites");
            const favIds: number[] = stored ? JSON.parse(stored) : [];
            const updated = favIds.filter(id => id !== product.product_id);
            localStorage.setItem("favourites", JSON.stringify(updated));

            // Proper API call to remove using the unique favorite item ID
            const deleteId = product.favorite_id || product.product_id;
            await api.delete(`/kleverapi/favorite-products/${deleteId}`);

            setFavProducts(prev => prev.filter(p => p.product_id !== product.product_id));
            setTotalCount(prev => Math.max(0, prev - 1));
            toast.success("Product removed", { id: toastId });
        } catch (err) {
            toast.error("Failed to remove", { id: toastId });
        } finally {
            setRemoving(null);
        }
    };

    const onAddToCart = async (product: Product) => {
        const qty = quantities[product.product_id] || 1;
        setAddingToCart(product.sku);
        const toastId = toast.loading("Adding to cart...");
        try {
            await api.post("/kleverapi/cart/add", { sku: product.sku, qty });
            await refetchCart();
            toast.success(`${product.name.substring(0, 15)}... added!`, { id: toastId });
        } catch (err) {
            if (err === "Unauthorized") {
                redirectToLogin(router);
            }
            toast.error("Failed to add to cart", { id: toastId });
        } finally {
            setAddingToCart(null);
        }
    };

    // Fetch full product details for the popup (to get item_code, product_group, tyre_type, oem_marking)
    const handleShowProductDetail = async (product: Product) => {
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            const fetchLocale = typeof window !== "undefined" && window.location.pathname.startsWith("/ar") ? "ar" : "en";
            const headers: HeadersInit = { "Content-Type": "application/json", "x-locale": fetchLocale };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            // Extract item code from SKU (remove year suffix e.g. "PSR02347-2025" → "PSR02347")
            const itemCode = product.sku?.replace(/-\d{4}$/, "") || product.sku;

            const res = await fetch(`/api/category-products?categoryId=5&page=1&pageSize=5&itemCode=${itemCode}`, { headers });
            if (res.ok) {
                const data = await res.json();
                const items = data.products || data.items || [];
                // Find exact match by SKU
                const match = items.find((p: any) => p.sku === product.sku) || items[0];
                if (match) {
                    setSelectedProduct({ ...product, ...match });
                } else {
                    setSelectedProduct(product);
                }
            } else {
                setSelectedProduct(product);
            }
        } catch (err) {
            console.error("Failed to fetch product details for popup:", err);
            setSelectedProduct(product);
        } finally {
        }
    };

    const startItem = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
    const endItem = Math.min(currentPage * pageSize, totalCount);

    if (loading && favProducts.length === 0) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#f5a623]"></div>
            </div>
        );
    }

    const totalPages = Math.ceil(totalCount / pageSize);
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div className="w-full font-rubik">

            {/* Top Bar - Styled same as products page header */}
            <div className="px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Items <span className="text-gray-900">{startItem} to {endItem}</span> of <span className="text-gray-900">{totalCount}</span> total
                </div>
                <div className="flex items-center gap-1.5 md:gap-2 flex-wrap justify-center">
                    {pages.map((p) => (
                        <button key={p} onClick={() => setCurrentPage(p)} className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-[11px] font-black rounded-lg border transition-all cursor-pointer ${currentPage === p ? "bg-[#f5a623] border-[#f5a623] text-black shadow-sm" : "bg-white border-gray-200 text-gray-400 hover:border-[#f5a623]"}`}>{p}</button>
                    ))}
                    {currentPage < totalPages && (
                        <button onClick={() => setCurrentPage(currentPage + 1)} className="h-8 md:h-9 px-3 md:px-4 flex items-center justify-center text-[10px] bg-white border border-gray-200 text-black font-black rounded-lg uppercase cursor-pointer shadow-sm active:scale-95 transition-all">Next</button>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Show</span>
                    <PortalDropdown value={String(pageSize)} onChange={(val) => { setPageSize(Number(val)); setCurrentPage(1); }} options={[{ label: "10", value: "10" }, { label: "20", value: "20" }, { label: "50", value: "50" }]} minWidth={70} buttonClassName="h-8 px-2 bg-white border border-gray-200 rounded-lg text-[11px] font-black" />
                </div>
            </div>

            {/* Mobile/Tablet Card List */}
            <div className="xl:hidden grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {favProducts.length === 0 ? (
                    <div className="py-16 text-center text-gray-400 italic text-[13px]">Your favorites list is currently empty.</div>
                ) : favProducts.map((product) => {
                    const brandName = product.brand || product.name.split(' ')[0] || "—";
                    const isOutOfStock = product.stock_status === "Out of Stock" || product.stock_status === "Not Available" || Number(product.stock_qty || 0) <= 0;
                    const isLimited = product.stock_qty > 0 && product.stock_qty <= 10;
                    const dotColor = isOutOfStock ? "bg-red-500" : isLimited ? "bg-yellow-400" : "bg-green-500";
                    const stockLabel = isOutOfStock ? "Not Available" : isLimited ? "Limited" : "In Stock";

                    return (
                        <div key={product.product_id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 flex flex-col gap-2">
                            <div className="flex gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{brandName}</p>
                                    <p className="text-[12px] font-black text-gray-900 leading-tight mt-0.5 truncate">{product.pattern || product.name || "—"}</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className="text-[12px] font-bold text-black">{product.tyre_size || "—"}</span>
                                        <div onClick={() => handleShowProductDetail(product)} className="w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center text-[9px] font-bold text-white cursor-pointer active:scale-95 flex-shrink-0">i</div>
                                        {product.origin && <span className="text-[11px] text-gray-400">{product.origin}</span>}
                                        {product.year && <span className="text-[11px] text-gray-400 font-mono">{product.year}</span>}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                        <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                                        <span className="text-[10px] font-bold text-gray-600 uppercase">{stockLabel}</span>
                                    </div>
                                    {product.offer && <p className="text-[10px] font-bold text-red-600 uppercase mt-1">{product.offer}</p>}
                                </div>
                                <div className="w-14 h-14 flex-shrink-0 rounded-lg border border-gray-100 overflow-hidden bg-gray-50 flex items-center justify-center cursor-pointer" onClick={() => { setSelectedImage(product.image_url); setPreviewProduct(product); setIsImageModalOpen(true); }}>
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between border-t border-gray-100 pt-2.5 mt-1 gap-2">
                                <span className="text-[13px] font-black text-black rubik-sans"><Price amount={product.final_price} /></span>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    {!isOutOfStock ? (
                                        <button onClick={() => onAddToCart(product)} disabled={addingToCart === product.sku} className={`h-9 px-2.5 rounded-lg flex items-center gap-1.5 text-[11px] font-black uppercase shadow-sm active:scale-95 cursor-pointer flex-shrink-0 bg-[#f5a623] text-black`}>
                                            {addingToCart === product.sku ? <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <><ShoppingCart size={14} strokeWidth={2.5} /></>}
                                        </button>
                                    ) : (
                                        <button onClick={() => { setInquiryProduct(product); setIsInquiryModalOpen(true); }} className="h-9 px-2.5 bg-[#f5a623] text-black rounded-lg flex items-center gap-1.5 text-[11px] font-black uppercase shadow-sm active:scale-95 cursor-pointer flex-shrink-0">
                                            <Info size={14} strokeWidth={2.5} />
                                        </button>
                                    )}
                                    <button onClick={() => handleRemove(product)} disabled={removing === product.product_id} className={`w-9 h-9 rounded-lg flex items-center justify-center active:scale-95 cursor-pointer flex-shrink-0 ${removing === product.product_id ? "bg-gray-100 text-gray-400" : "bg-white text-gray-400 border border-gray-100 hover:text-red-500"}`}>
                                        {removing === product.product_id ? <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></div> : <Trash2 size={16} strokeWidth={2.5} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Desktop Table */}
            <div className="hidden xl:flex flex-col bg-white rounded-none md:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex-1 overflow-x-auto">
                    <table className="w-full border-collapse table-fixed min-w-[900px]">
                        <TableColGroup />
                        <thead className="sticky top-0 z-20">
                            <tr className="bg-gray-50 border-b-2 border-gray-200">
                                {TABLE_HEADERS.map(h => (
                                    <th key={h} className="px-2 md:px-4 py-2 md:py-3 text-[11px] font-black text-black uppercase tracking-widest text-center">{h === 'Size' ? (
                                        <div className="flex items-center justify-center">
                                            Size <Info className="w-4 h-4 text-gray-400 ml-1 cursor-pointer" />
                                        </div>
                                    ) : h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {favProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-5 py-24 text-center">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Your favorites list is currently empty.</p>
                                    </td>
                                </tr>
                            ) : (
                                favProducts.map((product) => {
                                    const brandName = product.brand || product.name.split(' ')[0] || "—";
                                    const isOutOfStock = product.stock_status === "Out of Stock" || product.stock_status === "Not Available" || Number(product.stock_qty || 0) <= 0;
                                    const isLimited = product.stock_qty > 0 && product.stock_qty <= 10;
                                    const stockColor = isOutOfStock ? "bg-red-500" : isLimited ? "bg-yellow-400" : "bg-green-500";
                                    const stockLabel = isOutOfStock ? "Not Available" : isLimited ? "Limited" : "In Stock";

                                    return (
                                        <tr key={product.product_id} className={`hover:bg-gray-50/50 transition-colors group ${ROW_HEIGHT}`}>
                                            <td className="px-2 md:px-4 text-[12px] font-normal text-gray-700 text-center">{brandName}</td>
                                            <td className="px-2 md:px-4 text-center whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <span className="text-[12px] font-normal text-gray-900 tracking-tight">{product.tyre_size}</span>
                                                    <div
                                                        onClick={() => handleShowProductDetail(product)}
                                                        className={`w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center text-[9px] font-black text-white cursor-pointer hover:bg-yellow-400 hover:text-black transition-all shadow-sm flex-shrink-0`}
                                                    >
                                                        i
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-2 md:px-4 text-[12px] font-normal text-gray-600 text-center">{product.pattern || "—"}</td>
                                            <td className="px-2 md:px-4 text-[12px] font-normal text-gray-500 text-center font-mono">{product.year || "—"}</td>
                                            <td className="px-2 md:px-4 text-[12px] font-normal text-gray-600 text-center">{product.origin || "—"}</td>
                                            <td className="px-2 md:px-4 text-center">
                                                <div className="w-10 h-10 mx-auto">
                                                    {product.image_url ? (
                                                        <div
                                                            className="relative w-10 h-10 group/img cursor-pointer"
                                                            onClick={() => {
                                                                setSelectedImage(product.image_url);
                                                                setPreviewProduct(product);
                                                                setIsImageModalOpen(true);
                                                            }}
                                                        >
                                                            <img
                                                                src={product.image_url}
                                                                alt={product.name}
                                                                className="w-10 h-10 object-contain rounded border border-gray-100 shadow-sm"
                                                            />
                                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-center justify-center rounded">
                                                                <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-black font-bold text-[10px] shadow-lg transform scale-50 group-hover/img:scale-100 transition-transform duration-300">+</div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-gray-300 font-black uppercase leading-[40px]">No Image</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-2 md:px-4 text-center">
                                                {product.offer ? (
                                                    <span className="text-red-600 font-bold text-[10px] uppercase tracking-tight block max-w-[120px] mx-auto">
                                                        {product.offer}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-200">—</span>
                                                )}
                                            </td>
                                            <td className="px-2 md:px-4 text-center">
                                                <div className="flex flex-col items-center justify-center text-center gap-1">
                                                    <span className={`w-4 h-4 rounded-full border border-gray-100 shadow-sm ${stockColor}`}></span>
                                                    <span className="text-[10px] font-black text-gray-700 uppercase leading-none">{stockLabel}</span>
                                                </div>
                                            </td>
                                            <td className="px-2 md:px-4 text-center whitespace-nowrap">
                                                <div className="flex flex-col items-center justify-center min-w-[80px]">
                                                    {(product as any).original_price > 0 && (product as any).original_price > product.final_price ? (
                                                        <>
                                                            <span className="text-[10px] font-bold text-gray-400 line-through mb-0.5">
                                                                <Price amount={(product as any).original_price} />
                                                            </span>
                                                            <span className="text-[12px] font-black text-black tracking-tight leading-none price currency-riyal">
                                                                <Price amount={product.final_price} />
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-[12px] font-black text-black tracking-tight leading-none price currency-riyal">
                                                            <Price amount={product.final_price} />
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-1 text-center align-middle">
                                                <div className="inline-grid grid-cols-3 gap-1 items-center">
                                                    {/* Col 1: Qty */}
                                                    {!isOutOfStock ? (
                                                        <div className="w-8 h-8 border-2 border-gray-100 rounded-md flex items-center justify-center text-[11px] font-black text-gray-900 bg-white shadow-sm overflow-hidden">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={quantities[product.product_id] || 1}
                                                                onChange={(e) => handleQtyChange(product.product_id, e.target.value)}
                                                                className="w-full bg-transparent text-center text-[11px] font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-8 h-8" />
                                                    )}

                                                    {/* Col 2: Cart or Enquiry */}
                                                    {!isOutOfStock ? (
                                                        <button
                                                            onClick={() => onAddToCart(product)}
                                                            disabled={addingToCart === product.sku}
                                                            className="w-8 h-8 bg-yellow-400 hover:bg-yellow-500 text-black rounded-md flex items-center justify-center shadow-md active:scale-95 transition-all disabled:opacity-50"
                                                            title="Add to Cart"
                                                        >
                                                            {addingToCart === product.sku ? (
                                                                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                                            ) : (
                                                                <ShoppingCart size={15} strokeWidth={2.5} />
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setInquiryProduct(product);
                                                                setIsInquiryModalOpen(true);
                                                            }}
                                                            className="w-8 h-8 bg-yellow-400 hover:bg-yellow-500 text-black rounded-md flex items-center justify-center shadow-md active:scale-95"
                                                            title="Make Inquiry"
                                                        >
                                                            <Info size={15} strokeWidth={2.5} />
                                                        </button>
                                                    )}

                                                    {/* Col 3: Remove */}
                                                    <button
                                                        onClick={() => handleRemove(product)}
                                                        disabled={removing === product.product_id}
                                                        className={`w-8 h-8 rounded-md flex items-center justify-center shadow-md border active:scale-95 transition-all ${removing === product.product_id
                                                            ? "bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed"
                                                            : "bg-white text-gray-400 border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                                                            }`}
                                                        title="Remove from Favourites"
                                                    >
                                                        {removing === product.product_id ? (
                                                            <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
                                                        ) : (
                                                            <Trash2 size={15} strokeWidth={2.5} />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bottom Pagination fallback if needed, but the design specifies top bar.
                Usually it's good to have it at the bottom too for long tables. */}
            {totalCount > pageSize && (
                <div className="mt-8 flex justify-center">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(totalCount / pageSize)}
                        totalItems={totalCount}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}
            {/* Inquiry Modal */}
            {inquiryProduct && (
                <ProductEnquiryModal
                    isOpen={isInquiryModalOpen}
                    onClose={() => {
                        setIsInquiryModalOpen(false);
                        setInquiryProduct(null);
                    }}
                    productSku={inquiryProduct.sku}
                    productName={inquiryProduct.name}
                    productPrice={inquiryProduct.final_price}
                />
            )}

            {/* Product Details Modal */}
            <ProductDialog
                product={selectedProduct}
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
            />

            {/* Image Preview - Side Drawer */}
            <Drawer
                isOpen={isImageModalOpen && !!selectedImage}
                onClose={() => setIsImageModalOpen(false)}
            >
                <div className="flex flex-col h-full bg-white">
                    <div className="bg-[#FFB82B] px-4 md:px-8 py-4 md:py-6 flex items-center justify-center relative flex-shrink-0">
                        <h2 className="text-[14px] md:text-[17px] font-black text-black text-center uppercase tracking-tight">
                            {previewProduct ? `${previewProduct.pattern || '-'} - ${previewProduct.tyre_size || '-'}` : "Product Preview"}
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center justify-center">
                        <div className="p-2 md:p-4 bg-white flex items-center justify-center min-h-[200px] md:min-h-[400px] w-full">
                            <img src={selectedImage || ''} alt={previewProduct ? `${previewProduct.pattern} - ${previewProduct.tyre_size}` : "Product Preview"} className="max-w-full max-h-[60vh] md:max-h-[75vh] object-contain rounded-lg" />
                        </div>
                        <div className="mt-6 md:mt-10 w-full">
                            <button onClick={() => setIsImageModalOpen(false)} className="w-full py-3 md:py-4 bg-black text-white text-[12px] md:text-sm font-black uppercase tracking-widest rounded shadow-xl hover:bg-gray-800 transition-all cursor-pointer active:scale-95">Close Preview</button>
                        </div>
                    </div>
                </div>
            </Drawer>
        </div>
    );
}
