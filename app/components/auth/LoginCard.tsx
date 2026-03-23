"use client";

import * as React from "react";

type TabKey = "otp" | "password";

export function LoginCard() {
  const [activeTab, setActiveTab] = React.useState<TabKey>("password");

  return (
    <div className="w-full flex items-center justify-center px-4">
      <div className="w-full max-w-[400px] bg-white rounded-xl shadow-[0_6px_20px_rgba(0,0,0,0.10)] p-8">
        <div className="text-center">
          <h1 className="text-[18px] font-bold tracking-[0.5px] uppercase text-gray-900">
            REGISTERED CUSTOMERS
          </h1>
        </div>

        <div className="mt-5 flex rounded-md overflow-hidden border border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab("otp")}
            className={[
              "flex-1 py-2.5 text-sm font-semibold transition-colors cursor-pointer",
              activeTab === "otp"
                ? "bg-black text-white"
                : "bg-gray-200 text-gray-900 hover:bg-gray-300",
            ].join(" ")}
          >
            Login With OTP
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("password")}
            className={[
              "flex-1 py-2.5 text-sm font-semibold transition-colors cursor-pointer",
              activeTab === "password"
                ? "bg-black text-white"
                : "bg-gray-200 text-gray-900 hover:bg-gray-300",
            ].join(" ")}
          >
            Login With Password
          </button>
        </div>

        <p className="mt-5 text-sm text-gray-600">
          If you have an account, sign in with your email address.
        </p>

        <form className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800">
              Email <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-600 cursor-text"
              placeholder=""
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800">
              {activeTab === "otp" ? "OTP" : "Password"}{" "}
              <span className="text-red-600">*</span>
            </label>
            <input
              type={activeTab === "otp" ? "text" : "password"}
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-600 cursor-text"
              placeholder=""
            />
          </div>

          <button
            type="button"
            className="w-full rounded-md bg-[#f4b400] py-3 text-sm font-bold text-black transition-colors hover:bg-[#e2a700] cursor-pointer"
          >
            SIGN IN
          </button>

          <div className="text-center">
            <a
              href="/forgot-password"
              className="text-xs text-gray-700 hover:text-black underline underline-offset-2 cursor-pointer"
            >
              Forgot Your Password?
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

