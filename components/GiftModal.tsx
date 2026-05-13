"use client";

import React, { useState } from "react";
import { X, Check } from "lucide-react";
import { GiftItem } from "@/modules/cart/context/GiftContext";

interface GiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectGifts: (selections: Record<string, number>) => void;
    maxGifts: number;
    availableGifts: GiftItem[];
}

const GiftModal: React.FC<GiftModalProps> = ({
    isOpen,
    onClose,
    onSelectGifts,
    maxGifts,
    availableGifts
}) => {
    const [selections, setSelections] = useState<Record<string, number>>({});

    if (!isOpen) return null;

    const totalSelected = Object.values(selections).reduce((a, b) => a + b, 0);
    const leftToSelect = maxGifts - totalSelected;

    const getGroupLimit = (groupName: string) => {
        if (groupName.includes("(2)")) return 2;
        if (groupName.includes("(1)")) return 1;
        return maxGifts;
    };

    const getGroupSelectedCount = (groupName: string) => {
        const groupItems = groups[groupName] || [];
        return groupItems.reduce((sum, item) => sum + (selections[item.id] || 0), 0);
    };

    const toggleSelection = (id: string, groupName: string) => {
        const current = selections[id] || 0;
        if (current > 0) {
            setSelections({ ...selections, [id]: 0 });
        } else {
            const groupLimit = getGroupLimit(groupName);
            const groupCount = getGroupSelectedCount(groupName);
            if (groupCount >= groupLimit) return;
            setSelections({ ...selections, [id]: 1 });
        }
    };

    const handleQtyChange = (id: string, delta: number, groupName: string) => {
        const current = selections[id] || 0;
        const next = Math.max(0, current + delta);

        if (delta > 0) {
            const groupLimit = getGroupLimit(groupName);
            const groupCount = getGroupSelectedCount(groupName);
            if (groupCount >= groupLimit) return;
        }

        setSelections({
            ...selections,
            [id]: next
        });
    };

    const handleConfirm = () => {
        onSelectGifts(selections);
        onClose();
    };

    // Group gifts by group_name
    const groups = availableGifts.reduce((acc, gift) => {
        if (!acc[gift.group_name]) acc[gift.group_name] = [];
        acc[gift.group_name].push(gift);
        return acc;
    }, {} as Record<string, GiftItem[]>);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="bg-primary px-6 py-3 flex items-center justify-between relative">
                    <h2 className="flex-1 text-center text-xl md:text-2xl font-black text-black uppercase tracking-tight">
                        Choose your free gift ( {leftToSelect} left )
                    </h2>
                    <button
                        onClick={onClose}
                        className="absolute right-6 p-2 hover:bg-black/10 rounded-full transition-colors"
                    >
                        <X size={24} className="text-black" />
                    </button>
                </div>

                {/* Table Layout */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-white z-10 border-b border-gray-100 shadow-sm">
                            <tr>
                                <th className="px-4 py-3 text-[10px] font-bold text-black uppercase tracking-widest text-center">Select</th>
                                <th className="px-3 py-3 text-[10px] font-bold text-black uppercase tracking-widest">Image</th>
                                <th className="px-3 py-3 text-[10px] font-bold text-black uppercase tracking-widest">Name</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-black uppercase tracking-widest text-center">Qty</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {Object.entries(groups).map(([groupName, items]) => {
                                const groupLimit = getGroupLimit(groupName);
                                const groupCount = getGroupSelectedCount(groupName);
                                const isGroupFull = groupCount >= groupLimit;

                                return (
                                    <React.Fragment key={groupName}>
                                        <tr className="bg-gray-100/80">
                                            <td colSpan={4} className="px-6 py-2">
                                                <span className="text-caption font-black text-black uppercase tracking-wider">
                                                    {groupName}
                                                </span>
                                            </td>
                                        </tr>
                                        {items.map((item) => {
                                            const qty = selections[item.id] || 0;
                                            const isSelected = qty > 0;
                                            const isMaxReached = isGroupFull && !isSelected;

                                            return (
                                                <tr key={item.id} className={`transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-gray-50'} ${isMaxReached ? 'opacity-60' : ''}`}>
                                                    <td className="px-4 py-4 text-center">
                                                        <div className="flex justify-center">
                                                            <button
                                                                onClick={() => toggleSelection(item.id, groupName)}
                                                                disabled={isMaxReached}
                                                                className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all ${isSelected ? 'bg-black border-black text-white' : 'border-gray-300'} ${isMaxReached ? 'cursor-not-allowed bg-gray-100' : 'cursor-pointer'}`}
                                                            >
                                                                {isSelected && <Check size={12} strokeWidth={4} />}
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-4">
                                                        <div className="w-14 h-14 bg-white border border-gray-100 rounded-lg p-1.5 shadow-sm flex items-center justify-center overflow-hidden">
                                                            <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain" />
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-body-sm font-bold text-black leading-tight mb-0.5">
                                                                {item.name}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">
                                                                SKU: {item.sku}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <div className="flex flex-col items-center gap-1.5">
                                                            <div className="flex items-center justify-center bg-gray-50 border border-gray-100 rounded-lg p-1 min-w-[3rem]">
                                                                <input
                                                                    type="text"
                                                                    value={qty}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value.replace(/\D/g, '');
                                                                        const num = parseInt(val) || 0;
                                                                        const current = selections[item.id] || 0;
                                                                        const groupLimit = getGroupLimit(groupName);
                                                                        const groupCount = getGroupSelectedCount(groupName);
                                                                        const delta = num - current;

                                                                        if (num > current && groupCount + delta > groupLimit) {
                                                                            const maxAllowed = groupLimit - (groupCount - current);
                                                                            setSelections({ ...selections, [item.id]: maxAllowed });
                                                                        } else {
                                                                            setSelections({ ...selections, [item.id]: num });
                                                                        }
                                                                    }}
                                                                    className="w-2 bg-transparent text-center text-body-sm font-black text-black outline-none border-none focus:ring-0"
                                                                    onFocus={(e) => {
                                                                        const target = e.target;
                                                                        setTimeout(() => target.select(), 0);
                                                                    }}
                                                                    onClick={(e) => (e.target as HTMLInputElement).select()}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter") {
                                                                            handleConfirm();
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                            <span className="text-micro font-bold text-black/40 uppercase tracking-widest whitespace-nowrap">
                                                                {item.qty_available} left
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>

                </div>

                {/* Footer */}
                <div className="bg-black p-6 flex justify-center border-t border-gray-100">
                    <button
                        onClick={handleConfirm}
                        disabled={totalSelected === 0}
                        className="bg-primary text-black px-12 py-3 rounded-md font-black text-caption uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100"
                    >
                        ADD TO CART
                    </button>
                </div>

            </div>
        </div>
    );
};

export default GiftModal;
