"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, ShoppingCart, Trash2, Upload, FileDown, Check, X, Loader2, Plus, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/modules/cart/hooks/useCart";
import { toast } from "react-hot-toast";
import Price from "../components/Price";
import { redirectToLogin } from "@/utils/helpers";
import { api } from "@/lib/api/api-client";

interface QuickOrderItem {
    sku: string;
    name: string;
    qty: number;
    price: number;
    image?: string;
}

export default function QuickOrderPage() {
    const router = useRouter();
    const { addToCart, refetchCart } = useCart();
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [items, setItems] = useState<QuickOrderItem[]>([]);

    // Requirement 6: Persist data in localStorage
    useEffect(() => {
        const saved = localStorage.getItem("quick-order-items");
        if (saved) {
            try {
                setItems(JSON.parse(saved));
            } catch (err) {
                console.error("Error loading saved items:", err);
            }
        }
    }, []);

    useEffect(() => {
        if (items.length >= 0) {
            localStorage.setItem("quick-order-items", JSON.stringify(items));
        }
    }, [items]);
    const [skuText, setSkuText] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const searchRef = useRef<HTMLDivElement>(null);

    // Auth check
    useEffect(() => {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
            redirectToLogin(router);
        }
    }, [router]);

    // Click outside to close search results
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchResults([]);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Instant Search Logic - uses dedicated quick-order search API
    useEffect(() => {
        if (searchTerm.length < 2) {
            setSearchResults([]);
            return;
        }

        const abortController = new AbortController();
        const handler = setTimeout(async () => {
            setIsSearching(true);
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    redirectToLogin(router);
                    return;
                }
                const res = await fetch(`/api/kleverapi/quick-order/search?query=${encodeURIComponent(searchTerm)}&pageSize=10`, {
                    headers: { "Authorization": `Bearer ${token}` },
                    signal: abortController.signal,
                });
                if (res.status === 401) {
                    localStorage.removeItem("token");
                    redirectToLogin(router);
                    return;
                }
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data.items || []);
                }
            } catch (err: any) {
                if (err.name !== "AbortError") console.error("Search error:", err);
            } finally {
                if (!abortController.signal.aborted) setIsSearching(false);
            }
        }, 400);

        return () => {
            clearTimeout(handler);
            abortController.abort();
        };
    }, [searchTerm]);

    const downloadCSV = (fileName: string, base64Content: string) => {
        try {
            // 1. Convert base64 to Blob
            const byteCharacters = atob(base64Content);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'text/csv' });

            // 2. Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);

            // 3. Trigger download
            document.body.appendChild(link);
            link.click();

            // 4. Cleanup
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            return true;
        } catch (err) {
            console.error("Error decoding base64 content:", err);
            return false;
        }
    };

    const addItemToOrder = (product: any) => {
        const sku = product.sku;
        const existing = items.find(i => i.sku === sku);
        if (existing) {
            setItems(items.map(i => i.sku === sku ? { ...i, qty: i.qty + 1 } : i));
        } else {
            setItems([...items, {
                sku,
                name: product.name || "",
                qty: 1,
                price: product.price || product.final_price || 0,
                image: product.image_url
            }]);
        }
        setSearchTerm("");
        setSearchResults([]);
        toast.success(`${sku} added to list`);
    };

    const removeOrderItem = async (sku: string) => {
        setLoading(true);
        const toastId = toast.loading(`Removing ${sku}...`);
        try {
            // Mageplaza Quick Order Remove Single Item
            await api.delete(`/kleverapi/quick-order/remove/${sku}`);

            setItems(items.filter(i => i.sku !== sku));
            toast.success(`${sku} removed from list`, { id: toastId });
        } catch (err: any) {
            console.error(`Remove item ${sku} error:`, err);
            toast.error(err || `Failed to remove ${sku}`, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const updateQty = async (sku: string, qty: number) => {
        if (qty < 1) return;

        // Optimistic update
        const originalItems = [...items];
        setItems(items.map(i => i.sku === sku ? { ...i, qty } : i));

        try {
            // Mageplaza Quick Order Update Quantity
            await api.put(`/kleverapi/quick-order/update-qty/${sku}`, { qty });
        } catch (err: any) {
            console.error(`Update qty error for ${sku}:`, err);
            // Revert state if backend update fails
            setItems(originalItems);
            toast.error(`Failed to update quantity for ${sku}. Please try again.`);
        }
    };

    const handleDownloadSampleCsv = async (e: React.MouseEvent) => {
        e.preventDefault();
        setLoading(true);
        const toastId = toast.loading("Downloading sample file...");
        try {
            // Mageplaza Quick Order Download Sample API
            const response = await api.get("/kleverapi/quick-order/download-csv");

            // Requirements 2 & 4: file_name and file_content
            const base64 = response?.file_content || response?.base64;
            const fileName = response?.file_name || response?.filename || "quick_order_sample.csv";

            if (base64) {
                // Requirement 3: Use reusable downloadCSV function
                const success = downloadCSV(fileName, base64);
                if (success) {
                    toast.success("Download started", { id: toastId });
                } else {
                    toast.error("Failed to process file content", { id: toastId });
                }
            } else {
                console.warn("Invalid CSV structure received:", response);
                toast.error(response.message || "Failed to download sample file", { id: toastId });
            }
        } catch (err: any) {
            console.error("Download CSV error:", err);
            toast.error(err || "Download failed. Please try again.", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleAddMultipleSkus = async () => {
        if (!skuText.trim()) return;

        setLoading(true);
        const lines = skuText.split('\n');
        const validateItems: any[] = [];

        for (const line of lines) {
            const parts = line.split(',');
            const sku = parts[0]?.trim();
            const qty = parseInt(parts[1]?.trim() || "1");
            if (sku) {
                validateItems.push({ sku, qty });
            }
        }

        if (validateItems.length === 0) {
            setLoading(false);
            return;
        }

        const toastId = toast.loading("Validating SKUs...");

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`/api/kleverapi/quick-order/validate`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ items: validateItems })
            });

            if (res.ok) {
                const validated = await res.json();
                // Assuming Mageplaza returns items with data
                // For items that are valid/found, Mageplaza usually returns data or successful results index
                // If results is an array of items:
                const results = Array.isArray(validated) ? validated : (validated.items || []);

                const newItemsList: QuickOrderItem[] = [...items];

                results.forEach((p: any) => {
                    const sku = p.sku || p.product_sku;
                    if (sku) {
                        const existingIndex = newItemsList.findIndex(i => i.sku === sku);
                        if (existingIndex > -1) {
                            newItemsList[existingIndex].qty += Number(p.qty || 1);
                        } else {
                            newItemsList.push({
                                sku: sku,
                                name: p.name || p.product_name || `${p.brand || p.mgs_brand || ""} ${p.pattern || ""}`.trim() || sku,
                                qty: Number(p.qty || 1),
                                price: Number(p.price || p.final_price || p.special_price || 0),
                                image: p.image_url || p.image || p.thumbnail || p.small_image || null
                            });
                        }
                    }
                });

                setItems(newItemsList);
                setSkuText("");
                toast.success("List updated", { id: toastId });
            } else {
                toast.error("Validation failed", { id: toastId });
            }
        } catch (err) {
            console.error("Validation error:", err);
            toast.error("An error occurred during validation", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFile(file);
    };

    const processFile = async () => {
        if (!file) {
            toast.error("Please select a CSV file first");
            return;
        }

        setLoading(true);
        const toastId = toast.loading(`Processing ${file.name}...`);

        try {
            // Requirement 2: Read file as base64 using FileReader
            const reader = new FileReader();

            const base64Promise = new Promise<string>((resolve, reject) => {
                reader.onload = () => {
                    const result = reader.result as string;
                    // Extract only the base64 part (after the comma: data:text/csv;base64,...)
                    const base64 = result.split(",")[1];
                    resolve(base64);
                };
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(file);
            });

            const base64Content = await base64Promise;

            // Requirement 3: Send POST request with { fileContent: base64 }
            const response = await api.post("/kleverapi/quick-order/upload-csv", {
                fileContent: base64Content,
                fileName: file.name
            });

            // Requirement 4 & 5: Parse response and Merge items
            const results = Array.isArray(response) ? response : (response.items || []);

            if (results.length > 0) {
                const newItemsList: QuickOrderItem[] = [...items];

                results.forEach((p: any) => {
                    const sku = p.sku || p.product_sku;
                    if (sku) {
                        // Merge with existing items if already present
                        const existingIndex = newItemsList.findIndex(i => i.sku === sku);
                        if (existingIndex > -1) {
                            newItemsList[existingIndex].qty += Number(p.qty || 1);
                        } else {
                            newItemsList.push({
                                sku: sku,
                                name: p.name || p.product_name || `${p.brand || p.mgs_brand || ""} ${p.pattern || ""}`.trim() || sku,
                                qty: Number(p.qty || 1),
                                price: Number(p.price || p.final_price || p.special_price || 0),
                                image: p.image_url || p.image || p.thumbnail || p.small_image || null
                            });
                        }
                    }
                });

                setItems(newItemsList);
                setFile(null);
                toast.success(`Successfully added ${results.length} items from ${file.name}`, { id: toastId });
            } else {
                toast.error(response.message || "No valid products found in the CSV", { id: toastId });
            }
        } catch (err: any) {
            console.error("Upload CSV error:", err);
            toast.error(err || "An error occurred during file upload", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async () => {
        if (items.length === 0) {
            toast.error("Cannot add to cart as quick order list is empty");
            return;
        }

        setLoading(true);
        const toastId = toast.loading("Adding items to your cart...");

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`/api/kleverapi/quick-order/add-to-cart`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    items: items.map(item => ({ sku: item.sku, qty: item.qty }))
                })
            });

            if (res.ok) {
                // Essential: Refresh the global cart state after bulk add
                await refetchCart();

                toast.success("Items added to cart successfully!", { id: toastId });
                setItems([]); // Clear local list
                router.push("/cart"); // Immediate redirect on success
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || "Failed to add items to cart", { id: toastId });
            }
        } catch (err) {
            console.error("Add to cart error:", err);
            toast.error("An error occurred. Please try again.", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async () => {
        if (items.length === 0) {
            toast.error("You have no items in your shopping cart");
            return;
        }

        setLoading(true);
        const toastId = toast.loading("Preparing your checkout...");
        try {
            // Mageplaza KleverAPI Quick Order Checkout
            // Body structure exactly as requested: { "items": [ {"sku": "...", "qty": 1} ] }
            await api.post("/kleverapi/quick-order/checkout", {
                items: items.map(item => ({
                    sku: item.sku,
                    qty: item.qty
                }))
            });

            // Refresh the cart so the checkout page sees the new items
            await refetchCart();

            // Success: Clean up and redirect
            setItems([]);
            toast.success("Checkout initialized", { id: toastId });
            router.push("/checkout");
        } catch (err: any) {
            console.error("Checkout error:", err);
            toast.error(err || "Preparation failed, please try again.", { id: toastId });
        } finally {
        }
        setLoading(false);
    };

    const handleClearAll = async () => {
        if (items.length === 0) return;

        setLoading(true);
        const toastId = toast.loading("Clearing list...");
        try {
            // Mageplaza Quick Order Clear API
            const response = await api.delete("/kleverapi/quick-order/clear");

            // Success or already empty conditions
            if (response.success || response.message?.toLowerCase().includes("already empty")) {
                setItems([]);
                toast.success(response.message || "Quick order list cleared", { id: toastId });
            } else {
                toast.error(response.message || "Failed to clear list", { id: toastId });
            }
        } catch (err: any) {
            console.error("Clear list error:", err);
            toast.error(err || "Failed to clear list", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

    return (
        <div className="min-h-screen bg-white pb-32">
            <div className="max-w-[1400px] mx-auto px-4 lg:px-14">

                {/* Top Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <h1 className="text-[28px] md:text-[36px] font-black text-black uppercase tracking-[-0.04em]">Quick Order</h1>
                    <div className="flex gap-4">
                        <button
                            onClick={handleAddToCart}
                            disabled={loading}
                            className="h-[40px] px-6 bg-black text-white text-[11px] font-black uppercase tracking-[0.15em] rounded-sm hover:translate-y-[-2px] active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(0,0,0,0.1)]"
                        >
                            Add To Cart
                        </button>
                        <button
                            onClick={handleCheckout}
                            disabled={loading}
                            className="h-[40px] px-6 bg-black text-white text-[11px] font-black uppercase tracking-[0.15em] rounded-sm hover:translate-y-[-2px] active:scale-95 transition-all shadow-[0_4px_14px_rgba(0,0,0,0.1)]"
                        >
                            Checkout
                        </button>
                    </div>
                </div>

                {/* Instant Search Bar */}
                <div className="relative mb-14" ref={searchRef}>
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Instant Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-14 pl-6 pr-14 bg-white border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] rounded-sm text-[14px] font-medium focus:outline-none focus:border-yellow-400 focus:shadow-lg transition-all placeholder:text-gray-300"
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-yellow-400 transition-colors">
                            {isSearching ? <Loader2 size={24} className="animate-spin" /> : <Search size={20} />}
                        </div>
                    </div>

                    {/* Instant Search Dropdown */}
                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-gray-100 rounded-sm shadow-2xl z-[100] max-h-[480px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                            {searchResults.map((p) => (
                                <div
                                    key={p.sku}
                                    onClick={() => addItemToOrder(p)}
                                    className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 group select-none"
                                >
                                    <div className="w-14 h-14 bg-white border border-gray-50 rounded flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                                        {p.image_url ? <img src={p.image_url} alt={p.sku} className="w-12 h-12 object-contain" /> : <div className="w-12 h-12 bg-gray-50 rounded" />}
                                    </div>
                                    <div className="ml-5 flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-[13px] font-black text-black uppercase tracking-tight">{p.sku}</p>
                                            {p.item_code && p.item_code !== p.sku && (
                                                <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{p.item_code}</span>
                                            )}
                                            {p.is_in_stock === false && (
                                                <span className="text-[8px] font-black text-red-500 bg-red-50 px-1.5 py-0.5 rounded uppercase">Out of stock</span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-gray-400 font-medium truncate">{p.name}</p>
                                    </div>
                                    <div className="ml-6 flex-shrink-0">
                                        <span className="w-8 h-8 bg-[#f5b21a] text-black rounded flex items-center justify-center font-black text-[16px] hover:bg-black hover:text-white transition-all shadow-sm active:scale-90">+</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* No Results */}
                    {searchTerm.length >= 2 && !isSearching && searchResults.length === 0 && (
                        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-gray-100 rounded-sm shadow-xl z-[100] py-8 text-center">
                            <p className="text-[11px] font-black text-gray-300 uppercase tracking-widest">No products found</p>
                        </div>
                    )}
                </div>

                {/* Order Table Component */}
                <div className="bg-white border border-gray-100 rounded-sm shadow-[0_2px_15px_rgba(0,0,0,0.03)] overflow-hidden mb-20">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b-2 border-gray-50">
                                <th className="px-8 py-4 text-[12px] font-black text-black uppercase tracking-[0.2em] w-[45%]">Item(s)</th>
                                <th className="px-6 py-4 text-[12px] font-black text-black uppercase tracking-[0.2em] text-center">SKU(s)</th>
                                <th className="px-6 py-4 text-[12px] font-black text-black uppercase tracking-[0.2em] text-center">Qty</th>
                                <th className="px-8 py-4 text-[12px] font-black text-black uppercase tracking-[0.2em] text-right">ITEM(S) TOTAL:</th>
                                <th className="px-6 py-4 text-[12px] font-black text-black uppercase tracking-[0.2em] text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                <Plus size={24} className="text-gray-300" />
                                            </div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest max-w-[300px]">
                                                List is currently empty. Start adding items using search or SKU input below.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr key={item.sku} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-4">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-white rounded border border-gray-50 flex items-center justify-center mr-5 flex-shrink-0 group-hover:shadow-md transition-shadow">
                                                    {item.image ? <img src={item.image} alt={item.sku} className="w-8 h-8 object-contain" /> : <Loader2 size={12} className="text-gray-100" />}
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-700 leading-snug line-clamp-2">{item.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-[10px] font-black text-black uppercase tracking-tight">{item.sku}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.qty}
                                                    onChange={(e) => updateQty(item.sku, parseInt(e.target.value) || 1)}
                                                    className="w-14 h-10 border border-gray-100 text-center text-[10px] font-black text-black focus:outline-none focus:border-yellow-400 focus:bg-white bg-gray-50/50 transition-all rounded-sm"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <span className="text-[10px] font-black text-black">
                                                <Price amount={item.price * item.qty} />
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => removeOrderItem(item.sku)}
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90"
                                                title="Remove Item"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {items.length > 0 && (
                            <tfoot>
                                <tr className="bg-white border-t-2 border-gray-50">
                                    <td colSpan={3} className="px-8 py-6 text-right">
                                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Grand Total:</span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <span className="text-[18px] font-black text-black">
                                            <Price amount={totalAmount} />
                                        </span>
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>

                    <div className="px-8 py-5 bg-gray-50/50 flex flex-col sm:flex-row justify-end items-center gap-4">
                        <button
                            onClick={handleAddToCart}
                            disabled={loading}
                            className="w-full sm:w-auto h-[44px] px-8 bg-black text-white text-[11px] font-black uppercase tracking-[0.15em] rounded-sm hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-20 shadow-lg"
                        >
                            Add To Cart
                        </button>
                        <button
                            onClick={handleCheckout}
                            disabled={loading}
                            className="w-full sm:w-auto h-[44px] px-8 bg-black text-white text-[11px] font-black uppercase tracking-[0.15em] rounded-sm hover:-translate-y-1 active:scale-95 transition-all shadow-lg"
                        >
                            Checkout
                        </button>
                    </div>
                </div>

                {/* Section: ADD MULTIPLE PRODUCTS */}
                <h2 className="text-[22px] md:text-[28px] font-black text-black uppercase tracking-tight mb-10 border-l-[6px] border-yellow-400 pl-6">Add Multiple Products</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-20">

                    {/* Box: Enter multiple SKUs */}
                    <div className="bg-white border border-gray-100 rounded-sm shadow-[0_4px_25px_rgba(0,0,0,0.03)] p-10 flex flex-col group hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <Plus size={18} className="text-yellow-400" strokeWidth={3} />
                            <h3 className="text-[14px] font-black text-black uppercase tracking-widest">Enter multiple SKUs</h3>
                        </div>
                        <textarea
                            placeholder="Enter multiple SKUs, separate by new lines"
                            value={skuText}
                            onChange={(e) => setSkuText(e.target.value)}
                            className="w-full h-48 bg-gray-50/30 border border-gray-100 rounded-sm p-6 text-[13px] font-medium focus:outline-none focus:border-yellow-400 focus:bg-white transition-all mb-6 resize-none placeholder:text-gray-200"
                        />
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mt-auto">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1.5 rounded-full">Format: SKU,qty</p>
                            <button
                                onClick={handleAddMultipleSkus}
                                disabled={loading}
                                className="w-full sm:w-auto h-[40px] px-10 bg-black text-white text-[11px] font-black uppercase tracking-[0.15em] rounded-sm hover:translate-x-1 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group/btn"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : "Add to List"}
                                {!loading && <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />}
                            </button>
                        </div>
                    </div>

                    {/* Box: Add from file */}
                    <div className="bg-white border border-gray-100 rounded-sm shadow-[0_4px_25px_rgba(0,0,0,0.03)] p-10 flex flex-col group hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <Upload size={18} className="text-yellow-400" strokeWidth={3} />
                            <h3 className="text-[14px] font-black text-black uppercase tracking-widest">Add from file</h3>
                        </div>
                        <div className="flex-1 mb-8">
                            <div
                                className={`border-2 border-dashed rounded-sm h-[132px] flex flex-col items-center justify-center p-6 transition-all cursor-pointer relative ${file ? 'border-green-400 bg-green-50/10' : 'border-gray-100 bg-gray-50/30 hover:border-yellow-400 hover:bg-yellow-50/5'}`}
                                onClick={() => document.getElementById("fileInput")?.click()}
                            >
                                <input
                                    id="fileInput"
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                {file ? (
                                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mb-3 shadow-lg">
                                            <Check size={18} className="text-white" strokeWidth={3} />
                                        </div>
                                        <p className="text-[13px] font-black text-gray-800 text-center max-w-[200px] truncate">{file.name}</p>
                                        <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-[9px] font-black text-red-500 uppercase mt-2 hover:underline">Remove file</button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center animate-in fade-in duration-300">
                                        <Upload size={32} className="text-gray-200 mb-3 group-hover:text-yellow-400 transition-colors" />
                                        <p className="text-[12px] font-black text-gray-400 uppercase tracking-widest">Drop CSV or Click</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                            <button
                                onClick={handleDownloadSampleCsv}
                                disabled={loading}
                                className="text-[11px] font-black text-green-600 hover:text-green-700 flex items-center gap-2 transition-all group/dl disabled:opacity-50"
                            >
                                <FileDown size={18} className="group-hover/dl:translate-y-0.5 transition-transform" />
                                <span className="underline underline-offset-4 tracking-tight uppercase tracking-wider">Download Sample CSV</span>
                            </button>
                            <button
                                onClick={processFile}
                                disabled={loading}
                                className="w-full sm:w-auto h-[40px] px-10 bg-black text-white text-[11px] font-black uppercase tracking-[0.15em] rounded-sm hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <><Upload size={14} /> Upload Now</>}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center md:justify-end mb-20">
                    <button
                        onClick={handleClearAll}
                        disabled={loading}
                        className="flex items-center gap-3 text-[11px] font-black text-black uppercase tracking-[0.15em] hover:text-red-600 transition-all active:scale-95 disabled:opacity-50 group"
                    >
                        <div className="w-10 h-10 border border-black rounded-full flex items-center justify-center group-hover:border-red-600 transition-colors">
                            {loading ? <Loader2 size={18} className="animate-spin text-gray-300" /> : <X size={18} />}
                        </div>
                        {loading ? "Clearing..." : "Clear All List"}
                    </button>
                </div>

            </div>
        </div>
    );
}
