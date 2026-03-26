"use client";

import "intl-tel-input/build/css/intlTelInput.css";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { sendOtp } from "@/store/actions/authActions";
import { RootState } from "@/store/store";


const COUNTRY_CODES = [
  { code: "+966", country: "Saudi Arabia", iso: "sa", flagClass: "iti__flag iti__sa" },
  { code: "+91", country: "India", iso: "in", flagClass: "iti__flag iti__in" },
  { code: "+971", country: "United Arab Emirates", iso: "ae", flagClass: "iti__flag iti__ae" },
];

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<"password" | "otp">("password");

  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();
  const { loading: reduxLoading } = useAppSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (status === "authenticated") {
      const callbackUrl = searchParams.get("callbackUrl") || "/products";
      router.replace(callbackUrl);
    }
  }, [status, router, searchParams]);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [countryCode, setCountryCode] = useState("+966");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Validation Errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const qp = searchParams.get("mode");
    if (qp === "otp" || qp === "password") {
      setMode(qp);
    }
  }, [searchParams]);

  const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (mode === "password") {
      if (!email) newErrors.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Invalid email format";
      if (!password) newErrors.password = "Password is required";
    } else {
      if (!mobileNumber) newErrors.mobile = "Mobile number is required";
      if (otpSent && !otp) newErrors.otp = "OTP is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOtp = async (e: React.MouseEvent) => {
    e.preventDefault();
    setErrors({});
    if (!mobileNumber) {
      setErrors({ mobile: "Mobile number is required" });
      return;
    }
    // Mobile and country code alag moklva
    dispatch(sendOtp(mobileNumber, countryCode, (err, data) => {
      if (!err) {
        toast.success("OTP Sent");
        setOtpSent(true);
      } else {
        toast.error(err || "Failed to send OTP");
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    if (mode === "password") {
      try {
        // Step 1: Get token directly from Magento API
        console.log("[LOGIN] Step 1: Fetching token from Magento...");
        const magentoRes = await fetch("/api/kleverapi/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: email, password }),
        });
        console.log("[LOGIN] Magento response status:", magentoRes.status);
        const magentoData = await magentoRes.json();
        console.log("[LOGIN] Magento response data:", magentoData);
        console.log("[LOGIN] Magento data type:", typeof magentoData);

        const magentoToken = typeof magentoData === "string"
          ? magentoData.replace(/"/g, "").trim()
          : magentoData?.token || magentoData;

        console.log("[LOGIN] Extracted token:", magentoToken ? "found" : "MISSING");

        if (magentoRes.ok && magentoToken) {
          const cleanToken = String(magentoToken).replace(/"/g, "").trim();
          localStorage.setItem("token", cleanToken);
          console.log("[LOGIN] Token stored in localStorage:", cleanToken.substring(0, 20) + "...");
        } else {
          console.error("[LOGIN] Failed to get token from Magento");
        }

        // Step 2: Also do NextAuth signIn for session/middleware
        console.log("[LOGIN] Step 2: NextAuth signIn...");
        const res = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        console.log("[LOGIN] NextAuth result:", res);

        if (res?.ok) {
          console.log("[LOGIN] Success! localStorage token:", localStorage.getItem("token") ? "SET" : "MISSING");
          toast.success("Login Successful");
          // Use window.location for full page reload — ensures NextAuth JWT cookie
          // is sent with the request so middleware sees authenticated state on Vercel
          const callbackUrl = searchParams.get("callbackUrl") || "/products";
          window.location.href = callbackUrl;
        } else {
          localStorage.removeItem("token");
          toast.error("Login failed. Please check your credentials.");
        }
      } catch {
        toast.error("Login failed. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      // OTP Login
      try {
        // Step 1: Get token via OTP API
        const otpRes = await fetch("/api/login-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json", "platform": "web" },
          body: JSON.stringify({ mobile: mobileNumber, otp, countryCode }),
        });
        const otpData = await otpRes.json();
        const otpToken = otpData?.token || (otpData?.customer?.token);

        if (otpRes.ok && otpToken) {
          localStorage.setItem("token", String(otpToken).trim());
        }

        // Step 2: Also do NextAuth signIn for session/middleware
        const res = await signIn("credentials", {
          mobile: mobileNumber,
          otp: otp,
          countryCode: countryCode,
          redirect: false,
        });

        if (res?.ok) {
          toast.success("Login Successful");
          const callbackUrl = searchParams.get("callbackUrl") || "/products";
          window.location.href = callbackUrl;
        } else {
          localStorage.removeItem("token");
          toast.error(res?.error || "Login Failed. Invalid OTP.");
        }
      } catch (err) {
        toast.error("Login failed. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex-1 bg-[#f4f4f4] flex flex-col font-['Rubik']">


      <main className="flex-1 flex items-center justify-center py-12 px-4 md:px-0">
        <div className="w-full max-w-[440px] bg-white rounded-[3px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden">
          {/* Header Section */}
          <div className="p-8 pb-4">
            <div className="text-center border-b border-gray-100 pb-6">
              <h1 className="text-[20px] font-black tracking-tight uppercase text-gray-900">
                Registered Customers
              </h1>
            </div>
          </div>

          {/* Login Tabs */}
          <div className="px-8 flex">
            <div className="flex w-full rounded-[5px] overflow-hidden border border-gray-100 bg-gray-50/50 p-1">
              <button
                type="button"
                className={`flex-1 py-3 text-[12px] font-bold uppercase tracking-wider transition-all cursor-pointer rounded-[4px] ${mode === 'otp' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-black hover:bg-gray-200/50'}`}
                onClick={() => { setMode("otp"); setOtpSent(false); setErrors({}); router.push("/login?mode=otp", { scroll: false }); }}
              >
                Login With OTP
              </button>
              <button
                type="button"
                className={`flex-1 py-3 text-[12px] font-bold uppercase tracking-wider transition-all cursor-pointer rounded-[4px] ${mode === 'password' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-black hover:bg-gray-200/50'}`}
                onClick={() => { setMode("password"); setOtpSent(false); setErrors({}); router.push("/login?mode=password", { scroll: false }); }}
              >
                Login With Password
              </button>
            </div>
          </div>

          <div className="p-8 pt-6">
            <p className="text-[13px] text-gray-500 font-medium leading-relaxed mb-6">
              {mode === 'password'
                ? "If you have an account, sign in with your email address."
                : "If you have an account, sign in with your mobile number."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {mode === 'password' && (
                <>
                  <div className="space-y-2">
                    <label className="block text-[12px] font-black text-gray-900 uppercase tracking-wide cursor-pointer">
                      Email <span className="text-red-600 text-lg">*</span>
                    </label>
                    <input
                      id="email-input"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: '' }); }}
                      className={`w-full h-12 bg-white px-4 text-sm rounded-[1px] outline outline-1 transition-all cursor-text ${errors.email ? 'outline-red-500' : 'outline-gray-200 focus:outline-black focus:outline-2 focus:ring-1 focus:ring-black'}`}
                    />
                    {errors.email && <span className="text-red-500 text-[11px] font-bold">{errors.email}</span>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[12px] font-black text-gray-900 uppercase tracking-wide cursor-pointer">
                      Password <span className="text-red-600 text-lg">*</span>
                    </label>
                    <input
                      id="password-input"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: '' }); }}
                      className={`w-full h-12 bg-white px-4 text-sm rounded-[1px] outline outline-1 transition-all cursor-text ${errors.password ? 'outline-red-500' : 'outline-gray-200 focus:outline-black focus:outline-2 focus:ring-1 focus:ring-black'}`}
                    />
                    {errors.password && <span className="text-red-500 text-[11px] font-bold">{errors.password}</span>}
                  </div>
                </>
              )}

              {mode === 'otp' && (
                <>
                  <div className="space-y-2 relative">
                    <label className="block text-[12px] font-black text-gray-900 uppercase tracking-wide">
                      Mobile Number <span className="text-red-600 text-lg">*</span>
                    </label>
                    <div className={`flex h-12 bg-white rounded-[1px] outline outline-1 transition-all ${errors.mobile ? 'outline-red-500' : 'outline-gray-200 focus-within:outline-black focus-within:outline-2'}`}>
                      <div
                        className="bg-gray-50 px-4 flex items-center gap-2 border-r border-gray-200 cursor-pointer min-w-[100px] hover:bg-gray-100 transition-colors"
                        onClick={() => setShowDropdown(!showDropdown)}
                      >
                        <span className={`${selectedCountry?.flagClass} scale-110`}></span>
                        <span className="text-gray-900 font-black text-xs">{selectedCountry?.code}</span>
                        <span className="text-[10px] text-gray-400">▼</span>
                      </div>
                      <input
                        id="mobile-input"
                        type="tel"
                        placeholder="Mobile Number"
                        value={mobileNumber}
                        onChange={(e) => { setMobileNumber(e.target.value.replace(/\D/g, "")); if (errors.mobile) setErrors({ ...errors, mobile: '' }); }}
                        className="flex-1 px-4 text-sm outline-none bg-transparent cursor-text font-medium"
                      />

                      {showDropdown && (
                        <div className="absolute top-[80px] left-0 w-full bg-white border border-gray-200 shadow-2xl z-50 rounded-[2px] overflow-hidden">
                          {COUNTRY_CODES.map((item) => (
                            <div
                              key={item.code}
                              onClick={() => { setCountryCode(item.code); setShowDropdown(false); }}
                              className="p-4 hover:bg-gray-50 cursor-pointer flex items-center gap-4 border-b last:border-0 border-gray-100 transition-colors"
                            >
                              <span className={`${item.flagClass} scale-110`}></span>
                              <span className="text-xs font-black text-gray-900">{item.code}</span>
                              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{item.country}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.mobile && <span className="text-red-500 text-[11px] font-bold">{errors.mobile}</span>}
                  </div>

                  {otpSent && (
                    <div className="space-y-2">
                      <label className="block text-[12px] font-black text-gray-900 uppercase tracking-wide">
                        Verification Code <span className="text-red-600 text-lg">*</span>
                      </label>
                      <input
                        id="otp-input"
                        type="text"
                        value={otp}
                        onChange={(e) => { setOtp(e.target.value); if (errors.otp) setErrors({ ...errors, otp: '' }); }}
                        className={`w-full h-12 bg-white px-4 text-sm rounded-[1px] outline outline-1 transition-all text-center font-black tracking-[8px] cursor-text placeholder:font-normal placeholder:tracking-normal ${errors.otp ? 'outline-red-500' : 'outline-gray-200 focus:outline-black focus:outline-2 focus:ring-1 focus:ring-black'}`}
                        placeholder="ENTER OTP"
                      />
                      {errors.otp && <span className="text-red-500 text-[11px] font-bold">{errors.otp}</span>}
                    </div>
                  )}
                </>
              )}

              <div className="pt-4 flex flex-col gap-4">
                <button
                  id="submit-button"
                  type={mode === 'otp' && !otpSent ? 'button' : 'submit'}
                  disabled={loading || reduxLoading}
                  onClick={mode === 'otp' && !otpSent ? handleSendOtp : undefined}
                  className="w-full h-[55px] bg-[#f5b21a] hover:bg-[#e0a218] text-black font-black uppercase transition-all rounded-[3px] shadow-lg shadow-yellow-500/10 disabled:opacity-50 cursor-pointer active:scale-[0.98] tracking-widest text-[13px]"
                >
                  {mode === 'otp' && !otpSent ? 'Send OTP' : (loading || reduxLoading ? 'Please Wait...' : 'Sign In')}
                </button>

                <div className="text-center pt-2">
                  <Link href="/forgot-password">
                    <span className="text-xs font-bold text-[#003d7e] hover:text-[#002a56] cursor-pointer hover:underline underline-offset-4 uppercase tracking-tighter">
                      Forgot Your Password?
                    </span>
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}