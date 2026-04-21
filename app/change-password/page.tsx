"use client";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocalePath } from "@/hooks/useLocalePath";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useDispatch } from "react-redux";
import { changePassword } from "@/store/actions/authActions";
import toast from "react-hot-toast";

export default function ChangePasswordPage() {
  const router = useRouter();
    const { t } = useTranslation();
    const lp = useLocalePath();
  const dispatch = useDispatch();
  const { data: session, status } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t("changePassword.mismatch"));
      return;
    }

    setLoading(true);
    // @ts-ignore
    dispatch(changePassword({ currentPassword, newPassword }, (err: any) => {
      if (!err) {
        toast.success(t("changePassword.success"));
        router.push(lp("/customer/account"));
      } else {
        toast.error(err || t("changePassword.failed"));
      }
      setLoading(false);
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      
      <div className="max-w-md mx-auto p-4 sm:p-6 mt-6 sm:mt-10">
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded shadow-sm border border-gray-200">
          <h1 className="text-base sm:text-lg md:text-xl font-bold mb-4 sm:mb-6 uppercase tracking-wider text-black">{t("changePassword.title")}</h1>
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5">
            <div>
              <label className="block text-label font-bold uppercase text-black/80 tracking-tight mb-1">{t("changePassword.currentPassword")} *</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2.5 rounded-[1px] text-sm focus:outline-none focus:ring-1 focus:ring-black cursor-text"
              />
            </div>
            <div>
              <label className="block text-label font-bold uppercase text-black/80 tracking-tight mb-1">{t("changePassword.newPassword")} *</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2.5 rounded-[1px] text-sm focus:outline-none focus:ring-1 focus:ring-black cursor-text"
              />
            </div>
            <div>
              <label className="block text-label font-bold uppercase text-black/80 tracking-tight mb-1">{t("changePassword.confirmNewPassword")} *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2.5 rounded-[1px] text-sm focus:outline-none focus:ring-1 focus:ring-black cursor-text"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-400 text-black font-bold py-3 rounded-[3px] shadow-sm hover:bg-primaryHover transition-all uppercase text-xs tracking-wider cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {loading ? t("changePassword.saving") : t("changePassword.save")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}