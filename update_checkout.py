import re
import sys

with open("/home/parth/Desktop/altalayi-front/components/CheckoutPage.tsx", "r") as f:
    text = f.read()

# 1. Imports
text = text.replace('    Calendar,\n    Clock,\n    ExternalLink,\n', '')

# 2. States
old_states = """    const [pickupDate, setPickupDate] = useState<Date | null>(null);
    const [pickupTime, setPickupTime] = useState("");
    const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
    const [availableTimeSlots, setAvailableTimeSlots] = useState<{ time: string; label: string; enabled: boolean }[]>([]);
    const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
    const timeRef = useRef<HTMLDivElement>(null);
    const selectedStore = useMemo(() => {
        return stores.find(s => s.id === selectedWarehouseId);
    }, [stores, selectedWarehouseId]);
    const datePickerRef = useRef<any>(null);"""

new_states = """    const [pickupDate, setPickupDate] = useState<Date | null>(null);
    const [pickupTime, setPickupTime] = useState("");
    const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
    const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
    const [availableDates, setAvailableDates] = useState<Date[]>([]);
    const [availableTimeSlots, setAvailableTimeSlots] = useState<{ time: string; label: string; enabled: boolean }[]>([]);
    const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
    const timeRef = useRef<HTMLDivElement>(null);
    const dateRef = useRef<HTMLDivElement>(null);
    const datePickerRef = useRef<any>(null);"""

text = text.replace(old_states, new_states)

# 3. useEffect click outside
old_click_outside = """    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (timeRef.current && !timeRef.current.contains(event.target as Node)) {
                setIsTimeDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);"""

new_click_outside = """    // Close dropdowns on click outside
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
    }, []);"""

if old_click_outside in text:
    text = text.replace(old_click_outside, new_click_outside)

# 4. Generate 14 days
old_generate = """    // Auto-select today by default if nothing is selected
    useEffect(() => {
        if (!pickupDate) {
            setPickupDate(new Date());
        }
    }, [pickupDate]);"""

new_generate = """    // Generate next 14 days
    useEffect(() => {
        const dates = [];
        for (let i = 0; i < 14; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            dates.push(date);
        }
        setAvailableDates(dates);

        // Auto-select today by default if nothing is selected
        if (!pickupDate && dates.length > 0) {
            setPickupDate(dates[0]);
        }
    }, []);"""

text = text.replace(old_generate, new_generate)

