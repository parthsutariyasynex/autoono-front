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
                            className={`w-9 h-9 flex items-center justify-center text-[13px] rounded-full border transition-all duration-200 cursor-pointer ${currentPage === p
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
                            className="h-9 px-4 flex items-center justify-center text-[12px] bg-white border border-gray-200 text-black font-bold rounded-full hover:bg-gray-50 hover:border-[#f5a623] hover:text-[#f5a623] transition-all duration-200 uppercase cursor-pointer shadow-sm active:scale-95"
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
                            <th className="px-5 py-5 border-r border-gray-200 text-center">Brand</th>
                            <th className="px-5 py-5 border-r border-gray-200 whitespace-nowrap text-center">
                                Size <Info className="inline-block w-4 h-4 text-gray-400 ml-1 cursor-pointer" />
                            </th>
                            <th className="px-5 py-5 border-r border-gray-200 text-center">Pattern</th>
                            <th className="px-5 py-5 border-r border-gray-200 text-center">Year</th>
                            <th className="px-5 py-5 border-r border-gray-200 text-center">Origin</th>
                            <th className="px-5 py-5 border-r border-gray-200 text-center">Image</th>
                            <th className="px-5 py-5 border-r border-gray-200 text-center">Offer</th>
                            <th className="px-5 py-5 border-r border-gray-200 text-center">Stock</th>
                            <th className="px-5 py-5 border-r border-gray-200 text-center text-center">Price</th>
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
                                        <td className="px-5 py-5 text-[14px] font-bold text-black border-r border-gray-100 text-center">{brandName}</td>
                                        <td className="px-5 py-5 text-[14px] text-gray-600 border-r border-gray-100 text-center">
                                            <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                                                <span>{product.tyre_size}</span>
                                                <div
                                                    onClick={() => handleShowProductDetail(product)}
                                                    className={`w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center text-[9px] font-black text-white cursor-pointer hover:bg-yellow-400 hover:text-black transition-all shadow-sm flex-shrink-0`}
                                                >
                                                    i
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-5 text-[14px] text-gray-600 border-r border-gray-100 text-center">{product.pattern || "—"}</td>
                                        <td className="px-5 py-5 text-[14px] text-gray-600 border-r border-gray-100 text-center">{product.year || "—"}</td>
                                        <td className="px-5 py-5 text-[14px] text-gray-600 border-r border-gray-100 text-center">{product.origin || "—"}</td>
                                        <td className="px-5 py-5 border-r border-gray-100">
                                            <div
                                                className="w-16 h-16 bg-white rounded border border-gray-100 p-1 mx-auto flex items-center justify-center relative group/img cursor-pointer transition-all duration-300 hover:shadow-md"
                                                onClick={() => {
                                                    setSelectedImage(product.image_url);
                                                    setPreviewProduct(product);
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
                                        <td className="px-5 py-5 border-r border-gray-100 text-center">
                                            {product.offer ? (
                                                <span className="text-red-600 font-bold text-[10px] leading-tight uppercase tracking-tight block max-w-[120px] mx-auto">
                                                    {product.offer}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300">—</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-5 border-r border-gray-100 text-center">
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
                                                            <Price amount={(product as any).original_price} />
                                                        </span>
                                                        <span className="text-[18px] font-black text-black tracking-tight leading-none price currency-riyal">

                                                            <Price amount={product.final_price} />
                                                        </span>

                                                    </>
                                                ) : (
                                                    <span className="text-[18px] font-black text-black tracking-tight leading-none price currency-riyal">

                                                        <Price amount={product.final_price} />
                                                    </span>

                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-5">
                                            <div className="flex items-center justify-center gap-2">
                                                {!isOutOfStock ? (
                                                    <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center shadow-sm cursor-text focus-within:border-[#f5a623] transition-all overflow-hidden">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={quantities[product.product_id] || 1}
                                                            onChange={(e) => handleQtyChange(product.product_id, e.target.value)}
                                                            className="w-full h-full bg-transparent text-center text-[14px] font-bold text-black outline-none cursor-text [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10" />
                                                )}

                                                {!isOutOfStock ? (
                                                    <button
                                                        onClick={() => onAddToCart(product)}
                                                        disabled={addingToCart === product.sku}
                                                        className="w-10 h-10 bg-[#f5a623] hover:bg-[#e0981d] text-black rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-50 shadow-sm cursor-pointer active:scale-95"
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
                                                        className="w-10 h-10 bg-[#f5a623] hover:bg-[#e0981d] text-black rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm cursor-pointer active:scale-95"
                                                        title="Make Inquiry"
                                                    >
                                                        <Info size={18} strokeWidth={2.5} />
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => handleRemove(product)}
                                                    disabled={removing === product.product_id}
                                                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm border cursor-pointer ${removing === product.product_id
                                                        ? "bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed"
                                                        : "bg-white text-gray-400 border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 active:scale-95"
                                                        }`}
                                                    title="Remove from Favourites"
                                                >
                                                    {removing === product.product_id ? (
                                                        <div className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
                                                    ) : (
                                                        <Trash2 size={18} strokeWidth={2.5} />
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
                    {/* Header */}
                    <div className="bg-[#FFB82B] px-8 py-6 flex items-center justify-center relative flex-shrink-0">
                        <h2 className="text-[17px] font-black text-black text-center uppercase tracking-tight">
                            {previewProduct ? `${previewProduct.pattern || '-'} - ${previewProduct.tyre_size || '-'}` : "Product Preview"}
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center">
                        {/* Image Container */}
                        <div className="p-4 bg-white flex items-center justify-center min-h-[400px] w-full">
                            <img
                                src={selectedImage || ''}
                                alt={previewProduct ? `${previewProduct.pattern} - ${previewProduct.tyre_size}` : "Product Preview"}
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
        </div>
    );
}
