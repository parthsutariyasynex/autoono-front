"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { fetchAddresses, deleteAddress, setDefaultAddress } from "@/store/actions/addressActions";
import { RootState } from "@/store/store";
import toast from "react-hot-toast";
import Pagination from "@/components/Pagination";

type Address = {
  id: number | string;
  firstname?: string;
  lastname?: string;
  company?: string;
  street?: string[];
  city?: string;
  country_id?: string;
  region?: {
    region?: string;
  };
  postcode?: string;
  telephone?: string;
  default_billing?: boolean;
  default_shipping?: boolean;
};

type AddressCardProps = {
  title: string;
  address?: Address;
  onEdit?: (id: number | string) => void;
  buttonLabel?: string;
};

function AddressCard({ title, address, onEdit, buttonLabel }: AddressCardProps) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-sm shadow-sm overflow-hidden flex flex-col h-full font-['Rubik']">
      <div className="bg-[#f0f2f5] px-4 py-2 border-b border-[#e5e7eb] uppercase text-[14px] font-bold text-black tracking-tight">
        {title}
      </div>
      <div className="p-6 flex-grow">
        {address ? (
          <div className="space-y-1 text-sm text-gray-600">
            <p className="font-bold text-gray-900">
              {address.firstname} {address.lastname}
            </p>
            {address.company && <p>{address.company}</p>}
            <p>{address.street?.[0] || address.street}</p>
            <p>
              {address.city}, {address.postcode}
            </p>
            <p>{address.country_id === 'SA' ? 'Saudi Arabia' : address.country_id}</p>
            <p className="pt-2 text-gray-700">T: <span className="text-gray-600 hover:text-[#ffb12b] cursor-pointer transition-colors duration-200 hover:font-bold">
              {address.telephone}
            </span></p>
            {buttonLabel && (
              <div className="pt-6">
                <button
                  type="button"
                  className="bg-[#ffb12b] hover:bg-[#e5a026] text-black text-[13px] font-bold px-8 py-3 uppercase transition-colors rounded-[2px] shadow-sm tracking-wide"
                  onClick={() => onEdit?.(address.id)}
                >
                  {buttonLabel}
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-400 italic text-sm">No default address set</p>
        )}
      </div>
    </div>
  );
}

