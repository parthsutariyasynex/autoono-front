"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, X, Info, Star } from "lucide-react";
import { formatPrice } from "@/utils/helpers";
import { toast } from "react-hot-toast";
import ProductEnquiryModal from "./ProductEnquiryModal";
import ProductDialog from "./ProductDialog";
import { api } from "@/lib/api/api-client";
import Pagination from "@/components/Pagination";
import { useCart } from "@/modules/cart/context/CartContext";
import { useSession } from "next-auth/react";

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
                // Use original_price/regular_price/old_price if available, otherwise no old price
                const originalPrice = Number(p.original_price || p.regular_price || p.old_price || 0);
                const hasDiscount = p.show_old_price === true && originalPrice > finalPrice;
                const offPerc = hasDiscount ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100) : 0;

                return {
                    ...p,
                    product_id: p.product_id || p.id,
                    name: p.name || p.sku || "N/A",
                    image_url: p.image_url || p.image || "/placeholder-tyre.png",
                    final_price: finalPrice,
                    original_price: hasDiscount ? originalPrice : 0,
                    offer: offPerc > 0 ? `${offPerc}% OFF` : (p.offer || p.discount_label || ""),
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

    // Scroll Lock when any modal is open
    useEffect(() => {
        const anyModalOpen = isInquiryModalOpen || selectedProduct || isImageModalOpen;
        if (anyModalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isInquiryModalOpen, selectedProduct, isImageModalOpen]);

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
                router.push("/login");
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
            const headers: HeadersInit = { "Content-Type": "application/json" };
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
        <div className="w-full font-rubik overflow-hidden">
            <h1 className="text-[28px] font-bold text-center mb-10 text-black uppercase tracking-tight">
                FAVOURITE PRODUCTS
            </h1>

            {/* Top Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6 bg-white py-2">
                {/* Left: Items count */}
                <div className="text-[14px] text-gray-400 font-medium">
                    Items <span className="text-black font-bold">{startItem} to {endItem}</span> of <span className="text-black font-bold">{totalCount}</span> total
                </div>

                {/* Center: Pagination */}
                <div className="flex items-center gap-2">
                    {pages.map((p) => (
                        <button
                            key={p}
                            onClick={() => setCurrentPage(p)}
                            className={`w-9 h-9 flex items-center justify-center text-[13px] rounded-full border transition-all duration-200 ${currentPage === p
                                ? "bg-[#f5a623] border-[#f5a623] text-black font-bold shadow-md"
                                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-[#f5a623] hover:text-[#f5a623]"
                                }`}
                        >
                            {p}
                        </button>
                    ))}

                    {currentPage < totalPages && (
                        <button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            className="h-9 px-4 flex items-center justify-center text-[12px] bg-white border border-gray-200 text-black font-bold rounded-full hover:bg-gray-50 hover:border-[#f5a623] hover:text-[#f5a623] transition-all duration-200 uppercase"
                        >
                            Next
                        </button>
                    )}
                </div>

                {/* Right: Show per page */}
                <div className="flex items-center gap-2">
                    <span className="text-[13px] text-gray-500 font-medium whitespace-nowrap">Show</span>
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        className="border border-gray-200 rounded px-2 py-1.5 text-[14px] font-bold text-black focus:outline-none focus:border-[#f5a623] bg-white cursor-pointer"
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                    <span className="text-[13px] text-gray-500 font-medium whitespace-nowrap">per page</span>
                </div>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full text-left border-collapse bg-[#f2f2f2]">
                    <thead>
                        <tr className="bg-white border-b border-gray-200 text-[12px] uppercase font-bold text-gray-800">
                            <th className="px-5 py-5 border-r border-gray-200">Brand</th>
                            <th className="px-5 py-5 border-r border-gray-200 whitespace-nowrap">
                                Size <Info className="inline-block w-4 h-4 text-gray-400 ml-1 cursor-pointer" />
                            </th>
                            <th className="px-5 py-5 border-r border-gray-200">Pattern</th>
                            <th className="px-5 py-5 border-r border-gray-200">Year</th>
                            <th className="px-5 py-5 border-r border-gray-200">Origin</th>
                            <th className="px-5 py-5 border-r border-gray-200">Image</th>
                            <th className="px-5 py-5 border-r border-gray-200">Offer</th>
                            <th className="px-5 py-5 border-r border-gray-200">Stock</th>
                            <th className="px-5 py-5 border-r border-gray-200 text-center">Price</th>
                            <th className="px-5 py-5 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-600">
                        {favProducts.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="px-5 py-24 text-center text-gray-400 italic bg-white">
                                    Your favorites list is currently empty.
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
                                    <tr key={product.product_id} className="hover:bg-gray-50/50 transition-colors bg-white">
                                        <td className="px-5 py-5 text-[14px] font-bold text-black border-r border-gray-100">{brandName}</td>
                                        <td className="px-5 py-5 text-[14px] text-gray-600 border-r border-gray-100">
                                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                <span>{product.tyre_size}</span>
                                                <div
                                                    onClick={() => handleShowProductDetail(product)}
                                                    className={`w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center text-[9px] font-black text-white cursor-pointer hover:bg-yellow-400 hover:text-black transition-all shadow-sm flex-shrink-0`}
                                                >
                                                    i
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-5 text-[14px] text-gray-600 border-r border-gray-100">{product.pattern || "—"}</td>
                                        <td className="px-5 py-5 text-[14px] text-gray-600 border-r border-gray-100">{product.year || "—"}</td>
                                        <td className="px-5 py-5 text-[14px] text-gray-600 border-r border-gray-100">{product.origin || "—"}</td>
                                        <td className="px-5 py-5 border-r border-gray-100">
                                            <div
                                                className="w-16 h-16 bg-white rounded border border-gray-100 p-1 mx-auto flex items-center justify-center relative group/img cursor-pointer transition-all duration-300 hover:shadow-md"
                                                onClick={() => {
                                                    setSelectedImage(product.image_url);
                                                    setIsImageModalOpen(true);
                                                }}
                                            >
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-center justify-center rounded">
                                                    <div className="w-6 h-6 bg-[#f5a623] rounded-full flex items-center justify-center text-black font-black text-sm shadow-lg transform scale-50 group-hover/img:scale-100 transition-transform duration-300">+</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-5 border-r border-gray-100">
                                            {product.offer ? (
                                                <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded whitespace-nowrap">
                                                    {product.offer}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300">—</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-5 border-r border-gray-100">
                                            <div className="flex flex-col items-center gap-1.5 min-w-[70px]">
                                                <span className={`w-3 h-3 rounded-full ${stockColor} border border-white shadow-sm`}></span>
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{stockLabel}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-5 whitespace-nowrap border-r border-gray-100 text-center">
                                            <div className="flex flex-col items-center justify-center min-w-[100px]">
                                                {(product as any).original_price > 0 && (product as any).original_price > product.final_price ? (
                                                    <>
                                                        <span className="text-[13px] font-bold text-gray-400 line-through mb-0.5">
                                                            {formatPrice((product as any).original_price)}
                                                        </span>
                                                        <span className="text-[18px] font-black text-black tracking-tight leading-none">
                                                            {formatPrice(product.final_price)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-[18px] font-black text-black tracking-tight leading-none">
                                                        {formatPrice(product.final_price)}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-5">
                                            <div className="flex items-center justify-center gap-2">
                                                {!isOutOfStock ? (
                                                    <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center shadow-sm">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={quantities[product.product_id] || 1}
                                                            onChange={(e) => handleQtyChange(product.product_id, e.target.value)}
                                                            className="w-full bg-transparent text-center text-[14px] font-bold text-black outline-none"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10" />
                                                )}

                                                {!isOutOfStock ? (
                                                    <button
                                                        onClick={() => onAddToCart(product)}
                                                        disabled={addingToCart === product.sku}
                                                        className="w-10 h-10 bg-[#f5a623] text-black rounded-lg flex items-center justify-center transition-all disabled:opacity-50 shadow-sm"
                                                        title="Add to Cart"
                                                    >
                                                        <ShoppingCart size={18} strokeWidth={2.5} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setInquiryProduct(product);
                                                            setIsInquiryModalOpen(true);
                                                        }}
                                                        className="w-10 h-10 bg-[#f5a623] text-black rounded-lg flex items-center justify-center transition-all shadow-sm hover:opacity-80"
                                                        title="Make Inquiry"
                                                    >
                                                        <Info size={18} strokeWidth={2.5} />
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => handleRemove(product)}
                                                    className="w-10 h-10 bg-[#f5a623] text-black rounded-lg flex items-center justify-center transition-all shadow-sm"
                                                    title="Remove from Favourites"
                                                >
                                                    <Star size={18} strokeWidth={2.5} />
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
            {selectedProduct && (
                <ProductDialog
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                />
            )}

            {/* Image Preview Modal */}
            {isImageModalOpen && selectedImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={() => setIsImageModalOpen(false)}>
                    <div className="relative max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 ease-out" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="bg-[#f5a623] px-6 py-4 flex items-center justify-between border-b border-[#f5a623]/20">
                            <h3 className="text-[12px] font-black text-black uppercase tracking-[0.1em] flex items-center gap-2">
                                <span className="w-2 h-2 bg-black rounded-full"></span>
                                Product Image Preview
                            </h3>
                            <button
                                className="w-8 h-8 bg-white/40 hover:bg-white text-black rounded-lg flex items-center justify-center transition-all shadow-sm"
                                onClick={() => setIsImageModalOpen(false)}
                            >
                                <X size={18} strokeWidth={3} />
                            </button>
                        </div>

                        {/* Image Container */}
                        <div className="p-10 bg-white flex items-center justify-center min-h-[400px]">
                            <img
                                src={selectedImage}
                                alt="Product Preview"
                                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                            />
                        </div>

                        {/* Footer Tip */}
                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Click outside or press X to close</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
