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
import { Header } from "@/app/components/auth/Header";
import { Navbar } from "@/app/components/auth/Navbar";

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
      router.replace("/products");
    }
  }, [status, router]);

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
        const res = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (res?.ok) {
          toast.success("Login Successful");
          router.replace("/products");
        } else {
          toast.error("Login failed. Please check your credentials.");
        }
      } catch {
        toast.error("Login failed. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      // OTP Login using NextAuth signIn
      try {
        const res = await signIn("credentials", {
          mobile: mobileNumber,
          otp: otp,
          countryCode: countryCode,
          redirect: false,
        });

        if (res?.ok) {
          toast.success("Login Successful");
          router.replace("/products");
        } else {
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
    <div className="min-h-screen bg-[#efefef] flex flex-col font-['Rubik']">
      <Header />
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-10 px-4 md:px-0">
        <div className="w-full max-w-[400px] bg-white rounded-xl shadow-[0_6px_20px_rgba(0,0,0,0.10)] p-8">
          <div className="text-center">
            <h1 className="text-[18px] font-bold tracking-[0.5px] uppercase text-gray-900">
              REGISTERED CUSTOMERS
            </h1>
          </div>

          {/* Login Tabs */}
          <div className="mt-5 flex rounded-md overflow-hidden border border-gray-200">
            <button
              type="button"
              className={`flex-1 py-3 text-sm font-semibold transition-all cursor-pointer ${mode === 'otp' ? 'bg-black text-white' : 'bg-[#efefef] text-black hover:bg-gray-200'}`}
              onClick={() => { setMode("otp"); setOtpSent(false); setErrors({}); router.push("/login?mode=otp", { scroll: false }); }}
            >
              Login With OTP
            </button>
            <button
              type="button"
              className={`flex-1 py-3 text-sm font-semibold transition-all cursor-pointer ${mode === 'password' ? 'bg-black text-white' : 'bg-[#efefef] text-black hover:bg-gray-200'}`}
              onClick={() => { setMode("password"); setOtpSent(false); setErrors({}); router.push("/login?mode=password", { scroll: false }); }}
            >
              Login With Password
            </button>
          </div>

          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-6">
              {mode === 'password'
                ? "If you have an account, sign in with your email address."
                : "If you have an account, sign in with your mobile number."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {mode === 'password' && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-bold text-gray-900 uppercase tracking-tight">
                      Email <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="email-input"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: '' }); }}
                      className={`w-full h-11 border px-3 text-sm rounded-sm transition-all outline-none cursor-text ${errors.email ? 'border-red-500' : 'border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900'}`}
                    />
                    {errors.email && <span className="text-red-500 text-[11px]">{errors.email}</span>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-bold text-gray-900 uppercase tracking-tight">
                      Password <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="password-input"
                      type="password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: '' }); }}
                      className={`w-full h-11 border px-3 text-sm rounded-sm transition-all outline-none cursor-text ${errors.password ? 'border-red-500' : 'border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900'}`}
                    />
                    {errors.password && <span className="text-red-500 text-[11px]">{errors.password}</span>}
                  </div>
                </>
              )}

              {mode === 'otp' && (
                <>
                  <div className="space-y-1.5 relative">
                    <label className="block text-[13px] font-bold text-gray-900 uppercase tracking-tight">
                      Mobile Number <span className="text-red-600">*</span>
                    </label>
                    <div className={`flex h-11 bg-white rounded-sm border transition-all ${errors.mobile ? 'border-red-500' : 'border-gray-300 focus-within:border-gray-900'}`}>
                      <div
                        className="bg-gray-50 px-3 flex items-center gap-2 border-r border-gray-300 cursor-pointer min-w-[90px]"
                        onClick={() => setShowDropdown(!showDropdown)}
                      >
                        <span className={`${selectedCountry?.flagClass}`}></span>
                        <span className="text-gray-900 font-bold text-xs">{selectedCountry?.code}</span>
                        <span className="text-[10px] text-gray-500">▼</span>
                      </div>
                      <input
                        id="mobile-input"
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => { setMobileNumber(e.target.value.replace(/\D/g, "")); if (errors.mobile) setErrors({ ...errors, mobile: '' }); }}
                        className="flex-1 px-3 text-sm outline-none bg-transparent cursor-text"
                      />

                      {showDropdown && (
                        <div className="absolute top-[75px] left-0 w-full bg-white border border-gray-300 shadow-xl z-50 rounded-sm">
                          {COUNTRY_CODES.map((item) => (
                            <div
                              key={item.code}
                              onClick={() => { setCountryCode(item.code); setShowDropdown(false); }}
                              className="p-3 hover:bg-gray-100 cursor-pointer flex items-center gap-3 border-b last:border-0 border-gray-100"
                            >
                              <span className={item.flagClass}></span>
                              <span className="text-xs font-bold text-gray-900">{item.code}</span>
                              <span className="text-[10px] text-gray-500 uppercase">{item.country}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.mobile && <span className="text-red-500 text-[11px]">{errors.mobile}</span>}
                  </div>

                  {otpSent && (
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-bold text-gray-900 uppercase tracking-tight">
                        OTP <span className="text-red-600">*</span>
                      </label>
                      <input
                        id="otp-input"
                        type="text"
                        value={otp}
                        onChange={(e) => { setOtp(e.target.value); if (errors.otp) setErrors({ ...errors, otp: '' }); }}
                        className={`w-full h-11 border px-3 text-sm rounded-sm transition-all outline-none text-center font-bold tracking-widest cursor-text ${errors.otp ? 'border-red-500' : 'border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900'}`}
                        placeholder="Enter 4-digit OTP"
                      />
                      {errors.otp && <span className="text-red-500 text-[11px]">{errors.otp}</span>}
                    </div>
                  )}
                </>
              )}

              <div className="pt-2">
                <button
                  id="submit-button"
                  type={mode === 'otp' && !otpSent ? 'button' : 'submit'}
                  disabled={loading || reduxLoading}
                  onClick={mode === 'otp' && !otpSent ? handleSendOtp : undefined}
                  className="w-full h-12 bg-[#f4b400] hover:bg-[#e2a700] text-black font-bold uppercase transition-all rounded-sm shadow-sm disabled:opacity-50 cursor-pointer active:scale-[0.99]"
                >
                  {mode === 'otp' && !otpSent ? 'Send OTP' : (loading || reduxLoading ? 'Please Wait...' : 'Sign In')}
                </button>
              </div>

              <div className="text-center pt-2">
                <Link href="/forgot-password">
                  <span className="text-xs text-gray-700 hover:text-black cursor-pointer hover:underline underline-offset-4">
                    Forgot Your Password?
                  </span>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}