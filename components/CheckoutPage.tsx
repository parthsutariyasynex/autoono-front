"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Navbar from "@/app/components/Navbar";
import { useCart } from "@/modules/cart/hooks/useCart";
import { useCheckout, Address } from "@/modules/checkout/hooks/useCheckout";
import {
    Search,
    Plus,
    Edit2,
    ChevronDown,
    Upload,
    Truck,
    Warehouse,
    CreditCard,
    Check,
    MapPin,
    Phone,
    User,
    ShoppingBag,
    Loader2,
    ArrowLeft,
    Trash2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import Link from "next/link";
import SelectedAddressCard from "./SelectedAddressCard";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// --- Sub-components ---

const SectionHeader = ({ title, step }: { title: string; step?: number }) => (
    <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        {step && (
            <span className="w-6 h-6 rounded-full bg-black text-white text-[10px] font-black flex items-center justify-center">
                {step}
            </span>
        )}
        <h3 className="text-[14px] font-black text-black uppercase tracking-[0.2em]">
            {title}
        </h3>
    </div>
);

const CheckoutPageUI: React.FC = () => {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Hooks
    const { cart, isLoading: isCartLoading, updateCartItem } = useCart();
    const {
        addresses,
        shippingMethods,
        paymentMethods,
        totals,
        isLoading: isCheckoutLoading,
        isTotalsLoading,
        setShippingAddress,
        addAddress,
        placeOrder,
        savePoNumber,
        uploadPoFile,
        getPoUpload,
        deletePoFile,
        setShippingMethod,
        setShippingExtras,
        stores,
        refetchPickupStores,
        fetchPickupTimeSlots,
        getOrderComment,
        saveOrderComment,
    } = useCheckout();

    // --- State ---
    const [selectedAddressId, setSelectedAddressId] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");
    const [poNumber, setPoNumber] = useState("");
    const [shippingType, setShippingType] = useState<"delivery" | "pickup">("delivery");
    const [selectedWarehouse, setSelectedWarehouse] = useState("");
    const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
    const [selectedShippingMethodCode, setSelectedShippingMethodCode] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("checkmo");
    const [comment, setComment] = useState("");
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [isPoUploadOpen, setIsPoUploadOpen] = useState(false);
    const [uploadedPOs, setUploadedPOs] = useState<{ fileName: string }[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [isPaymentCommitmentOpen, setIsPaymentCommitmentOpen] = useState(false);
    const [isItemsListOpen, setIsItemsListOpen] = useState(true);
    const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
    const [paymentCommitmentFile, setPaymentCommitmentFile] = useState<File | null>(null);
    const [tempSelectedWarehouse, setTempSelectedWarehouse] = useState<{ id: string; name: string } | null>(null);

    // Pickup Form States
    const [isPickupFormOpen, setIsPickupFormOpen] = useState(false);
    const [pickupName, setPickupName] = useState("");
    const [pickupId, setPickupId] = useState("");
    const [pickupMobile, setPickupMobile] = useState("");
    const [pickupDate, setPickupDate] = useState<Date | null>(null);
    const [pickupTime, setPickupTime] = useState("");
    const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
    const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
    const [availableDates, setAvailableDates] = useState<Date[]>([]);
    const [availableTimeSlots, setAvailableTimeSlots] = useState<{ time: string; label: string; enabled: boolean }[]>([]);
    const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
    const timeRef = useRef<HTMLDivElement>(null);
    const dateRef = useRef<HTMLDivElement>(null);
    const datePickerRef = useRef<any>(null);

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (timeRef.current && !timeRef.current.contains(event.target as Node)) {
                setIsTimeDropdownOpen(false);
            }
            if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
                setIsDateDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Generate next 45 days
    useEffect(() => {
        const dates = [];
        for (let i = 0; i < 45; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            dates.push(date);
        }
        setAvailableDates(dates);

        // Auto-select today by default if nothing is selected
        if (!pickupDate && dates.length > 0) {
            setPickupDate(dates[0]);
        }
    }, [pickupDate]);
    // Fetch stores if pickup is selected
    useEffect(() => {
        if (shippingType === "pickup" && stores.length === 0) {
            refetchPickupStores();
        }
    }, [shippingType, stores.length, refetchPickupStores]);
    // Fetch dynamic time slots
    useEffect(() => {
        const getSlots = async () => {
            if (shippingType === "pickup" && selectedWarehouseId && pickupDate) {
                setIsLoadingTimeSlots(true);
                try {
                    const year = pickupDate.getFullYear();
                    const month = String(pickupDate.getMonth() + 1).padStart(2, '0');
                    const day = String(pickupDate.getDate()).padStart(2, '0');
                    const formattedDate = `${year}-${month}-${day}`;

                    let slots = await fetchPickupTimeSlots(selectedWarehouseId, formattedDate);

                    // If API returns empty or we want to ensure "this type proper" intervals as per user image
                    if (!slots || slots.length === 0) {
                        const generatedSlots = [];
                        for (let h = 0; h < 24; h++) {
                            for (let m = 0; m < 60; m += 30) {
                                let hh = h % 12;
                                if (hh === 0) hh = 12;
                                const ampm = h < 12 ? 'am' : 'pm';
                                const mm = m === 0 ? '00' : '30';
                                const h24 = String(h).padStart(2, '0');
                                const m24 = String(m).padStart(2, '0');
                                generatedSlots.push({
                                    time: `${h24}:${m24}`,
                                    label: `${hh}:${mm}${ampm}`,
                                    enabled: true
                                });
                            }
                        }
                        slots = generatedSlots;
                    }

                    setAvailableTimeSlots(slots);
                } catch (error) {
                    console.error("Failed to fetch time slots:", error);
                    toast.error("Failed to fetch available time slots");
                } finally {
                    setIsLoadingTimeSlots(false);
                }
            }
        };
        getSlots();
    }, [shippingType, selectedWarehouseId, pickupDate, fetchPickupTimeSlots]);

    // Reset selected time if it's not in the new slots or disabled
    useEffect(() => {
        const currentSlot = availableTimeSlots.find((s) => s.time === pickupTime);
        if (pickupTime && (!currentSlot || !currentSlot.enabled)) {
            setPickupTime("");
        }
    }, [availableTimeSlots, pickupTime]);

    // File inputs refs
    const poUploadRef = useRef<HTMLInputElement>(null);
    const paymentCommitmentRef = useRef<HTMLInputElement>(null);

    // Auth Guard
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login?callback=/checkout");
        }
    }, [status, router]);

    // Redirect if cart is empty
    useEffect(() => {
        if (!isCartLoading && cart && cart.items.length === 0) {
            toast.error("Your cart is empty. Please add items before checking out.");
            router.push("/cart");
        }
    }, [cart, isCartLoading, router]);

    // Defaults
    useEffect(() => {
        if (addresses.length > 0 && !selectedAddressId) {
            const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
            setSelectedAddressId(defaultAddr.id);
            setShippingAddress(defaultAddr.id).catch(() => { });
        }
    }, [addresses, selectedAddressId, setShippingAddress]);

    // Auto-select first available payment method if current one is invalid
    useEffect(() => {
        if (paymentMethods.length > 0) {
            const isValid = paymentMethods.some(m => m.code === paymentMethod);
            if (!isValid) {
                const creditMethod = paymentMethods.find(m => m.code === 'checkmo');
                setPaymentMethod(creditMethod ? creditMethod.code : paymentMethods[0].code);
            }
        }
    }, [paymentMethods, paymentMethod]);

    const handlePaymentCommitmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPaymentCommitmentFile(e.target.files[0]);
            toast.success("File selected successfully!");
        }
    };

    const removePaymentCommitment = () => {
        setPaymentCommitmentFile(null);
        if (paymentCommitmentRef.current) {
            paymentCommitmentRef.current.value = "";
        }
        toast.success("File removed");
    };

    // Auto-select shipping method when they become available or when type changes
    useEffect(() => {
        if (shippingMethods.length > 0) {
            const method = shippingMethods.find(m =>
                shippingType === "pickup" ? m.code.includes("pickup") : !m.code.includes("pickup")
            );

            // Validate current selection
            const currentSelectedMethod = shippingMethods.find(m => m.code === selectedShippingMethodCode);
            const isCorrectType = currentSelectedMethod ?
                (shippingType === "pickup" ? currentSelectedMethod.code.includes("pickup") : !currentSelectedMethod.code.includes("pickup")) :
                false;

            if (method && (!selectedShippingMethodCode || !isCorrectType)) {
                // Only sync if we have a valid cart with items and an address selected
                if (selectedAddressId && !isTotalsLoading && cart && cart.items.length > 0) {
                    console.log("DEBUG: Auto-selecting shipping method:", method.code, "for type:", shippingType);
                    // Set the code locally
                    setSelectedShippingMethodCode(method.code);

                    // Sync with backend
                    setShippingMethod(method.carrierCode, method.methodCode).catch(err => {
                        console.error("Auto-sync shipping method failed:", err);
                    });
                }
            }
        }
    }, [shippingMethods, shippingType, selectedShippingMethodCode, setShippingMethod, selectedAddressId, isTotalsLoading, cart]);

    // Fetch existing Order Comment
    useEffect(() => {
        const fetchExistingComment = async () => {
            try {
                const existingComment = await getOrderComment();
                if (existingComment) {
                    setComment(existingComment);
                }
            } catch (err) {
                console.error("Failed to fetch order comment:", err);
            }
        };

        if (status === "authenticated") {
            fetchExistingComment();
        }
    }, [status, getOrderComment]);

    // Fetch existing PO Upload
    useEffect(() => {
        const fetchPoUpload = async () => {
            try {
                const data = await getPoUpload();
                console.log("DEBUG: PO Upload Data:", data);

                // Handle common response formats
                let filesArray = [];
                if (Array.isArray(data)) {
                    filesArray = data;
                } else if (data && Array.isArray(data.files)) {
                    filesArray = data.files;
                } else if (data && Array.isArray(data.data)) {
                    filesArray = data.data;
                } else if (data && (data.fileName || data.filename || data.file)) {
                    filesArray = [data];
                }

                const normalized = filesArray.map((item: any) => {
                    if (typeof item === 'string') return { fileName: item };
                    return {
                        fileName: item.fileName || item.filename || item.file_name || item.name || item.file || "Unknown File"
                    };
                });

                setUploadedPOs(normalized);
            } catch (err) {
                console.error("Failed to fetch PO upload:", err);
            }
        };

        if (status === "authenticated") {
            fetchPoUpload();
        }
    }, [status, getPoUpload]);

    // Memoized filtered addresses
    const filteredAddresses = useMemo(() => {
        return addresses.filter(addr =>
            `${addr.firstname} ${addr.lastname} ${addr.street} ${addr.city}`
                .toLowerCase()
                .includes(searchQuery.toLowerCase())
        );
    }, [addresses, searchQuery]);

    // Handlers
    const handleAddressSelect = async (id: string) => {
        setSelectedAddressId(id);
        try {
            await setShippingAddress(id);
        } catch {
            toast.error("Failed to update shipping address");
        }
    };

    const handlePlaceOrder = async () => {
        // 0. Cart Validation
        if (!cart || cart.items.length === 0) {
            toast.error("Your cart is empty. Please add items before placing an order.");
            router.push("/cart");
            return;
        }

        // 1. Validations
        if (!selectedAddressId) {
            toast.error("Please select a shipping address");
            const element = document.getElementById('step-1');
            element?.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        if (!selectedShippingMethodCode) {
            toast.error("Please select a shipping method");
            const element = document.getElementById('step-3');
            element?.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        if (shippingType === "pickup") {
            if (!selectedWarehouseId) {
                toast.error("Please select a warehouse");
                return;
            }
            if (!pickupName || !pickupId || !pickupMobile || !pickupDate || !pickupTime) {
                toast.error("Please fill all pickup details");
                setIsPickupFormOpen(true);
                return;
            }
        }

        if (uploadedPOs.length > 0 && !poNumber) {
            toast.error("Please enter a PO Number as you have uploaded a file.");
            const element = document.getElementById('step-2');
            element?.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        setIsPlacingOrder(true);
        try {
            // 2. Call Shipping Extras if Pickup
            if (shippingType === "pickup") {
                const year = pickupDate!.getFullYear();
                const month = String(pickupDate!.getMonth() + 1).padStart(2, '0');
                const day = String(pickupDate!.getDate()).padStart(2, '0');
                const formattedDate = `${year}-${month}-${day}`;

                await setShippingExtras({
                    pickupPersonName: pickupName,
                    pickupPersonId: pickupId,
                    pickupMobileNumber: pickupMobile,
                    pickupDate: formattedDate,
                    pickupTime: pickupTime,
                    pickupStore: selectedWarehouseId
                });
            }

            // 3. Save Order Comment
            if (comment) {
                await saveOrderComment(comment);
            }

            // 4. Call Place Order
            const result = await placeOrder({
                address_id: Number(selectedAddressId),
                shipping_method: selectedShippingMethodCode,
                payment_method: paymentMethod,
                cart_id: cart?.cart_id,
                po_number: poNumber,
                comment: comment // Pass it just in case backend expects it here too
            });

            // 4. Handle Success
            toast.success("Order placed successfully!");

            // Store technical order details for success page
            const orderSummary = {
                order_id: result.order_id,
                order_increment_id: result.order_increment_id,
                grand_total: result.grand_total,
                currency_code: result.currency_code,
                status: result.status
            };

            localStorage.setItem('last_order_summary', JSON.stringify(orderSummary));

            router.push(`/checkout/success?order_id=${result.order_id}`);
        } catch (error: any) {
            console.error("Place Order Error:", error);
            toast.error(error.message || "Failed to place order. Please try again.");
        } finally {
            setIsPlacingOrder(false);
        }
    };

    const handlePoNumberBlur = async () => {
        if (!poNumber) return;
        try {
            await savePoNumber(poNumber);
            toast.success("PO Number saved");
        } catch (error: any) {
            toast.error(error.message || "Failed to save PO number");
        }
    };

    const handleCommentBlur = async () => {
        if (!comment) return;
        try {
            await saveOrderComment(comment);
            toast.success("Order comment saved");
        } catch (error: any) {
            toast.error(error.message || "Failed to save order comment");
        }
    };

    const ALLOWED_TYPES = [
        "image/jpeg", "image/png", "application/zip", "application/x-rar-compressed",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword", "application/pdf", "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv", "application/vnd.ms-outlook"
    ];

    const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".zip", ".rar", ".docx", ".doc", ".pdf", ".xls", ".xlsx", ".csv", ".msg"];

    const validateFile = (file: File) => {
        const extension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(extension)) {
            toast.error(`Invalid file type: ${file.name}. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`);
            return false;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error(`File too large: ${file.name}. Max size 5MB.`);
            return false;
        }
        return true;
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
        let files: File[] = [];
        if ("files" in e.target && e.target.files) {
            files = Array.from(e.target.files);
        } else if ("dataTransfer" in e && e.dataTransfer.files) {
            files = Array.from(e.dataTransfer.files);
        }

        if (files.length === 0) return;

        const validFiles = files.filter(validateFile);
        if (validFiles.length === 0) return;

        setIsUploading(true);
        try {
            for (const file of validFiles) {
                // Check for duplicates in UI
                if (uploadedPOs.some(p => p.fileName === file.name)) {
                    toast.error(`File already uploaded: ${file.name}`);
                    continue;
                }

                const formData = new FormData();
                formData.append("file", file);
                formData.append("type", "po");

                await uploadPoFile(formData);
                setUploadedPOs(prev => [...prev, { fileName: file.name }]);
                toast.success(`Uploaded: ${file.name}`);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to upload file(s)");
        } finally {
            setIsUploading(false);
            if (poUploadRef.current) poUploadRef.current.value = "";
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        handleFileUpload(e);
    };

    const handleDeletePo = async (fileName: string) => {
        try {
            setIsUploading(true);
            await deletePoFile(fileName);
            setUploadedPOs(prev => prev.filter(p => p.fileName !== fileName));
            toast.success("File removed successfully");
        } catch (error: any) {
            toast.error(error.message || "Failed to remove file");
        } finally {
            setIsUploading(false);
        }
    };

    const handleShippingMethodSelect = async (code: string) => {
        const method = shippingMethods.find(m => m.code === code);
        if (!method) return;

        setSelectedShippingMethodCode(code);
        try {
            await setShippingMethod(method.carrierCode, method.methodCode);
        } catch (error: any) {
            toast.error(error.message || "Failed to update shipping method");
        }
    };
    if (isCartLoading || status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f9f9f9]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-[#F5B21B] rounded-full animate-spin" />
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest italic">Preparing Checkout...</p>
                </div>
            </div>
        );
    }

    if (isCartLoading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
                <Loader2 size={48} className="text-[#F5B21B] animate-spin mb-4" />
                <p className="text-[12px] font-black uppercase tracking-widest text-gray-500">Loading your cart...</p>
            </div>
        );
    }

    if (!cart || cart.items.length === 0) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="max-w-7xl mx-auto py-24 px-6 text-center">
                    <ShoppingBag size={64} className="mx-auto text-gray-200 mb-6" />
                    <h1 className="text-2xl font-black text-black uppercase tracking-widest mb-4">Your cart is empty</h1>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">Redirecting you to products...</p>
                    <Link href="/products" className="inline-flex items-center gap-2 bg-[#F5B21B] text-black font-black px-8 py-4 text-[12px] uppercase tracking-widest hover:bg-black hover:text-white transition-all">
                        Browse Products
                    </Link>
                </div>
            </div>
        );
    }

    const displayTotals = {
        subtotal: totals?.subtotal ?? cart.subtotal,
        tax_amount: totals?.tax_amount ?? cart.tax_amount,
        shipping_amount: totals?.shipping_amount ?? 0,
        grand_total: totals?.grand_total ?? cart.grand_total,
    };

    return (
        <div className="bg-[#F8F9FA] min-h-screen font-sans">
            <Navbar />

            <main className="max-w-7xl mx-auto py-10 px-4 lg:px-6">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-8">
                    <Link href="/cart" className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors text-[11px] font-black uppercase tracking-widest">
                        <ArrowLeft size={16} /> Back to Cart
                    </Link>
                    <h1 className="text-2xl font-black text-black uppercase tracking-[0.2em]">Checkout</h1>
                    <div className="w-24"></div> {/* Spacer */}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* ═══════════ Left Column ═══════════ */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* 1. Shipping Address */}
                        <div className="bg-white border border-gray-200 shadow-sm rounded-sm">
                            <SectionHeader title="Shipping Address" step={1} />
                            <div className="p-4">
                                {/* Search */}
                                <div className="mb-4">
                                    <input
                                        type="text"
                                        placeholder="Search Address"
                                        className="w-full px-4 py-2 bg-white border border-gray-200 outline-none text-[14px] transition-all placeholder:text-gray-400 focus:border-[#F5B21B]"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                {/* Address List Container */}
                                <div className="max-h-[460px] overflow-y-auto pr-1 card-scrollbar space-y-4">
                                    {filteredAddresses.map((addr) => (
                                        selectedAddressId === addr.id ? (
                                            <SelectedAddressCard
                                                key={addr.id}
                                                address={addr}
                                                onEdit={() => {
                                                    router.push(`/customer/address-book/edit/${addr.id}?redirect=/checkout`);
                                                }}
                                            />
                                        ) : (
                                            <div
                                                key={addr.id}
                                                className="relative flex items-start gap-4 cursor-pointer group p-5 border border-gray-100 bg-gray-50/30 hover:border-gray-300 hover:bg-white transition-all duration-300 rounded-sm"
                                                onClick={() => handleAddressSelect(addr.id)}
                                            >
                                                {/* Selection Indicator */}
                                                <div className="relative flex-shrink-0 mt-1">
                                                    <div className="w-6 h-6 rounded-full border-2 border-gray-300 group-hover:border-gray-400 flex items-center justify-center transition-all duration-300">
                                                    </div>
                                                </div>

                                                {/* Details */}
                                                <div className="flex-1 min-w-0">

                                                    <div className="text-[13px] text-gray-600 leading-relaxed mb-4">
                                                        <p className="font-medium text-[14px] text-black">
                                                            <span className="font-black">{addr.firstname} {addr.lastname}</span>{" "}
                                                            {addr.street} {addr.city}, {addr.postcode}{" "}
                                                            {addr.country_id === 'SA' ? 'Saudi Arabia' : addr.country_id} {addr.telephone}
                                                            {[
                                                                addr.custom_attributes?.find(ca => ca.attribute_code === 'store_view')?.value,
                                                                addr.custom_attributes?.find(ca => ca.attribute_code === 'region_ship_to_party')?.value
                                                            ].filter(Boolean).map(val => ` ${val}`).join("")}
                                                        </p>
                                                    </div>

                                                    <div className="flex gap-3 pt-2">
                                                        <button
                                                            className="text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2.5 transition-all duration-300 border bg-white text-black border-gray-200 hover:bg-black hover:text-white hover:border-black"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAddressSelect(addr.id);
                                                            }}
                                                        >
                                                            Ship Here
                                                        </button>
                                                        <button
                                                            className="text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2.5 bg-white text-gray-400 border border-gray-100 hover:bg-gray-50 hover:text-black hover:border-gray-300 transition-all duration-300"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/customer/address-book/edit/${addr.id}?redirect=/checkout`);
                                                            }}
                                                        >
                                                            Edit Address
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    ))}

                                    {filteredAddresses.length === 0 && (
                                        <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-sm">
                                            <p className="text-gray-400 text-[11px] font-black uppercase tracking-widest">No matching addresses found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 2. Customer PO Number */}
                        <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden">
                            <SectionHeader title="Customer PO Number" step={2} />
                            <div className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">PO Number</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 outline-none text-[14px] font-medium transition-all placeholder:text-gray-300 focus:bg-white focus:border-black"
                                        value={poNumber}
                                        onChange={(e) => setPoNumber(e.target.value)}
                                        onBlur={handlePoNumberBlur}
                                        placeholder="Enter your Purchase Order number"
                                    />
                                    {uploadedPOs.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {/* We will hide these as they are now shown in the Upload PO section as per image */}
                                        </div>
                                    )}
                                </div>

                                <div className="border border-gray-200 rounded-sm mx-6 mb-6 overflow-hidden">
                                    <div
                                        className="bg-gray-50 px-5 py-3 flex items-center justify-between border-b border-gray-200 cursor-pointer hover:bg-white transition-colors"
                                        onClick={() => setIsPoUploadOpen(!isPoUploadOpen)}
                                    >
                                        <span className="text-[14px] font-bold text-black capitalize">Upload PO</span>
                                        <ChevronDown
                                            size={18}
                                            className={`text-gray-400 transition-transform duration-300 ${isPoUploadOpen ? "rotate-180" : ""}`}
                                        />
                                    </div>
                                    {isPoUploadOpen && (
                                        <div className="p-4 bg-white space-y-4">
                                            {/* Drop Area */}
                                            <div
                                                className={`w-full py-8 border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${isUploading
                                                    ? "border-gray-100 opacity-50 cursor-wait"
                                                    : dragActive
                                                        ? "border-black bg-gray-50"
                                                        : "border-gray-400 bg-white"
                                                    }`}
                                                onClick={() => !isUploading && poUploadRef.current?.click()}
                                                onDragEnter={handleDrag}
                                                onDragLeave={handleDrag}
                                                onDragOver={handleDrag}
                                                onDrop={handleDrop}
                                            >
                                                <p className="text-[18px] text-black font-medium mb-4">Drop files here</p>
                                                <p className="text-[14px] text-black">
                                                    Allowed file types : <span className="text-gray-800">jpg,jpeg,png,zip,rar,docx,doc,pdf,xls,xlsx,csv,msg</span>
                                                </p>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    ref={poUploadRef}
                                                    onChange={handleFileUpload}
                                                    accept=".jpg,.jpeg,.png,.zip,.rar,.docx,.doc,.pdf,.xls,.xlsx,.csv,.msg"
                                                    multiple
                                                />
                                            </div>

                                            {/* Files List - Image Style */}
                                            <div className="flex flex-wrap gap-x-4 gap-y-3">
                                                {uploadedPOs.map((file, idx) => (
                                                    <div key={idx} className="flex items-stretch border border-dashed border-black rounded-sm overflow-hidden">
                                                        <div className="px-3 py-2 text-[14px] text-black font-medium flex items-center">
                                                            {file?.fileName && file.fileName.length > 30
                                                                ? file.fileName.substring(0, 20) + '...'
                                                                : file?.fileName || "Unknown File"}
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeletePo(file.fileName);
                                                            }}
                                                            disabled={isUploading}
                                                            className="bg-[#D12E3D] text-white px-3 py-2 text-[14px] font-bold hover:bg-black transition-colors"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 3. Order Comment */}
                        <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden">
                            <SectionHeader title="Order Comment" step={3} />
                            <div className="p-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Additional Information</label>
                                    <textarea
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 outline-none text-[14px] font-medium transition-all placeholder:text-gray-300 focus:bg-white focus:border-black min-h-[100px] resize-none"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        onBlur={handleCommentBlur}
                                        placeholder="Add any special instructions or comments for your order..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 4. Shipping Methods */}
                        <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden">
                            <div className="bg-[#F2F2F2] px-6 py-4 border-b border-gray-200" id="step-3">
                                <h3 className="text-[14px] font-black text-[#333] uppercase tracking-wider">
                                    SHIPPING METHODS
                                </h3>
                            </div>
                            <div className="p-6">
                                <div className="space-y-6">
                                    {/* Delivery Option */}
                                    <div
                                        className="flex items-center gap-4 cursor-pointer group"
                                        onClick={() => setShippingType("delivery")}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${shippingType === "delivery" ? "border-black" : "border-gray-400 group-hover:border-gray-600"}`}>
                                            {shippingType === "delivery" && (
                                                <div className="w-2.5 h-2.5 bg-black rounded-full" />
                                            )}
                                        </div>
                                        <span className={`text-[15px] font-bold transition-colors ${shippingType === "delivery" ? "text-black" : "text-[#555]"}`}>
                                            Delivery
                                        </span>
                                    </div>

                                    <div className="border-t border-dashed border-gray-300 w-full" />

                                    {/* Pickup Option */}
                                    <div className="space-y-5">
                                        <div
                                            className="flex items-center gap-4 cursor-pointer group"
                                            onClick={() => setShippingType("pickup")}
                                        >
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${shippingType === "pickup" ? "border-black" : "border-gray-400 group-hover:border-gray-600"}`}>
                                                {shippingType === "pickup" && (
                                                    <div className="w-2.5 h-2.5 bg-black rounded-full" />
                                                )}
                                            </div>
                                            <span className={`text-[15px] font-bold transition-colors ${shippingType === "pickup" ? "text-black" : "text-[#555]"}`}>
                                                Pickup from Warehouse
                                            </span>
                                        </div>

                                        {shippingType === "pickup" && (
                                            <div className="ml-9 space-y-4">
                                                <div className="flex flex-col items-start gap-4">
                                                    <button
                                                        className="bg-[#F5B21B] text-black px-8 py-3 text-[12px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all active:scale-95 border border-transparent shadow-sm"
                                                        onClick={() => {
                                                            setIsWarehouseModalOpen(true);
                                                            setIsPickupFormOpen(!isPickupFormOpen);
                                                        }}
                                                    >
                                                        SELECT WAREHOUSE
                                                    </button>

                                                    {selectedWarehouse && (
                                                        <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-sm">
                                                            <span className="text-[12px] font-bold text-gray-800 uppercase tracking-widest">
                                                                Selected: <span className="text-black">{selectedWarehouse}</span>
                                                            </span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setIsWarehouseModalOpen(true);
                                                                }}
                                                                className="text-[10px] text-blue-600 font-bold hover:underline"
                                                            >
                                                                Change
                                                            </button>
                                                            <div className="w-px h-3 bg-gray-300 mx-1" />
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setIsPickupFormOpen(!isPickupFormOpen);
                                                                }}
                                                                className="text-[10px] text-black font-bold hover:underline"
                                                            >
                                                                {isPickupFormOpen ? "Hide" : "Edit"} Details
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Pickup Details Form */}
                                                {isPickupFormOpen && (
                                                    <div className="p-6 bg-[#F8F9FA] border border-gray-200 rounded-sm space-y-4 animate-in slide-in-from-top-2 duration-300">
                                                        {/* Row 1: Name & ID */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="flex items-center gap-3">
                                                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap min-w-[110px]">Person Name *</label>
                                                                <input
                                                                    type="text"
                                                                    value={pickupName}
                                                                    onChange={(e) => setPickupName(e.target.value)}
                                                                    className="flex-1 px-4 py-2 bg-white border border-gray-300 outline-none text-[14px] font-medium transition-all focus:border-black hover:border-gray-400 h-10"
                                                                    placeholder="Enter Name"
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap min-w-[90px] md:min-w-[80px]">Person ID *</label>
                                                                <input
                                                                    type="text"
                                                                    value={pickupId}
                                                                    onChange={(e) => setPickupId(e.target.value)}
                                                                    className="flex-1 px-4 py-2 bg-white border border-gray-300 outline-none text-[14px] font-medium transition-all focus:border-black hover:border-gray-400 h-10"
                                                                    placeholder="Enter ID"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Row 2: Mobile Number */}
                                                        <div className="flex items-center gap-3">
                                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap min-w-[110px]">Mobile Number *</label>
                                                            <input
                                                                type="tel"
                                                                value={pickupMobile}
                                                                onChange={(e) => setPickupMobile(e.target.value)}
                                                                className="flex-1 px-4 py-2 bg-white border border-gray-300 outline-none text-[14px] font-medium transition-all focus:border-black hover:border-gray-400 h-10"
                                                                placeholder="Enter Mobile Number"
                                                            />
                                                        </div>

                                                        {/* Row 3: Date & Time */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {/* Calendar Date Picker */}
                                                            <div className="flex items-center gap-3">
                                                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap min-w-[110px]">Pick Up Date *</label>
                                                                <div className="relative flex-1 pickup-datepicker">
                                                                    <DatePicker
                                                                        ref={datePickerRef}
                                                                        selected={pickupDate}
                                                                        onChange={(date: Date | null) => {
                                                                            if (date) setPickupDate(date);
                                                                        }}
                                                                        minDate={new Date()}
                                                                        dateFormat="MM/dd/yyyy"
                                                                        placeholderText="Select Date"
                                                                        className="w-full h-10 px-4 py-2 bg-white border border-gray-300 outline-none text-[14px] font-medium transition-all cursor-pointer hover:border-gray-400 focus:border-black"
                                                                        calendarClassName="retro-datepicker"
                                                                        showPopperArrow={false}
                                                                        popperPlacement="bottom-start"
                                                                        renderCustomHeader={({
                                                                            date,
                                                                            decreaseMonth,
                                                                            increaseMonth,
                                                                            prevMonthButtonDisabled,
                                                                            nextMonthButtonDisabled,
                                                                        }) => (
                                                                            <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-gray-100">
                                                                                <button
                                                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); decreaseMonth(); }}
                                                                                    disabled={prevMonthButtonDisabled}
                                                                                    type="button"
                                                                                    className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors ${prevMonthButtonDisabled ? "opacity-30 cursor-not-allowed" : "text-black"}`}
                                                                                >
                                                                                    <ChevronLeft size={18} />
                                                                                </button>
                                                                                <span className="text-[13px] font-black uppercase tracking-widest text-black">
                                                                                    {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                                                                </span>
                                                                                <button
                                                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); increaseMonth(); }}
                                                                                    disabled={nextMonthButtonDisabled}
                                                                                    type="button"
                                                                                    className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors ${nextMonthButtonDisabled ? "opacity-30 cursor-not-allowed" : "text-black"}`}
                                                                                >
                                                                                    <ChevronRight size={18} />
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Scrollable Time Picker */}
                                                            <div className="flex items-center gap-3">
                                                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap min-w-[90px] md:min-w-[80px]">Pick Up Time *</label>
                                                                <div className="relative flex-1">
                                                                    {isLoadingTimeSlots ? (
                                                                        <div className="w-full h-10 px-4 py-2 bg-white border border-gray-300 flex items-center gap-2">
                                                                            <Loader2 size={14} className="animate-spin text-gray-400" />
                                                                            <span className="text-[12px] text-gray-400">Loading...</span>
                                                                        </div>
                                                                    ) : (
                                                                        <select
                                                                            value={pickupTime}
                                                                            onChange={(e) => setPickupTime(e.target.value)}
                                                                            className="w-full h-10 px-4 py-2 bg-white border border-gray-300 outline-none text-[13px] font-medium transition-all cursor-pointer hover:border-gray-400 focus:border-black appearance-none"
                                                                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                                                                            size={1}
                                                                        >
                                                                            <option value="">Select Time</option>
                                                                            {availableTimeSlots.map((slot: any) => (
                                                                                <option key={slot.time} value={slot.time} disabled={!slot.enabled}>
                                                                                    {slot.label}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Payment Method */}
                        <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden">
                            {/* Header exactly as per image */}
                            <div className="bg-[#f2f2f2] px-6 py-4 border-b border-gray-200">
                                <h3 className="text-[14px] font-black text-black uppercase tracking-wider">
                                    PAYMENT METHOD
                                </h3>
                            </div>

                            <div className="p-6">
                                <p className="text-[16px] font-bold text-black mb-6">Credit Account</p>

                                <div className="border border-gray-100 rounded-sm overflow-hidden">
                                    {/* Collapsible Header */}
                                    <div
                                        className="bg-[#f8f8f8] px-5 py-4 flex items-center justify-between border-b border-gray-100 cursor-pointer group hover:bg-[#f2f2f2] transition-colors"
                                        onClick={() => setIsPaymentCommitmentOpen(!isPaymentCommitmentOpen)}
                                    >
                                        <span className="text-[14px] font-bold text-black">Payment Commitment Upload</span>
                                        <ChevronDown
                                            size={20}
                                            className={`text-gray-500 transition-transform duration-300 ${isPaymentCommitmentOpen ? "rotate-180" : ""}`}
                                        />
                                    </div>

                                    {/* Collapsible Content */}
                                    {isPaymentCommitmentOpen && (
                                        <div className="p-6 bg-white animate-in slide-in-from-top-2 duration-300">
                                            {/* Dropzone with border and info as per image */}
                                            <div
                                                className={`w-full py-10 border-2 border-dashed border-gray-300 bg-gray-50/50 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:border-black hover:bg-white rounded-sm mb-6 ${dragActive ? "border-black bg-white" : ""}`}
                                                onClick={() => paymentCommitmentRef.current?.click()}
                                                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                                                onDragLeave={() => setDragActive(false)}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    setDragActive(false);
                                                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                                        setPaymentCommitmentFile(e.dataTransfer.files[0]);
                                                        toast.success("File dropped successfully!");
                                                    }
                                                }}
                                            >
                                                <div className="text-center px-6">
                                                    <p className="text-[20px] text-black font-bold mb-3 tracking-tight">Drop files here</p>
                                                    <p className="text-[14px] text-black/80 font-medium">
                                                        Allowed file types : jpg,jpeg,png,zip,rar,docx,doc,pdf,xls,xlsx,csv,msg
                                                    </p>
                                                </div>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    ref={paymentCommitmentRef}
                                                    onChange={handlePaymentCommitmentChange}
                                                    accept=".jpg,.jpeg,.png,.zip,.rar,.docx,.doc,.pdf,.xls,.xlsx,.csv,.msg"
                                                />
                                            </div>

                                            {/* File List */}
                                            {paymentCommitmentFile && (
                                                <div className="flex items-center">
                                                    <div className="flex border border-dashed border-black rounded-sm overflow-hidden group shadow-sm">
                                                        <div className="px-4 py-2 bg-white flex items-center min-w-[300px]">
                                                            <span className="text-[13px] font-bold text-black truncate max-w-[280px]">
                                                                {paymentCommitmentFile.name}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={removePaymentCommitment}
                                                            className="bg-[#d93a40] text-white px-5 py-2 text-[12px] font-bold uppercase transition-colors hover:bg-black"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ═══════════ Right Column (Order Summary) ═══════════ */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white border border-gray-200 shadow-sm rounded-sm sticky top-24 overflow-hidden">
                            {/* Header */}
                            <div className="bg-[#f2f2f2] px-6 py-4 flex items-center gap-3 border-b border-gray-200">
                                <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center">
                                    <Check size={12} className="text-white" />
                                </div>
                                <h3 className="text-[14px] font-black text-black text-center uppercase tracking-wider">
                                    Order Summary
                                </h3>
                            </div>

                            <div className="p-0">
                                {/* Collapsible Item Count Header */}
                                <div
                                    className="px-6 py-4 flex items-center justify-between border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => setIsItemsListOpen(!isItemsListOpen)}
                                >
                                    <span className="text-[15px] font-black text-black">
                                        {cart?.items_count || 0} Items in Cart
                                    </span>
                                    <ChevronDown
                                        size={20}
                                        className={`text-black transition-transform duration-300 ${isItemsListOpen ? "rotate-180" : ""}`}
                                    />
                                </div>

                                {/* Collapsible Product List */}
                                <div
                                    className={`overflow-hidden transition-all duration-500 ease-in-out ${isItemsListOpen ? "max-height-none border-b border-gray-100" : "max-h-0"}`}
                                    style={{ maxHeight: isItemsListOpen ? "1000px" : "0" }}
                                >
                                    <div className="space-y-6 p-6">
                                        {cart?.items?.map((item) => (
                                            <div key={item.item_id} className="flex gap-4 items-start pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                                                <div className="w-20 h-20 flex-shrink-0 border border-gray-100 rounded-sm overflow-hidden">
                                                    <img
                                                        src={item.image_url || "/images/tyre-sample.png"}
                                                        alt={item.name}
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0 pt-1">
                                                    <h4 className="text-[14px] font-bold text-black leading-tight mb-2">
                                                        {item.name}
                                                    </h4>
                                                    <div className="flex items-center gap-1 mb-2 text-[14px]">
                                                        <span className="font-bold text-black">Qty :</span>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={item.qty}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value);
                                                                if (val > 0) updateCartItem(item.item_id, val);
                                                            }}
                                                            className="w-12 h-8 border border-gray-300 text-center text-[13px] font-bold focus:outline-none focus:border-black ml-1"
                                                        />
                                                    </div>
                                                    <div className="text-[15px] font-black text-black">
                                                        ﷼ {item.row_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Totals Section */}
                                <div className="p-6 space-y-4">
                                    <div className="flex justify-between items-center text-[15px]">
                                        <span className="text-black font-medium">Subtotal</span>
                                        <span className="font-black text-black">
                                            ﷼ {displayTotals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center text-[15px]">
                                        <span className="text-black font-medium">VAT (15%)</span>
                                        <span className="font-black text-black">
                                            ﷼ {displayTotals.tax_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>

                                    <div className="pt-4 border-t border-gray-200">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[18px] font-black text-black">Grand Total</span>
                                            <span className="text-[20px] font-black text-black">
                                                ﷼ {displayTotals.grand_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Comment */}
                                <div className="p-6 pt-0">
                                    <div className="bg-[#f8f8f8] p-4 rounded-sm border border-gray-100">
                                        <textarea
                                            placeholder="Enter your comment..."
                                            rows={4}
                                            className="w-full p-4 border border-gray-200 bg-white focus:border-gray-400 outline-none text-[14px] font-medium resize-none transition-all"
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Place Order Button */}
                                <div className="px-6 pb-6">
                                    <button
                                        onClick={handlePlaceOrder}
                                        disabled={isPlacingOrder || isTotalsLoading}
                                        className={`w-full py-5 text-[18px] font-black uppercase tracking-tight transition-all duration-300 flex items-center justify-center gap-3 rounded-sm shadow-sm ${isPlacingOrder
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                            : "bg-[#F5B21B] text-black hover:bg-black hover:text-white"
                                            }`}
                                    >
                                        {isPlacingOrder ? (
                                            <>
                                                <Loader2 size={20} className="animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            "Place Order"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Warehouse Selection Modal */}
            {isWarehouseModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-200">
                        {/* Modal Header */}
                        <div className="bg-black py-4 px-6 flex justify-end items-center">
                            <button
                                onClick={() => setIsWarehouseModalOpen(false)}
                                className="text-white hover:text-[#F5B21B] transition-colors"
                            >
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 max-h-[70vh] overflow-y-auto space-y-4 bg-gray-50/30">
                            {stores.length > 0 ? (
                                stores.map((wh) => (
                                    <div
                                        key={wh.id}
                                        className={`p-6 border transition-all cursor-pointer bg-white group ${tempSelectedWarehouse?.id === wh.id ? "border-black ring-1 ring-black shadow-md" : "border-gray-200 hover:border-gray-400"}`}
                                        onClick={() => setTempSelectedWarehouse({ id: wh.id, name: wh.name })}
                                    >
                                        <h4 className="text-[16px] font-black text-black uppercase mb-3 tracking-wide">{wh.name}</h4>
                                        <div className="space-y-1 text-[13px]">
                                            <p className="flex items-start gap-2">
                                                <span className="font-bold text-black min-w-[80px]">Address:</span>
                                                <span className="text-gray-700">{wh.address}</span>
                                            </p>
                                            <p className="flex items-start gap-2">
                                                <span className="font-bold text-black min-w-[80px]">E-Mail:</span>
                                                <a href={`mailto:${wh.email}`} className="text-[#3b82f6] hover:underline" onClick={(e) => e.stopPropagation()}>{wh.email}</a>
                                            </p>
                                            <p className="flex items-start gap-2">
                                                <span className="font-bold text-black min-w-[80px]">GPS Location:</span>
                                                <a href={wh.gps_location} target="_blank" rel="noopener noreferrer" className="text-[#3b82f6] hover:underline flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                    {wh.gps_location.startsWith('http') ? wh.gps_location.replace('https://', '').replace('http://', '') : 'View on Maps'}
                                                </a>
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <Loader2 className="animate-spin mx-auto text-[#F5B21B] mb-4" size={32} />
                                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[12px]">Fetching Pickup Locations...</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-white">
                            <button
                                className={`px-10 py-3 text-[13px] font-black uppercase tracking-widest transition-all ${tempSelectedWarehouse ? "bg-[#F5B21B] text-black hover:bg-black hover:text-white shadow-md" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                                onClick={() => {
                                    if (tempSelectedWarehouse) {
                                        setSelectedWarehouse(tempSelectedWarehouse.name);
                                        setSelectedWarehouseId(tempSelectedWarehouse.id);
                                        setIsWarehouseModalOpen(false);
                                        setIsPickupFormOpen(true);
                                        toast.success(`Selected: ${tempSelectedWarehouse.name}`);
                                    }
                                }}
                                disabled={!tempSelectedWarehouse}
                            >
                                PICK UP HERE!
                            </button>
                            <button
                                className="px-10 py-3 bg-black text-white text-[13px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-md"
                                onClick={() => setIsWarehouseModalOpen(false)}
                            >
                                CLOSE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckoutPageUI;
