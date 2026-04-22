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

import CountryDropdown from "@/app/components/CountryDropdown";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 bg-[#f4f4f4] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-primary"></div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, isRtl } = useTranslation();
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
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Hide the scrollbar visually on the login page only, without locking
  // scroll itself (mobile viewports often can't fit the form vertically,
  // so the user MUST be able to scroll).
  useEffect(() => {
    document.body.classList.add('scrollbar-hide');
    return () => document.body.classList.remove('scrollbar-hide');
  }, []);

  useEffect(() => {
    const qp = searchParams.get("mode");
    if (qp === "otp" || qp === "password") {
      setMode(qp);
    }
  }, [searchParams]);

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

    const locale = window.location.pathname.startsWith('/ar') ? 'ar' : 'en';

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
          locale,
          redirect: false,
        });

        if (res?.ok) {
          for (let i = 0; i < 15; i++) {
            const session: any = await getSession();
            if (session?.accessToken) break;
            await new Promise(r => setTimeout(r, 200));
          }
          toast.success(t("login.loginSuccess"));
          const callbackUrl = searchParams.get("callbackUrl") || `/${locale}/products`;
          window.location.href = callbackUrl;
        } else {
          localStorage.removeItem("token");
          toast.error(t("login.loginFailed"));
        }
      } catch (err: any) {
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
          locale,
          redirect: false,
        });

        if (res?.ok) {
          for (let i = 0; i < 15; i++) {
            const session: any = await getSession();
            if (session?.accessToken) break;
            await new Promise(r => setTimeout(r, 200));
          }
          toast.success(t("login.loginSuccess"));
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
    <div className="flex-1 w-full min-h-full bg-[#f4f4f4] flex flex-col">
      <main className="flex-1 w-full flex justify-center items-start pt-6 sm:pt-8 md:pt-16 pb-8 sm:pb-12 px-4 md:px-0">
        <div className="w-full max-w-[440px] bg-white rounded-[3px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100">
          <div className="px-4 sm:px-6 md:px-8 pt-5 sm:pt-7 pb-4 sm:pb-5">
            <div className="text-left">
              <h1 className="text-[17px] sm:text-[18px] font-black tracking-[0.5px] uppercase text-black">
                {t("login.title")}
              </h1>
            </div>
          </div>

          <div className="px-4 sm:px-6 md:px-8">
            <div className="flex w-full rounded-[3px] overflow-hidden border border-gray-200">
              <button
                type="button"
                className={`flex-1 min-w-0 px-2 py-2.5 sm:py-[14px] text-center text-[11px] sm:text-body font-semibold uppercase tracking-normal sm:tracking-wider leading-tight break-words transition-all cursor-pointer ${mode === 'otp' ? 'bg-primary text-black' : 'bg-white text-black hover:bg-gray-50'}`}
                onClick={() => { setMode("otp"); setOtpSent(false); setErrors({}); window.history.replaceState(null, "", lp("/login?mode=otp")); }}
              >
                {t("login.modeOtp")}
              </button>
              <button
                type="button"
                className={`flex-1 min-w-0 px-2 py-2.5 sm:py-[14px] text-center text-[11px] sm:text-body font-semibold uppercase tracking-normal sm:tracking-wider leading-tight break-words transition-all cursor-pointer border-l border-gray-100 ${mode === 'password' ? 'bg-primary text-black' : 'bg-white text-black hover:bg-gray-50'}`}
                onClick={() => { setMode("password"); setOtpSent(false); setErrors({}); window.history.replaceState(null, "", lp("/login?mode=password")); }}
              >
                {t("login.modePassword")}
              </button>
            </div>
          </div>

          <div className="px-4 sm:px-6 md:px-8 pt-4 sm:pt-5 pb-6 sm:pb-8">
            <p className="text-body text-black/60 font-semibold leading-relaxed mb-5">
              {mode === 'password' ? t("login.signInWithEmail") : t("login.signInWithMobile")}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-[14px]" noValidate>
              {mode === 'password' ? (
                <>
                  <div className="flex flex-col gap-[5px]">
                    <label className="block text-body font-semibold text-black uppercase tracking-widest cursor-pointer">
                      {t("login.emailLabel")} <span className="text-red-600 font-bold">*</span>
                    </label>
                    <input
                      id="email-input"
                      type="email"
                      placeholder={t("login.emailPlaceholder")}
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: '' }); }}
                      className={`w-full h-[48px] bg-white px-3 text-body border transition-all outline-none cursor-text font-semibold placeholder:font-normal ${errors.email ? 'border-red-500' : 'border-gray-300 focus:border-gray-600'}`}
                    />
                    {errors.email && <span className="text-red-500 text-label font-semibold text-[13px]">{errors.email}</span>}
                  </div>

                  <div className="flex flex-col gap-[5px]">
                    <label className="block text-body font-semibold text-black uppercase tracking-widest cursor-pointer">
                      {t("login.passwordLabel")} <span className="text-red-600 font-bold">*</span>
                    </label>
                    <input
                      id="password-input"
                      type="password"
                      placeholder={t("login.passwordPlaceholder")}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: '' }); }}
                      className={`w-full h-[48px] bg-white px-3 text-body border transition-all outline-none cursor-text font-semibold placeholder:font-normal ${errors.password ? 'border-red-500' : 'border-gray-300 focus:border-gray-600'}`}
                    />
                    {errors.password && <span className="text-red-500 text-label font-semibold text-[13px]">{errors.password}</span>}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-[5px] relative">
                    <label className="block text-body font-semibold text-black uppercase tracking-widest">
                      {t("login.mobileNumberLabel")} <span className="text-red-600 font-bold">*</span>
                    </label>
                    <div
                      dir="ltr"
                      className={`relative flex flex-row items-stretch w-full h-[46px] sm:h-[48px] bg-white border transition-all ${errors.mobile ? 'border-red-500' : 'border-gray-300 focus-within:border-gray-600'}`}
                    >
                      <CountryDropdown
                        selectedCountryCode={countryCode}
                        onSelect={(code) => setCountryCode(code)}
                      />
                      <input
                        id="mobile-input-login"
                        type="tel"
                        dir="ltr"
                        inputMode="numeric"
                        placeholder={t("login.mobilePlaceholder")}
                        value={mobileNumber}
                        onChange={(e) => { setMobileNumber(e.target.value.replace(/\D/g, "")); if (errors.mobile) setErrors({ ...errors, mobile: '' }); }}
                        className={`flex-1 min-w-0 px-3 text-body outline-none bg-transparent cursor-text font-semibold placeholder:font-normal ${isRtl ? 'text-right' : 'text-left'}`}
                      />
                    </div>
                    {errors.mobile && <span className="text-red-500 text-label font-bold text-[13px]">{errors.mobile}</span>}
                  </div>

                  {otpSent && (
                    <div className="flex flex-col gap-[5px]">
                      <label className="block text-body font-semibold text-black uppercase tracking-widest">
                        {t("login.verificationCode")} <span className="text-red-600 font-bold">*</span>
                      </label>
                      <input
                        id="otp-input"
                        type="text"
                        value={otp}
                        onChange={(e) => { setOtp(e.target.value); if (errors.otp) setErrors({ ...errors, otp: '' }); }}
                        className={`w-full h-[48px] bg-white px-3 text-body border transition-all outline-none text-center font-semibold tracking-[8px] cursor-text placeholder:font-normal placeholder:tracking-normal ${errors.otp ? 'border-red-500' : 'border-gray-300 focus:border-gray-600'}`}
                        placeholder={t("login.enterOtp")}
                      />
                      {errors.otp && <span className="text-red-500 text-label font-bold text-[13px]">{errors.otp}</span>}
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
                  className="w-full h-10 sm:h-[46px] bg-primary hover:bg-primaryHover text-black font-semibold uppercase transition-all disabled:opacity-50 cursor-pointer active:scale-[0.98] tracking-widest text-body rounded-sm"
                >
                  {mode === 'otp' && !otpSent ? t("forgotPassword.sendOtp") : (loading || reduxLoading ? t("login.pleaseWait") : t("login.signIn"))}
                </button>

                <div className="text-right">
                  <Link href={lp("/forgot-password")}>
                    <span className="text-body font-semibold text-black/80 hover:text-black cursor-pointer hover:underline underline-offset-2 py-2 inline-block">
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