# 5. time slots logic
# let's write out the new code for the UI portion from Step 61
UI_CHUNK = """                        {/* 3. Shipping Methods */}
                        <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden">
                            <div className="bg-[#F2F2F2] px-6 py-4 border-b border-gray-200">
                                <h3 className="text-[14px] font-black text-[#333] uppercase tracking-wider">
                                    SHIPPING METHODS
                                </h3>
                            </div>
                            <div className="p-6">
                                <div className="space-y-6">
                                    {/* Delivery Option */}
                                    <div
                                        className="flex items-center gap-4 cursor-pointer group"
                                        onClick={() => {
                                            setShippingType("delivery");
                                            const deliveryMethod = shippingMethods.find(m => !m.code.includes("pickup"));
                                            if (deliveryMethod) handleShippingMethodSelect(deliveryMethod.code);
                                        }}
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
                                            onClick={() => {
                                                setShippingType("pickup");
                                                const pickupMethod = shippingMethods.find(m => m.code.includes("pickup"));
                                                if (pickupMethod) handleShippingMethodSelect(pickupMethod.code);
                                            }}
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
                                                            {/* Custom Date Picker - Dropdown List Type */}
                                                            <div className="flex items-center gap-3 relative" ref={dateRef}>
                                                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap min-w-[110px]">Pick Up Date *</label>
                                                                <div className="relative flex-1">
                                                                    <div
                                                                        className="w-full h-10 px-4 py-2 bg-white border border-gray-300 outline-none text-[14px] font-medium transition-all cursor-pointer flex justify-between items-center hover:border-gray-400"
                                                                        onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                                                                    >
                                                                        <span className={pickupDate ? "text-black" : "text-gray-400"}>
                                                                            {pickupDate ? pickupDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "Select Date"}
                                                                        </span>
                                                                        <ChevronDown size={14} className={`transition-transform ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
                                                                    </div>

                                                                    {isDateDropdownOpen && (
                                                                        <div className="absolute z-[110] left-0 right-0 mt-1 bg-white border border-gray-300 shadow-md max-h-[220px] overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200">
                                                                            {availableDates.map((date) => {
                                                                                const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                                                                const isSelected = pickupDate?.toDateString() === date.toDateString();
                                                                                return (
                                                                                    <div
                                                                                        key={dateStr}
                                                                                        className={`px-3 py-1.5 text-[14px] cursor-pointer hover:bg-blue-600 hover:text-white transition-colors ${isSelected ? 'bg-gray-100 font-bold text-black' : 'text-[#444]'}`}
                                                                                        style={{ fontFamily: 'Arial, sans-serif' }}
                                                                                        onClick={() => {
                                                                                            setPickupDate(date);
                                                                                            setIsDateDropdownOpen(false);
                                                                                        }}
                                                                                    >
                                                                                        {date.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Custom Time Picker */}
                                                            <div className="flex items-center gap-3 relative" ref={timeRef}>
                                                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap min-w-[90px] md:min-w-[80px]">Pick Up Time *</label>
                                                                <div className="relative flex-1">
                                                                    <div
                                                                        className="w-full h-10 px-4 py-2 bg-white border border-gray-300 outline-none text-[14px] font-medium transition-all cursor-pointer flex justify-between items-center hover:border-gray-400"
                                                                        onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                                                                    >
                                                                        <span className={pickupTime ? "text-black" : "text-gray-400"}>
                                                                            {pickupTime ? (availableTimeSlots.find((s: { time: string; label: string }) => s.time === pickupTime)?.label || pickupTime) : "Select Time"}
                                                                        </span>
                                                                        <ChevronDown size={14} className={`transition-transform ${isTimeDropdownOpen ? 'rotate-180' : ''}`} />
                                                                    </div>

                                                                    {isTimeDropdownOpen && (
                                                                        <div className="absolute z-[110] left-0 right-0 mt-1 bg-white border border-gray-300 shadow-md max-h-[220px] overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200">
                                                                            {isLoadingTimeSlots ? (
                                                                                <div className="px-4 py-6 text-center">
                                                                                    <Loader2 size={16} className="animate-spin mx-auto text-gray-400 mb-2" />
                                                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Loading slots...</span>
                                                                                </div>
                                                                            ) : (availableTimeSlots.length > 0 ? (
                                                                                availableTimeSlots.map((slot: any) => (
                                                                                    <div
                                                                                        key={slot.time}
                                                                                        className={`px-3 py-1.5 text-[14px] transition-colors cursor-pointer hover:bg-blue-600 hover:text-white text-[#444]
                                                                                            ${pickupTime === slot.time ? 'bg-gray-100 font-bold text-black' : ''}`}
                                                                                        style={{ fontFamily: 'Arial, sans-serif' }}
                                                                                        onClick={() => {
                                                                                            setPickupTime(slot.time);
                                                                                            setIsTimeDropdownOpen(false);
                                                                                        }}
                                                                                    >
                                                                                        {slot.label}
                                                                                    </div>
                                                                                ))
                                                                            ) : (
                                                                                <div className="px-4 py-8 text-center border-t border-gray-50">
                                                                                    <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest block mb-1">
                                                                                        {!pickupDate ? "Please select a date first" : "No slots available"}
                                                                                    </span>
                                                                                    {pickupDate && (
                                                                                        <span className="text-[9px] text-gray-300 uppercase font-medium">Try another date or contact the warehouse</span>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
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
                        </div>"""

start_ui = text.find('                    {/* 3. Shipping Methods */}')
end_ui = text.find('                            {/* 4. Payment Method */}')
if start_ui != -1 and end_ui != -1:
    text = text[:start_ui] + UI_CHUNK + '\n' + text[end_ui:]


with open("/home/parth/Desktop/altalayi-front/components/CheckoutPage.tsx", "w") as f:
    f.write(text)
print("Updated successfully")