export default function Addresses() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { addresses, loading, error } = useSelector((state: RootState) => state.address);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    // @ts-ignore
    dispatch(fetchAddresses());
  }, [dispatch]);


  const handleAddressAction = async (action: string, addressId: number | string) => {
    if (action === "edit") {
      router.push(`/customer/address-book/edit/${addressId}`);
      return;
    }

    if (action === "delete") {
      const confirmed = window.confirm("Are you sure you want to delete this address?");
      if (!confirmed) return;

      setActionLoading(true);
      // @ts-ignore
      dispatch(deleteAddress(addressId, (err) => {
        if (!err) {
          toast.success("Address deleted successfully");
        } else {
          toast.error(err || "Failed to delete address");
        }
        setActionLoading(false);
      }));
      return;
    }

    if (action === "set_default_billing") {
      setActionLoading(true);
      // @ts-ignore
      dispatch(setDefaultAddress({ addressId, type: "billing" }, (err) => {
        if (!err) {
          toast.success("Default billing address set");
        } else {
          toast.error(err || "Failed to set default billing");
        }
        setActionLoading(false);
      }));
      return;
    }

    if (action === "set_default_shipping") {
      setActionLoading(true);
      // @ts-ignore
      dispatch(setDefaultAddress({ addressId, type: "shipping" }, (err) => {
        if (!err) {
          toast.success("Default shipping address set");
        } else {
          toast.error(err || "Failed to set default shipping");
        }
        setActionLoading(false);
      }));
    }
  };

  const additionalAddresses = addresses.filter((address: any) => !address.default_billing && !address.default_shipping);
  const filteredAddresses = additionalAddresses; // No search bar in screenshot


  const defaultBilling = addresses.find((address: any) => address.default_billing);
  const defaultShipping = addresses.find((address: any) => address.default_shipping);

  if (loading && addresses.length === 0) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[300px] font-['Rubik']">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
        <p className="ml-3 text-gray-500 text-sm">Loading addresses...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto font-['Rubik']">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pt-4">
        <h1 className="text-[24px] font-bold text-black uppercase tracking-tight">ADDRESS BOOK</h1>
      </div>

      <div className="border-b border-gray-300 pb-2 mb-8">
        <h2 className="text-[18px] font-bold text-black uppercase tracking-tight">DEFAULT ADDRESSES</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <AddressCard
          title="DEFAULT BILLING ADDRESS"
          address={defaultBilling}
          onEdit={(id) => handleAddressAction("edit", id)}
        />
        <AddressCard
          title="DEFAULT SHIPPING ADDRESS"
          address={defaultShipping}
          onEdit={(id) => handleAddressAction("edit", id)}
          buttonLabel="EDIT SHIPPING ADDRESS"
        />
      </div>

      <div className="bg-white rounded-[3px] shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white px-2 py-6">
          <div className="text-[17px] font-bold text-[#333] uppercase tracking-wide">
            ADDITIONAL ADDRESS ENTRIES
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white text-gray-900 text-[13px] font-bold border-b border-gray-200">
                <th className="p-4 text-left whitespace-nowrap">First Name</th>
                <th className="p-4 text-left whitespace-nowrap">Last Name</th>
                <th className="p-4 text-left whitespace-nowrap">Street Address</th>
                <th className="p-4 text-left whitespace-nowrap">City</th>
                <th className="p-4 text-left whitespace-nowrap">Zip Code</th>
                <th className="p-4 text-left whitespace-nowrap">Phone</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-[13px] text-gray-700">
              {error && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-red-500 font-medium">
                    Error: {error}
                  </td>
                </tr>
              )}
              {filteredAddresses.length === 0 && !loading && !error && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400 text-sm font-medium">
                    No address found
                  </td>
                </tr>
              )}

              {filteredAddresses.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((address: any) => (
                <tr key={address.id} className="hover:bg-neutral-50 transition-colors border-b border-gray-100">
                  <td className="p-4">{address.firstname}</td>
                  <td className="p-4">{address.lastname}</td>
                  <td className="p-4">{Array.isArray(address.street) ? address.street.join(", ") : address.street || "-"}</td>
                  <td className="p-4">{address.city}</td>
                  <td className="p-4">{address.postcode}</td>
                  <td className="p-4">
                    <span className="text-gray-700 hover:text-[#ffb12b] cursor-pointer transition-colors duration-200 hover:font-bold">
                      {address.telephone}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {
          filteredAddresses.length > 0 && (
            <div className="p-4 bg-[#f4f4f4] flex flex-col md:flex-row items-center justify-between border-t border-gray-200">
              {/* Left side: Item count */}
              <div className="text-[12px] text-gray-500 font-medium">
                Items {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredAddresses.length)} of {filteredAddresses.length} total
              </div>

              {/* Center: Pagination buttons */}
              <div className="flex items-center gap-1 my-4 md:my-0">
                {Array.from({ length: Math.ceil(filteredAddresses.length / pageSize) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-7 h-7 flex items-center justify-center text-[12px] rounded-full transition-all duration-200 ${currentPage === p
                      ? "bg-[#f5a623] text-black font-bold"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                      }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={currentPage >= Math.ceil(filteredAddresses.length / pageSize)}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="w-7 h-7 flex items-center justify-center bg-white text-gray-600 rounded-full border border-gray-200 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Right side: Show per page */}
              <div className="flex items-center gap-2 text-[12px] text-gray-600">
                <span>Show</span>
                <div className="relative group">
                  <input
                    type="text"
                    readOnly
                    value={pageSize}
                    className="w-12 h-8 border border-gray-300 bg-white text-center rounded-[2px] transition-all"
                  />
                </div>
                <span>per page</span>
              </div>
            </div>
          )
        }
      </div >
    </div >
  );
}
