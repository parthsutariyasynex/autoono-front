"use client";
import { useLocalePath } from "@/hooks/useLocalePath";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { fetchAddresses, deleteAddress, setDefaultAddress } from "@/store/actions/addressActions";
import { RootState } from "@/store/store";
import toast from "react-hot-toast";
import Pagination from "@/components/Pagination";
import PortalDropdown from "@/components/PortalDropdown";

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
    <div className="bg-white border border-[#ebebeb] rounded-md shadow-sm overflow-hidden flex flex-col h-full font-rubik">
      <div className="bg-gray-50 px-4 py-3 border-b border-[#ebebeb] uppercase text-xs font-black text-black tracking-tight">
        {title}
      </div>
      <div className="p-6 flex-grow">
        {address ? (
          <div className="space-y-1 text-xs text-gray-600">
            <p className="font-black text-black uppercase mb-2">
              {address.firstname} {address.lastname}
            </p>
            {address.company && <p className="font-medium">{address.company}</p>}
            <p className="font-medium">{address.street?.[0] || address.street}</p>
            <p className="font-medium">
              {address.city}, {address.postcode}
            </p>
            <p className="font-medium">{address.country_id === 'SA' ? 'Saudi Arabia' : address.country_id}</p>
            <p className="pt-2 text-black font-black">T: <span className="text-gray-600 font-medium hover:text-yellow-500 cursor-pointer transition-colors duration-200">
              {address.telephone}
            </span></p>
            {buttonLabel && (
              <div className="pt-6">
                <button
                  type="button"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black text-xs font-black px-8 py-3 uppercase transition-all rounded-md shadow-sm tracking-widest active:scale-95"
                  onClick={() => onEdit?.(address.id)}
                >
                  {buttonLabel}
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-400 italic text-xs">No default address set</p>
        )}
      </div>
    </div>
  );
}


export default function Addresses() {
  const router = useRouter();
    const lp = useLocalePath();
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
      router.push(lp(`/customer/address-book/edit/${addressId}`));
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
      <div className="p-6 flex justify-center items-center min-h-[300px] font-rubik">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
        <p className="ml-3 text-gray-400 text-xs italic">Loading addresses...</p>
      </div>
    );
  }

  return (
    <div className="w-full font-rubik">
      <div className="border-b-2 border-yellow-400 inline-block pb-1 mb-8">
        <h2 className="text-lg font-black text-black uppercase tracking-tight">DEFAULT ADDRESSES</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <AddressCard
          title="DEFAULT BILLING ADDRESS"
          address={defaultBilling}
          onEdit={(id) => handleAddressAction("edit", id)}
          buttonLabel="EDIT BILLING ADDRESS"
        />
        <AddressCard
          title="DEFAULT SHIPPING ADDRESS"
          address={defaultShipping}
          onEdit={(id) => handleAddressAction("edit", id)}
          buttonLabel="EDIT SHIPPING ADDRESS"
        />
      </div>

      <div className="bg-white border border-[#ebebeb] rounded-md shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#ebebeb] flex items-center justify-between bg-gray-50 px-6 py-4">
          <div className="text-xs font-black text-black uppercase tracking-widest">
            ADDITIONAL ADDRESS ENTRIES
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-[#ebebeb]">
              <tr className="text-black text-xs font-black uppercase tracking-wider h-[50px]">
                <th className="px-6 py-4">First Name</th>
                <th className="px-6 py-4">Last Name</th>
                <th className="px-6 py-4">Street Address</th>
                <th className="px-6 py-4">City</th>
                <th className="px-6 py-4">Zip Code</th>
                <th className="px-6 py-4">Phone</th>
              </tr>
            </thead>

            <tbody className="bg-white">
              {error && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-red-500 text-xs font-black uppercase tracking-widest">
                    Error: {error}
                  </td>
                </tr>
              )}
              {filteredAddresses.length === 0 && !loading && !error && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-gray-400 text-xs italic tracking-widest uppercase font-bold">
                    No additional addresses found.
                  </td>
                </tr>
              )}

              {filteredAddresses.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((address: any, idx: number) => (
                <tr key={address.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-[#ebebeb] hover:bg-yellow-50/30 transition-colors text-xs font-medium text-gray-600`}>
                  <td className="px-6 py-5 font-bold text-black uppercase">{address.firstname}</td>
                  <td className="px-6 py-5 font-bold text-black uppercase">{address.lastname}</td>
                  <td className="px-6 py-5">{Array.isArray(address.street) ? address.street.join(", ") : address.street || "-"}</td>
                  <td className="px-6 py-5 uppercase font-bold text-gray-800">{address.city}</td>
                  <td className="px-6 py-5 font-bold">{address.postcode}</td>
                  <td className="px-6 py-5">
                    <span className="text-gray-600 hover:text-yellow-500 cursor-pointer transition-colors duration-200">
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
            <div className="px-6 py-6 bg-gray-50/50 flex flex-col md:flex-row items-center justify-between border-t border-[#ebebeb]">
              {/* Left side: Item count */}
              <div className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                Items {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredAddresses.length)} of {filteredAddresses.length} total
              </div>

              {/* Center: Pagination buttons */}
              <div className="flex items-center gap-1.5 my-4 md:my-0">
                {Array.from({ length: Math.ceil(filteredAddresses.length / pageSize) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 flex items-center justify-center text-[11px] font-black rounded-md transition-all duration-200 shadow-sm border active:scale-95 ${currentPage === p
                      ? "bg-yellow-400 border-yellow-500 text-black"
                      : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Right side: Show per page */}
              <div className="flex items-center gap-2 text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                <span>Show</span>
                <PortalDropdown value={String(pageSize)} onChange={() => {}} options={[{label:"10",value:"10"},{label:"20",value:"20"},{label:"50",value:"50"}]} minWidth={60} />
                <span>per page</span>
              </div>
            </div>
          )
        }
      </div >
    </div >
  );
}
