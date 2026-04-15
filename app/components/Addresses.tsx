"use client";
import { useLocalePath } from "@/hooks/useLocalePath";
import { useTranslation } from "@/hooks/useTranslation";

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
  t: (key: string) => string;
  isRtl: boolean;
};

function AddressCard({ title, address, onEdit, buttonLabel, t, isRtl }: AddressCardProps) {
  return (
    <div className="bg-white border border-[#ebebeb] rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full font-rubik group">
      <div className="bg-gray-50/80 px-5 py-4 border-b border-[#ebebeb] uppercase text-[11px] font-black text-black tracking-widest ltr:text-left rtl:text-right group-hover:bg-yellow-50/50 transition-colors">
        {title}
      </div>
      <div className="p-6 flex-grow ltr:text-left rtl:text-right">
        {address ? (
          <div className="space-y-1.5 text-[13px] text-gray-600">
            <p className="font-black text-black uppercase mb-3 text-sm tracking-tight leading-tight">
              {address.firstname} {address.lastname}
            </p>
            {address.company && <p className="font-medium">{address.company}</p>}
            <p className="font-medium">{Array.isArray(address.street) ? address.street.join(", ") : address.street}</p>
            <p className="font-medium text-gray-800">
              {address.city}{isRtl ? "،" : ","} <span dir="ltr">{address.postcode}</span>
            </p>
            <p className="font-medium">{address.country_id === 'SA' ? t("addressBook.saudiArabia") : address.country_id}</p>
            <div className="pt-3 flex items-center gap-2">
              <span className="text-[11px] font-black text-black uppercase tracking-wider">{t("addressBook.phone")}:</span>
              <span className="text-gray-600 font-bold hover:text-yellow-600 cursor-pointer transition-colors duration-200" dir="ltr">{address.telephone}</span>
            </div>
            {buttonLabel && (
              <div className="pt-8 mt-auto">
                <button
                  type="button"
                  className="bg-[#f5a623] hover:bg-[#e0951d] text-black text-[11px] font-black px-10 py-3.5 uppercase transition-all rounded-lg shadow-sm tracking-widest active:scale-95 flex items-center gap-2"
                  onClick={() => onEdit?.(address.id)}
                >
                  {buttonLabel}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-10 text-gray-400">
            <p className="italic text-xs font-semibold uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
              {t("addressBook.noDefaultAddress")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


export default function Addresses() {
  const router = useRouter();
  const lp = useLocalePath();
  const { t, isRtl } = useTranslation();
  const dispatch = useDispatch();
  const { addresses, loading, error } = useSelector((state: RootState) => state.address);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
      const confirmed = window.confirm(t("addressBook.deleteConfirm"));
      if (!confirmed) return;

      setActionLoading(true);
      // @ts-ignore
      dispatch(deleteAddress(addressId, (err) => {
        if (!err) {
          toast.success(t("addressBook.deleted"));
        } else {
          toast.error(err || t("addressBook.deleteFailed"));
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
          toast.success(t("addressBook.defaultBillingSet"));
        } else {
          toast.error(err || t("addressBook.defaultBillingFailed"));
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
          toast.success(t("addressBook.defaultShippingSet"));
        } else {
          toast.error(err || t("addressBook.defaultShippingFailed"));
        }
        setActionLoading(false);
      }));
    }
  };

  const additionalAddresses = addresses.filter((address: any) => !address.default_billing && !address.default_shipping);
  const filteredAddresses = additionalAddresses;

  const defaultBilling = addresses.find((address: any) => address.default_billing);
  const defaultShipping = addresses.find((address: any) => address.default_shipping);

  if (loading && addresses.length === 0) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px] font-rubik">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-100 border-t-[#f5a623]"></div>
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest">{t("addressBook.loadingAddresses")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full font-rubik space-y-12" dir={isRtl ? "rtl" : "ltr"}>
      {/* Section 1: Default Addresses */}
      <section>
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-xl font-black text-black uppercase tracking-tight">{t("addressBook.defaultAddresses")}</h2>
          <div className="h-[2px] flex-1 bg-gradient-to-r from-yellow-400 to-transparent"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <AddressCard
            title={t("addressBook.defaultBillingAddress")}
            address={defaultBilling}
            t={t}
            isRtl={isRtl}
          />
          <AddressCard
            title={t("addressBook.defaultShippingAddress")}
            address={defaultShipping}
            onEdit={(id) => handleAddressAction("edit", id)}
            buttonLabel={t("addressBook.editShippingAddress")}
            t={t}
            isRtl={isRtl}
          />
        </div>
      </section>

      {/* Section 2: Additional Addresses */}
      <section>
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-xl font-black text-black uppercase tracking-tight">{t("addressBook.additionalAddresses")}</h2>
          <div className="h-[2px] flex-1 bg-gradient-to-r from-yellow-400 to-transparent"></div>
        </div>

        <div className="bg-white border border-[#ebebeb] rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-[#ebebeb] text-black text-[11px] font-black uppercase tracking-widest h-[60px]">
                  <th className="px-6 py-4 ltr:text-left rtl:text-right">{t("addressBook.firstName")}</th>
                  <th className="px-6 py-4 ltr:text-left rtl:text-right">{t("addressBook.lastName")}</th>
                  <th className="px-6 py-4 ltr:text-left rtl:text-right">{t("addressBook.streetAddress")}</th>
                  <th className="px-6 py-4 ltr:text-left rtl:text-right">{t("addressBook.city")}</th>
                  <th className="px-6 py-4 ltr:text-left rtl:text-right">{t("addressBook.zipCode")}</th>
                  <th className="px-6 py-4 ltr:text-left rtl:text-right">{t("addressBook.phone")}</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-50">
                {error && (
                  <tr>
                    <td colSpan={6} className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-red-500 text-xs font-black uppercase tracking-widest">{t("common.error")}</span>
                        <p className="text-gray-500 text-[13px]">{error}</p>
                      </div>
                    </td>
                  </tr>
                )}
                {filteredAddresses.length === 0 && !loading && !error && (
                  <tr>
                    <td colSpan={6} className="px-6 py-24 text-center">
                      <p className="text-gray-400 text-xs italic tracking-[0.2em] uppercase font-black">
                        {t("addressBook.noAdditionalAddresses")}
                      </p>
                    </td>
                  </tr>
                )}

                {filteredAddresses.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((address: any, idx: number) => (
                  <tr key={address.id} className="hover:bg-yellow-50/20 transition-colors text-[13px] group h-[70px]">
                    <td className="px-6 py-4 font-black text-black uppercase ltr:text-left rtl:text-right group-hover:text-yellow-700 transition-colors">{address.firstname}</td>
                    <td className="px-6 py-4 font-black text-black uppercase ltr:text-left rtl:text-right group-hover:text-yellow-700 transition-colors">{address.lastname}</td>
                    <td className="px-6 py-4 text-gray-500 font-medium ltr:text-left rtl:text-right">{Array.isArray(address.street) ? address.street.join(", ") : address.street || "-"}</td>
                    <td className="px-6 py-4 uppercase font-bold text-gray-800 ltr:text-left rtl:text-right">{address.city}</td>
                    <td className="px-6 py-4 font-bold text-gray-700 ltr:text-left rtl:text-right group-hover:text-black transition-colors"><span dir="ltr">{address.postcode}</span></td>
                    <td className="px-6 py-4 ltr:text-left rtl:text-right">
                      <span dir="ltr" className="text-gray-600 font-bold hover:text-yellow-600 cursor-pointer transition-colors duration-200">
                        {address.telephone}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAddresses.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-50 bg-gray-50/30">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredAddresses.length / pageSize)}
                totalItems={filteredAddresses.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(val) => { setPageSize(val); setCurrentPage(1); }}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
