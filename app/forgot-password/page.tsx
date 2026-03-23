"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { forgotPassword } from "@/store/actions/authActions";
import { RootState } from "@/store/store";

const COUNTRY_CODES = [
  { code: "+966", country: "Saudi Arabia", iso: "sa", flagClass: "iti__flag iti__sa" },
  { code: "+91", country: "India", iso: "in", flagClass: "iti__flag iti__in" },
  { code: "+971", country: "United Arab Emirates", iso: "ae", flagClass: "iti__flag iti__ae" },
];

export default function ForgotPasswordPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading: reduxLoading } = useAppSelector((state: RootState) => state.auth);

  // Flow State: 'input' | 'otp' | 'reset'
  const [step, setStep] = useState<"input" | "otp" | "reset">("input");
  // Reset Mode: 'email' | 'mobile'
  const [resetMode, setResetMode] = useState<"email" | "mobile">("email");

  // Form Data
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+966");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");

  // UI State
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showDropdown, setShowDropdown] = useState(false);

  const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (step === "input") {
      if (resetMode === "email") {
        if (!email) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Invalid email format";
      } else {
        if (!mobileNumber) newErrors.mobile = "Mobile number is required";
        // else if (mobileNumber.length !== 10) newErrors.mobile = "Mobile number must be 10 digits";
      }
    } else if (step === "otp") {
      if (!otp) newErrors.otp = "OTP is required";
      else if (otp.length < 4) newErrors.otp = "Invalid OTP format";
    } else if (step === "reset") {
      if (!newPassword) newErrors.password = "New password is required";
      else if (newPassword.length < 6) newErrors.password = "Password must be at least 6 characters";
      if (newPassword !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSendEmailReset = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Reset link sent successfully to your email");
        router.push("/login");
      } else {
        toast.error(data.message || "Failed to send reset link");
      }

    } catch (error) {
      toast.error("Something went wrong");
    }

    setLoading(false);
  };

  const handleSendMobileOtp = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mobile: mobileNumber,
          countryCode: countryCode,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("OTP sent to your mobile number");
        setStep("otp");
      } else {
        toast.error(data.message || "Failed to send OTP");
      }
    } catch (err: any) {
      toast.error("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "/api/kleverapi/forget-password-mobile/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            mobile: mobileNumber,
            otp: otp,
            countryCode: countryCode
          })
        }
      );

      const data = await res.json();
      console.log(">>> VERIFY OTP CLIENT DATA:", data);

      if (res.ok) {
        toast.success("OTP verified successfully");
        const token = typeof data === "string" ? data : (data.resetToken || data.token || "");
        setResetToken(token);
        setStep("reset");
      } else {
        toast.error(data.message || "Invalid OTP");
      }
    } catch (error) {
      toast.error("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setLoading(true);
    setErrors({});

    // 1. Prepare only the required fields as per specifications
    const payload = {
      resetToken: resetToken,
      newPassword: newPassword,
      confirmPassword: confirmPassword,
    };

    console.log(">>> RESET PASSWORD: Submitting request...", payload);

    try {
      // 2. Send POST request to the reset API
      const res = await fetch("/api/kleverapi/forget-password-mobile/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log(">>> RESET PASSWORD: Response status:", res.status);
      console.log(">>> RESET PASSWORD: Response data:", data);

      if (res.ok) {
        // 3. Success handling
        toast.success("Password reset successfully!");
        console.log(">>> RESET PASSWORD: Success");

        // Brief delay before redirecting to login
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        // 4. API Error handling
        const errorMessage = data.message || data.error || "Failed to reset password. Please try again.";
        toast.error(errorMessage);
        console.error(">>> RESET PASSWORD: API Error:", errorMessage);
      }
    } catch (error: any) {
      // 5. Network or unexpected error handling
      console.error(">>> RESET PASSWORD: Exception occurred:", error);
      toast.error("An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (step === "input") {
      if (resetMode === "email") handleSendEmailReset();
      else handleSendMobileOtp();
    } else if (step === "otp") {
      handleVerifyOtp();
    } else if (step === "reset") {
      handleResetPassword();
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex flex-col font-['Rubik']">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 md:p-10">
        <div className="w-full max-w-[450px] bg-white rounded-[3px] shadow-lg border border-gray-100 flex flex-col overflow-hidden">

          {/* Header Section */}
          <div className="p-6 md:p-8 flex flex-col gap-6">
            <div className="pb-4 border-b-[0.80px] border-gray-200">
              <div className="text-black text-lg font-bold uppercase tracking-wide">
                {step === 'input' ? 'Forgot Password' : step === 'otp' ? 'Verify OTP' : 'Reset Password'}
              </div>
            </div>

            {step === 'input' && (
              <div className="flex rounded-[5px] overflow-hidden border border-gray-100">

                <button
                  type="button"
                  className={`flex-1 py-3.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${resetMode === 'mobile' ? 'bg-black text-white' : 'bg-neutral-100 text-black hover:bg-neutral-200'}`}
                  onClick={() => { setResetMode("mobile"); setErrors({}); }}
                >
                  Login with OTP
                </button>
                <button
                  type="button"
                  className={`flex-1 py-3.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${resetMode === 'email' ? 'bg-black text-white' : 'bg-neutral-100 text-black hover:bg-neutral-200'}`}
                  onClick={() => { setResetMode("email"); setErrors({}); }}
                >
                  Login with Email
                </button>
              </div>
            )}
          </div>

          {/* Form Content Section */}
          <div className="px-6 md:px-8 pb-8 flex flex-col gap-6">
            <div className="text-gray-600 text-xs font-normal leading-4">
              {step === 'input'
                ? (resetMode === 'email' ? "Enter your email address to receive a reset link." : "Enter your mobile number to receive a verification code.")
                : step === 'otp' ? `Enter the verification code sent to ${countryCode} ${mobileNumber}`
                  : "Enter your new password below to reset your account access."}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

              {/* Step: Input Email or Mobile */}
              {step === "input" && (
                <>
                  {resetMode === "email" ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1">
                        <span className="text-black text-xs font-semibold uppercase tracking-tight">Email</span>
                        <span className="text-red-600 text-xl font-semibold leading-none mt-1">*</span>
                      </div>
                      <input
                        id="email-input"
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: "" }); }}
                        className={`w-full h-11 bg-white px-3 text-sm rounded-[1px] outline outline-1 transition-all cursor-text ${errors.email ? 'outline-red-500' : 'outline-neutral-200 focus:outline-black focus:outline-2 focus:ring-1 focus:ring-black'}`}
                      />
                      {errors.email && <span className="text-red-500 text-[11px] font-medium leading-none">{errors.email}</span>}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5 relative">
                      <div className="flex items-center gap-1">
                        <span className="text-black text-xs font-semibold uppercase tracking-tight">Mobile Number</span>
                        <span className="text-red-600 text-xl font-semibold leading-none mt-1">*</span>
                      </div>
                      <div className={`flex h-11 bg-white rounded-[1px] outline outline-1 transition-all overflow-visible ${errors.mobile ? 'outline-red-500' : 'outline-neutral-200 focus-within:outline-black focus-within:outline-2'}`}>
                        <div
                          className="bg-[#f5f5f5] px-3 flex items-center gap-2 border-r border-neutral-200 cursor-pointer min-w-[100px] hover:bg-neutral-200 transition-colors"
                          onClick={() => setShowDropdown(!showDropdown)}
                        >
                          <span className={`${selectedCountry?.flagClass} scale-110`}></span>
                          <span className="text-[#e02b27] font-bold text-xs">{selectedCountry?.code}</span>
                          <span className="text-[8px] text-gray-500">▼</span>
                        </div>
                        <input
                          id="mobile-input"
                          type="tel"
                          placeholder="Mobile Number"
                          value={mobileNumber}
                          onChange={(e) => { setMobileNumber(e.target.value.replace(/\D/g, "")); if (errors.mobile) setErrors({ ...errors, mobile: '' }); }}
                          className="flex-1 px-3 text-sm outline-none cursor-text"
                        />

                        {showDropdown && (
                          <div className="absolute top-[75px] left-0 w-full bg-white border border-neutral-300 shadow-2xl z-[9999] rounded-[2px] overflow-hidden">
                            {COUNTRY_CODES.map((item) => (
                              <div
                                key={item.code}
                                onClick={() => { setCountryCode(item.code); setShowDropdown(false); }}
                                className="p-3.5 hover:bg-neutral-100 cursor-pointer flex items-center gap-3 border-b last:border-0 border-neutral-100 transition-colors"
                              >
                                <span className={item.flagClass}></span>
                                <span className="text-xs font-bold text-black">{item.code}</span>
                                <span className="text-[10px] text-gray-400 italic">{item.country}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {errors.mobile && <span className="text-red-500 text-[11px] font-medium leading-none">{errors.mobile}</span>}
                    </div>
                  )}
                </>
              )}

              {/* Step: OTP Verification */}
              {step === "otp" && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1">
                    <span className="text-black text-xs font-semibold uppercase tracking-tight">Verification Code</span>
                    <span className="text-red-600 text-xl font-semibold leading-none mt-1">*</span>
                  </div>
                  <input
                    id="otp-input"
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value); if (errors.otp) setErrors({ ...errors, otp: "" }); }}
                    className={`w-full h-11 bg-white px-3 text-sm text-center font-bold tracking-[8px] rounded-[1px] outline outline-1 transition-all placeholder:tracking-normal placeholder:font-normal cursor-text ${errors.otp ? 'outline-red-500' : 'outline-neutral-200 focus:outline-black focus:outline-2 focus:ring-1 focus:ring-black'}`}
                  />
                  {errors.otp && <span className="text-red-500 text-[11px] font-medium leading-none">{errors.otp}</span>}
                  <button
                    type="button"
                    onClick={handleSendMobileOtp}
                    className="text-amber-600 text-[11px] font-semibold text-right mt-1 hover:underline cursor-pointer"
                  >
                    Resend Code?
                  </button>
                </div>
              )}

              {/* Step: New Password */}
              {step === "reset" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1">
                      <span className="text-black text-xs font-semibold uppercase tracking-tight">New Password</span>
                      <span className="text-red-600 text-xl font-semibold leading-none mt-1">*</span>
                    </div>
                    <input
                      id="new-password-input"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: "" }); }}
                      className={`w-full h-11 bg-white px-3 text-sm rounded-[1px] outline outline-1 transition-all cursor-text ${errors.password ? 'outline-red-500' : 'outline-neutral-200 focus:outline-black focus:outline-2 focus:ring-1 focus:ring-black'}`}
                    />
                    {errors.password && <span className="text-red-500 text-[11px] font-medium leading-none">{errors.password}</span>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1">
                      <span className="text-black text-xs font-semibold uppercase tracking-tight">Confirm Password</span>
                      <span className="text-red-600 text-xl font-semibold leading-none mt-1">*</span>
                    </div>
                    <input
                      id="confirm-password-input"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" }); }}
                      className={`w-full h-11 bg-white px-3 text-sm rounded-[1px] outline outline-1 transition-all cursor-text ${errors.confirmPassword ? 'outline-red-500' : 'outline-neutral-200 focus:outline-black focus:outline-2 focus:ring-1 focus:ring-black'}`}
                    />
                    {errors.confirmPassword && <span className="text-red-500 text-[11px] font-medium leading-none">{errors.confirmPassword}</span>}
                  </div>
                </>
              )}

              <div className="flex flex-col gap-4 mt-2">
                <button
                  id="submit-button"
                  type="submit"
                  disabled={loading || reduxLoading}
                  className="w-full h-12 bg-amber-400 hover:bg-amber-500 rounded-[3px] flex justify-center items-center transition-all disabled:opacity-50 shadow-sm active:scale-[0.98] cursor-pointer"
                >
                  <div className="text-center text-black text-[13px] font-bold uppercase tracking-wider cursor-pointer">
                    {loading || reduxLoading ? 'Sending...' : (
                      step === 'input' ? (resetMode === 'email' ? 'Send Reset Link' : 'Send OTP') :
                        step === 'otp' ? 'Verify OTP' : 'Reset Password'
                    )}
                  </div>
                </button>

                <div className="flex justify-between items-center">
                  <Link href="/login">
                    <div className="text-black text-sm font-normal cursor-pointer hover:underline hover:text-amber-600 transition-colors">
                      Back to Login
                    </div>
                  </Link>
                  {step !== 'input' && (
                    <button
                      type="button"
                      onClick={() => setStep('input')}
                      className="text-gray-500 text-sm font-normal cursor-pointer hover:underline"
                    >
                      Change Method
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}