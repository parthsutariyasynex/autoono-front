"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "../components/Navbar";
import { useDispatch } from "react-redux";
import { changePassword } from "@/store/actions/authActions";
import toast from "react-hot-toast";

export default function ChangePasswordPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { data: session, status } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    // @ts-ignore
    dispatch(changePassword({ currentPassword, newPassword }, (err: any) => {
      if (!err) {
        toast.success("Password changed successfully");
        router.push("/customer/account");
      } else {
        toast.error(err || "Failed to change password");
      }
      setLoading(false);
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 font-['Rubik']">
      <Navbar />
      <div className="max-w-md mx-auto p-6 mt-10">
        <div className="bg-white p-8 rounded shadow-sm border border-gray-200">
          <h1 className="text-xl font-bold mb-6 uppercase tracking-wider text-black">Change Password</h1>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-700 tracking-tight mb-1">Current Password *</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2.5 rounded-[1px] text-sm focus:outline-none focus:ring-1 focus:ring-black cursor-text"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-700 tracking-tight mb-1">New Password *</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2.5 rounded-[1px] text-sm focus:outline-none focus:ring-1 focus:ring-black cursor-text"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-700 tracking-tight mb-1">Confirm New Password *</label>
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
              className="w-full bg-amber-400 text-black font-bold py-3 rounded-[3px] shadow-sm hover:bg-amber-500 transition-all uppercase text-xs tracking-wider cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {loading ? "Changing..." : "Save Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}