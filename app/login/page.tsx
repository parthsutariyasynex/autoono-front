"use client";

import "intl-tel-input/build/css/intlTelInput.css";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, signOut, useSession, getSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { sendOtp } from "@/store/actions/authActions";
import { RootState } from "@/store/store";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocalePath } from "@/hooks/useLocalePath";

const COUNTRY_CODES = [
  { code: "+966", country: "Saudi Arabia", arCountry: "المملكة العربية السعودية", iso: "sa", flagClass: "iti__flag iti__sa" },
  { code: "+91", country: "India", arCountry: "भारत", iso: "in", flagClass: "iti__flag iti__in" },
  { code: "+971", country: "United Arab Emirates", arCountry: "الإمارات العربية المتحدة", iso: "ae", flagClass: "iti__flag iti__ae" },
];

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 bg-[#f4f4f4] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#f5a623]"></div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const lp = useLocalePath();
  const [mode, setMode] = useState<"password" | "otp">("password");

  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();
  const { loading: reduxLoading } = useAppSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      const sess = session as any;
      if (sess?.error === "MagentoTokenExpired" || !sess?.accessToken) {
        signOut({ redirect: false });
        return;
      }
      const callbackUrl = searchParams.get("callbackUrl") || lp("/products");
      window.location.href = callbackUrl;
    }
  }, [status, session, lp, searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [countryCode, setCountryCode] = useState("+966");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
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
    dispatch(sendOtp(mobileNumber, countryCode, (err, data) => {
      if (!err) {
        toast.success(t("login.otpSent"));
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
        const magentoRes = await fetch("/api/kleverapi/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: email, password }),
        });
        const magentoData = await magentoRes.json();

        const magentoToken = typeof magentoData === "string"
          ? magentoData.replace(/"/g, "").trim()
          : magentoData?.token || magentoData;

        if (magentoRes.ok && magentoToken) {
          const cleanToken = String(magentoToken).replace(/"/g, "").trim();
          localStorage.setItem("token", cleanToken);
        }

        const res = await signIn("credentials", {
          email,
          password,
          locale: window.location.pathname.startsWith('/ar') ? 'ar' : 'en',
          redirect: false,
        });

        if (res?.ok) {
          for (let i = 0; i < 15; i++) {
            const session: any = await getSession();
            if (session?.accessToken) break;
            await new Promise(r => setTimeout(r, 200));
          }
          toast.success(t("login.loginSuccess"));
          const locale = window.location.pathname.startsWith('/ar') ? 'ar' : 'en';
          const callbackUrl = searchParams.get("callbackUrl") || `/${locale}/products`;
          window.location.href = callbackUrl;
        } else {
          localStorage.removeItem("token");
          toast.error(t("login.loginFailed"));
        }
      } catch {
        toast.error(t("login.loginFailed"));
      } finally {
        setLoading(false);
      }
    } else {
      try {
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

        const res = await signIn("credentials", {
          mobile: mobileNumber,
          otp: otp,
          countryCode: countryCode,
          locale: window.location.pathname.startsWith('/ar') ? 'ar' : 'en',
          redirect: false,
        });

        if (res?.ok) {
          for (let i = 0; i < 15; i++) {
            const session: any = await getSession();
            if (session?.accessToken) break;
            await new Promise(r => setTimeout(r, 200));
          }
          toast.success(t("login.loginSuccess"));
          const locale = window.location.pathname.startsWith('/ar') ? 'ar' : 'en';
          const callbackUrl = searchParams.get("callbackUrl") || `/${locale}/products`;
          window.location.href = callbackUrl;
        } else {
          localStorage.removeItem("token");
          toast.error(res?.error || t("login.loginFailed"));
        }
      } catch (err) {
        toast.error(t("login.loginFailed"));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex-1 w-full h-full bg-[#f4f4f4] flex flex-col font-rubik">
      <main className="flex-1 flex justify-center items-start pt-8 md:pt-16 pb-12 px-4 md:px-0">
        <div className="w-full max-w-[440px] bg-white rounded-[3px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden">
          <div className="px-4 sm:px-6 md:px-8 pt-5 sm:pt-7 pb-4 sm:pb-5">
            <div className="text-left">
              <h1 className="text-[17px] sm:text-[18px] font-black tracking-[0.5px] uppercase text-gray-900">
                {t("login.title")}
              </h1>
            </div>
          </div>

          <div className="px-4 sm:px-6 md:px-8">
            <div className="flex w-full rounded-[3px] overflow-hidden border border-gray-200">
              <button
                type="button"
                className={`flex-1 py-[14px] text-[13px] font-black uppercase tracking-wider transition-all cursor-pointer ${mode === 'otp' ? 'bg-black text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
                onClick={() => { setMode("otp"); setOtpSent(false); setErrors({}); window.history.replaceState(null, "", lp("/login?mode=otp")); }}
              >
                {t("login.modeOtp")}
              </button>
              <button
                type="button"
                className={`flex-1 py-[14px] text-[13px] font-black uppercase tracking-wider transition-all cursor-pointer border-l border-gray-100 ${mode === 'password' ? 'bg-black text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
                onClick={() => { setMode("password"); setOtpSent(false); setErrors({}); window.history.replaceState(null, "", lp("/login?mode=password")); }}
              >
                {t("login.modePassword")}
              </button>
            </div>
          </div>

          <div className="px-4 sm:px-6 md:px-8 pt-4 sm:pt-5 pb-6 sm:pb-8">
            <p className="text-[12px] sm:text-[13px] text-gray-500 font-medium leading-relaxed mb-5">
              {mode === 'password' ? t("login.signInWithEmail") : t("login.signInWithMobile")}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-[14px]" noValidate>
              {mode === 'password' && (
                <>
                  <div className="flex flex-col gap-[5px]">
                    <label className="block text-[11px] font-black text-gray-900 uppercase tracking-widest cursor-pointer">
                      {t("login.emailLabel")} <span className="text-red-600 font-bold">*</span>
                    </label>
                    <input
                      id="email-input"
                      type="email"
                      placeholder={t("login.emailPlaceholder")}
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: '' }); }}
                      className={`w-full h-[48px] bg-white px-3 text-sm border transition-all outline-none cursor-text ${errors.email ? 'border-red-500' : 'border-gray-300 focus:border-gray-600'}`}
                    />
                    {errors.email && <span className="text-red-500 text-[11px] font-bold">{errors.email}</span>}
                  </div>

                  <div className="flex flex-col gap-[5px]">
                    <label className="block text-[11px] font-black text-gray-900 uppercase tracking-widest cursor-pointer">
                      {t("login.passwordLabel")} <span className="text-red-600 font-bold">*</span>
                    </label>
                    <input
                      id="password-input"
                      type="password"
                      placeholder={t("login.passwordPlaceholder")}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: '' }); }}
                      className={`w-full h-[48px] bg-white px-3 text-sm border transition-all outline-none cursor-text ${errors.password ? 'border-red-500' : 'border-gray-300 focus:border-gray-600'}`}
                    />
                    {errors.password && <span className="text-red-500 text-[11px] font-bold">{errors.password}</span>}
                  </div>
                </>
              )}

              {mode === 'otp' && (
                <>
                  <div className="flex flex-col gap-[5px] relative">
                    <label className="block text-[11px] font-black text-gray-900 uppercase tracking-widest">
                      {t("login.mobileNumberLabel")} <span className="text-red-600 font-bold">*</span>
                    </label>
                    <div className={`flex h-[48px] bg-white border transition-all ${errors.mobile ? 'border-red-500' : 'border-gray-300 focus-within:border-gray-600'}`}>
                      <div
                        className="px-4 flex items-center gap-2 border-r border-gray-100 cursor-pointer min-w-[110px] sm:min-w-[120px] hover:bg-gray-50 transition-colors"
                        onClick={() => setShowDropdown(!showDropdown)}
                      >
                        <span className={`${selectedCountry?.flagClass}`}></span>
                        <span className="font-black text-xs" style={{ color: '#e02b27' }}>{selectedCountry?.code}</span>
                        <span className="text-[9px] text-gray-400">▼</span>
                      </div>
                      <input
                        id="mobile-input"
                        type="tel"
                        placeholder={t("login.mobilePlaceholder")}
                        value={mobileNumber}
                        onChange={(e) => { setMobileNumber(e.target.value.replace(/\D/g, "")); if (errors.mobile) setErrors({ ...errors, mobile: '' }); }}
                        className="flex-1 px-3 text-sm outline-none bg-transparent cursor-text font-medium"
                      />

                      {showDropdown && (
                        <div className="absolute top-full left-0 w-full min-w-max bg-white border border-gray-100 shadow-[0_15px_60px_-15px_rgba(0,0,0,0.15)] z-[100] rounded-sm mt-1 max-h-60 overflow-y-auto">
                          {COUNTRY_CODES.map((item) => (
                            <div
                              key={item.code}
                              onClick={() => { setCountryCode(item.code); setShowDropdown(false); }}
                              className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between gap-4 group border-b last:border-0 border-gray-50"
                            >
                              <div className="flex items-center gap-3">
                                <span className={`${item.flagClass}`}></span>
                                <span className="text-[14px]" style={{ color: '#e02b27' }}>{item.country} ({item.arCountry})</span>
                              </div>
                              <span className="text-[14px] text-gray-500">{item.code}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.mobile && <span className="text-red-500 text-[11px] font-bold">{errors.mobile}</span>}
                  </div>

                  {otpSent && (
                    <div className="flex flex-col gap-[5px]">
                      <label className="block text-[11px] font-black text-gray-900 uppercase tracking-widest">
                        {t("login.verificationCode")} <span className="text-red-600 font-bold">*</span>
                      </label>
                      <input
                        id="otp-input"
                        type="text"
                        value={otp}
                        onChange={(e) => { setOtp(e.target.value); if (errors.otp) setErrors({ ...errors, otp: '' }); }}
                        className={`w-full h-[48px] bg-white px-3 text-sm border transition-all outline-none text-center font-black tracking-[8px] cursor-text placeholder:font-normal placeholder:tracking-normal ${errors.otp ? 'border-red-500' : 'border-gray-300 focus:border-gray-600'}`}
                        placeholder={t("login.enterOtp")}
                      />
                      {errors.otp && <span className="text-red-500 text-[11px] font-bold">{errors.otp}</span>}
                    </div>
                  )}
                </>
              )}

              <div className="pt-2 flex flex-col gap-3">
                <button
                  id="submit-button"
                  type={mode === 'otp' && !otpSent ? 'button' : 'submit'}
                  disabled={loading || reduxLoading}
                  onClick={mode === 'otp' && !otpSent ? handleSendOtp : undefined}
                  className="w-full h-10 sm:h-[46px] bg-[#f5b21a] hover:bg-[#e0a218] text-black font-black uppercase transition-all disabled:opacity-50 cursor-pointer active:scale-[0.98] tracking-widest text-[11px] sm:text-[12px] rounded-sm"
                >
                  {mode === 'otp' && !otpSent ? t("forgotPassword.sendOtp") : (loading || reduxLoading ? t("login.pleaseWait") : t("login.signIn"))}
                </button>

                <div className="text-right">
                  <Link href={lp("/forgot-password")}>
                    <span className="text-[12px] font-bold text-gray-700 hover:text-black cursor-pointer hover:underline underline-offset-2 py-2 inline-block">
                      {t("login.forgotPassword")}
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