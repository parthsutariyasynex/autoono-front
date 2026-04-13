// "use client";

// import "intl-tel-input/build/css/intlTelInput.css";
// import { useEffect, useState } from "react";
// import { useSearchParams, useRouter } from "next/navigation";
// import Link from "next/link";
// import { signIn, useSession } from "next-auth/react";
// import toast from "react-hot-toast";
// import { useAppDispatch, useAppSelector } from "@/store/hooks";
// import { sendOtp } from "@/store/actions/authActions";
// import { RootState } from "@/store/store";


// const COUNTRY_CODES = [
//   { code: "+966", country: "Saudi Arabia", iso: "sa", flagClass: "iti__flag iti__sa" },
//   { code: "+91", country: "India", iso: "in", flagClass: "iti__flag iti__in" },
//   { code: "+971", country: "United Arab Emirates", iso: "ae", flagClass: "iti__flag iti__ae" },
// ];

// export default function LoginPage() {
//   const searchParams = useSearchParams();
//   const router = useRouter();
//   const [mode, setMode] = useState<"password" | "otp">("password");

//   const { data: session, status } = useSession();
//   const dispatch = useAppDispatch();
//   const { loading: reduxLoading } = useAppSelector((state: RootState) => state.auth);
//   const [loading, setLoading] = useState(false);

//   // Auto-redirect if already logged in
//   useEffect(() => {
//     if (status === "authenticated") {
//       const callbackUrl = searchParams.get("callbackUrl") || "/products";
//       router.replace(callbackUrl);
//     }
//   }, [status, router, searchParams]);

//   // Form State
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [countryCode, setCountryCode] = useState("+966");
//   const [mobileNumber, setMobileNumber] = useState("");
//   const [otpSent, setOtpSent] = useState(false);
//   const [otp, setOtp] = useState("");
//   const [showDropdown, setShowDropdown] = useState(false);

//   // Validation Errors
//   const [errors, setErrors] = useState<{ [key: string]: string }>({});

//   useEffect(() => {
//     const qp = searchParams.get("mode");
//     if (qp === "otp" || qp === "password") {
//       setMode(qp);
//     }
//   }, [searchParams]);

//   const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode);

//   const validate = () => {
//     const newErrors: { [key: string]: string } = {};
//     if (mode === "password") {
//       if (!email) newErrors.email = "Email is required";
//       else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Invalid email format";
//       if (!password) newErrors.password = "Password is required";
//     } else {
//       if (!mobileNumber) newErrors.mobile = "Mobile number is required";
//       if (otpSent && !otp) newErrors.otp = "OTP is required";
//     }
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSendOtp = async (e: React.MouseEvent) => {
//     e.preventDefault();
//     setErrors({});
//     if (!mobileNumber) {
//       setErrors({ mobile: "Mobile number is required" });
//       return;
//     }
//     // Mobile and country code alag moklva
//     dispatch(sendOtp(mobileNumber, countryCode, (err, data) => {
//       if (!err) {
//         toast.success(t("login.otpSent"));
//         setOtpSent(true);
//       } else {
//         toast.error(err || "Failed to send OTP");
//       }
//     }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!validate()) return;

//     setLoading(true);

//     if (mode === "password") {
//       try {
//         // Step 1: Get token directly from Magento API
//         console.log("[LOGIN] Step 1: Fetching token from Magento...");
//         const magentoRes = await fetch("/api/kleverapi/login", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ username: email, password }),
//         });
//         console.log("[LOGIN] Magento response status:", magentoRes.status);
//         const magentoData = await magentoRes.json();
//         console.log("[LOGIN] Magento response data:", magentoData);
//         console.log("[LOGIN] Magento data type:", typeof magentoData);

//         const magentoToken = typeof magentoData === "string"
//           ? magentoData.replace(/"/g, "").trim()
//           : magentoData?.token || magentoData;

//         console.log("[LOGIN] Extracted token:", magentoToken ? "found" : "MISSING");

//         if (magentoRes.ok && magentoToken) {
//           const cleanToken = String(magentoToken).replace(/"/g, "").trim();
//           localStorage.setItem("token", cleanToken);
//           console.log("[LOGIN] Token stored in localStorage:", cleanToken.substring(0, 20) + "...");
//         } else {
//           console.error("[LOGIN] Failed to get token from Magento");
//         }

//         // Step 2: Also do NextAuth signIn for session/middleware
//         console.log("[LOGIN] Step 2: NextAuth signIn...");
//         const res = await signIn("credentials", {
//           email,
//           password,
//           redirect: false,
//         });
//         console.log("[LOGIN] NextAuth result:", res);

//         if (res?.ok) {
//           console.log("[LOGIN] Success! localStorage token:", localStorage.getItem("token") ? "SET" : "MISSING");
//           toast.success("Login Successful");
//           // Use window.location for full page reload — ensures NextAuth JWT cookie
//           // is sent with the request so middleware sees authenticated state on Vercel
//           const callbackUrl = searchParams.get("callbackUrl") || "/products";
//           window.location.href = callbackUrl;
//         } else {
//           localStorage.removeItem("token");
//           toast.error("Login failed. Please check your credentials.");
//         }
//       } catch {
//         toast.error("Login failed. Please try again.");
//       } finally {
//         setLoading(false);
//       }
//     } else {
//       // OTP Login
//       try {
//         // Step 1: Get token via OTP API
//         const otpRes = await fetch("/api/login-otp", {
//           method: "POST",
//           headers: { "Content-Type": "application/json", "platform": "web" },
//           body: JSON.stringify({ mobile: mobileNumber, otp, countryCode }),
//         });
//         const otpData = await otpRes.json();
//         const otpToken = otpData?.token || (otpData?.customer?.token);

//         if (otpRes.ok && otpToken) {
//           localStorage.setItem("token", String(otpToken).trim());
//         }

//         // Step 2: Also do NextAuth signIn for session/middleware
//         const res = await signIn("credentials", {
//           mobile: mobileNumber,
//           otp: otp,
//           countryCode: countryCode,
//           redirect: false,
//         });

//         if (res?.ok) {
//           toast.success("Login Successful");
//           const callbackUrl = searchParams.get("callbackUrl") || "/products";
//           window.location.href = callbackUrl;
//         } else {
//           localStorage.removeItem("token");
//           toast.error(res?.error || "Login Failed. Invalid OTP.");
//         }
//       } catch (err) {
//         toast.error("Login failed. Please try again.");
//       } finally {
//         setLoading(false);
//       }
//     }
//   };

//   return (
//     <div className="flex-1 bg-[#f4f4f4] flex flex-col font-['Rubik']">


//       {/* <main className="flex-1 flex items-center justify-center py-12 px-4 md:px-0"> */}
//       <main className="flex-1 flex justify-center pt-24 pb-16 px-4 md:px-0">
//         <div className="w-full max-w-[400px] bg-white rounded-[3px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden">
//           {/* Header Section */}
//           <div className="p-8 pb-4">
//             <div className="text-left border-b border-gray-100 pb-2">
//               <h1 className="text-[20px] font-black tracking-tight uppercase text-gray-900">
//                 Registered Customers
//               </h1>
//             </div>
//           </div>

//           {/* Login Tabs */}
//           <div className="px-8 flex">
//             <div className="flex w-full rounded-[5px] overflow-hidden border border-gray-100 bg-gray-50/50 p-1">
//               <button
//                 type="button"
//                 className={`flex-1 py-3 text-[12px] font-bold uppercase tracking-wider transition-all cursor-pointer rounded-[4px] ${mode === 'otp' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-black hover:bg-gray-200/50'}`}
//                 onClick={() => { setMode("otp"); setOtpSent(false); setErrors({}); router.push(lp("/login?mode=otp"), { scroll: false }); }}
//               >
//                 Login With OTP
//               </button>
//               <button
//                 type="button"
//                 className={`flex-1 py-3 text-[12px] font-bold uppercase tracking-wider transition-all cursor-pointer rounded-[4px] ${mode === 'password' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-black hover:bg-gray-200/50'}`}
//                 onClick={() => { setMode("password"); setOtpSent(false); setErrors({}); router.push(lp("/login?mode=password"), { scroll: false }); }}
//               >
//                 Login With Password
//               </button>
//             </div>
//           </div>

//           <div className="p-8 pt-6">
//             <p className="text-[13px] text-gray-500 font-medium leading-relaxed mb-6">
//               {mode === 'password'
//                 ? "If you have an account, sign in with your email address."
//                 : "If you have an account, sign in with your mobile number."}
//             </p>

//             <form onSubmit={handleSubmit} className="space-y-5" noValidate>
//               {mode === 'password' && (
//                 <>
//                   <div className="space-y-2">
//                     <label className="block text-[12px] font-black text-gray-900 uppercase tracking-wide cursor-pointer">
//                       Email <span className="text-red-600 text-lg">*</span>
//                     </label>
//                     <input
//                       id="email-input"
//                       type="email"
//                       placeholder="Enter your email"
//                       value={email}
//                       onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: '' }); }}
//                       className={`w-full h-12 bg-white px-4 text-sm rounded-[1px] outline outline-1 transition-all cursor-text ${errors.email ? 'outline-red-500' : 'outline-gray-200 focus:outline-black focus:outline-2 focus:ring-1 focus:ring-black'}`}
//                     />
//                     {errors.email && <span className="text-red-500 text-[11px] font-bold">{errors.email}</span>}
//                   </div>

//                   <div className="space-y-2">
//                     <label className="block text-[12px] font-black text-gray-900 uppercase tracking-wide cursor-pointer">
//                       Password <span className="text-red-600 text-lg">*</span>
//                     </label>
//                     <input
//                       id="password-input"
//                       type="password"
//                       placeholder="Enter your password"
//                       value={password}
//                       onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: '' }); }}
//                       className={`w-full h-12 bg-white px-4 text-sm rounded-[1px] outline outline-1 transition-all cursor-text ${errors.password ? 'outline-red-500' : 'outline-gray-200 focus:outline-black focus:outline-2 focus:ring-1 focus:ring-black'}`}
//                     />
//                     {errors.password && <span className="text-red-500 text-[11px] font-bold">{errors.password}</span>}
//                   </div>
//                 </>
//               )}

//               {mode === 'otp' && (
//                 <>
//                   <div className="space-y-2 relative">
//                     <label className="block text-[12px] font-black text-gray-900 uppercase tracking-wide">
//                       Mobile Number <span className="text-red-600 text-lg">*</span>
//                     </label>
//                     <div className={`flex h-12 bg-white rounded-[1px] outline outline-1 transition-all ${errors.mobile ? 'outline-red-500' : 'outline-gray-200 focus-within:outline-black focus-within:outline-2'}`}>
//                       <div
//                         className="bg-gray-50 px-4 flex items-center gap-2 border-r border-gray-200 cursor-pointer min-w-[100px] hover:bg-gray-100 transition-colors"
//                         onClick={() => setShowDropdown(!showDropdown)}
//                       >
//                         <span className={`${selectedCountry?.flagClass} scale-110`}></span>
//                         <span className="text-gray-900 font-black text-xs">{selectedCountry?.code}</span>
//                         <span className="text-[10px] text-gray-400">▼</span>
//                       </div>
//                       <input
//                         id="mobile-input"
//                         type="tel"
//                         placeholder={t("login.mobilePlaceholder")}
//                         value={mobileNumber}
//                         onChange={(e) => { setMobileNumber(e.target.value.replace(/\D/g, "")); if (errors.mobile) setErrors({ ...errors, mobile: '' }); }}
//                         className="flex-1 px-4 text-sm outline-none bg-transparent cursor-text font-medium"
//                       />

//                       {showDropdown && (
//                         <div className="absolute top-[80px] left-0 w-full bg-white border border-gray-200 shadow-2xl z-50 rounded-[2px] overflow-hidden">
//                           {COUNTRY_CODES.map((item) => (
//                             <div
//                               key={item.code}
//                               onClick={() => { setCountryCode(item.code); setShowDropdown(false); }}
//                               className="p-4 hover:bg-gray-50 cursor-pointer flex items-center gap-4 border-b last:border-0 border-gray-100 transition-colors"
//                             >
//                               <span className={`${item.flagClass} scale-110`}></span>
//                               <span className="text-xs font-black text-gray-900">{item.code}</span>
//                               <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{item.country}</span>
//                             </div>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                     {errors.mobile && <span className="text-red-500 text-[11px] font-bold">{errors.mobile}</span>}
//                   </div>

//                   {otpSent && (
//                     <div className="space-y-2">
//                       <label className="block text-[12px] font-black text-gray-900 uppercase tracking-wide">
//                         Verification Code <span className="text-red-600 text-lg">*</span>
//                       </label>
//                       <input
//                         id="otp-input"
//                         type="text"
//                         value={otp}
//                         onChange={(e) => { setOtp(e.target.value); if (errors.otp) setErrors({ ...errors, otp: '' }); }}
//                         className={`w-full h-12 bg-white px-4 text-sm rounded-[1px] outline outline-1 transition-all text-center font-black tracking-[8px] cursor-text placeholder:font-normal placeholder:tracking-normal ${errors.otp ? 'outline-red-500' : 'outline-gray-200 focus:outline-black focus:outline-2 focus:ring-1 focus:ring-black'}`}
//                         placeholder={t("login.enterOtp")}
//                       />
//                       {errors.otp && <span className="text-red-500 text-[11px] font-bold">{errors.otp}</span>}
//                     </div>
//                   )}
//                 </>
//               )}

//               <div className="pt-4 flex flex-col gap-4">
//                 <button
//                   id="submit-button"
//                   type={mode === 'otp' && !otpSent ? 'button' : 'submit'}
//                   disabled={loading || reduxLoading}
//                   onClick={mode === 'otp' && !otpSent ? handleSendOtp : undefined}
//                   className="w-full h-[55px] bg-[#f5b21a] hover:bg-[#e0a218] text-black font-black uppercase transition-all rounded-[3px] shadow-lg shadow-yellow-500/10 disabled:opacity-50 cursor-pointer active:scale-[0.98] tracking-widest text-[13px]"
//                 >
//                   {mode === 'otp' && !otpSent ? t("forgotPassword.sendOtp") : (loading || reduxLoading ? t("login.pleaseWait") : t("login.signIn"))}
//                 </button>

//                 <div className="text-center pt-2">
//                   <Link href={lp("/forgot-password")}>
//                     <span className="text-xs font-bold text-[#003d7e] hover:text-[#002a56] cursor-pointer hover:underline underline-offset-4 uppercase tracking-tighter">
//                       {t("login.forgotPassword")}
//                     </span>
//                   </Link>
//                 </div>
//               </div>
//             </form>
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }
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
import { useLocale } from "@/lib/i18n/client";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocalePath } from "@/hooks/useLocalePath";


const COUNTRY_CODES = [
  { code: "+966", country: "Saudi Arabia", arCountry: "المملكة العربية السعودية", iso: "sa", flagClass: "iti__flag iti__sa" },
  { code: "+91", country: "India", arCountry: "الهند", iso: "in", flagClass: "iti__flag iti__in" },
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

  // If user lands on /login but is already authenticated (e.g. back button),
  // redirect them away. Uses window.location.href (full reload) to ensure
  // cookies are properly read by middleware — never use router.replace here
  // as it causes a race condition with handleSubmit's own redirect.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session]);

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
          // Wait for NextAuth JWT cookie to be set before navigating
          // Prevents race condition where token isn't ready on next page
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
    <div className="min-h-[calc(100vh-108px)] bg-[#f4f4f4] flex flex-col font-['Rubik']">

      <main className="flex-1 flex justify-center items-start pt-8 md:pt-16 pb-12 px-4 md:px-0">

        {/* ── CHANGE: max-w-[400px]→max-w-[440px] for slightly more room ── */}
        <div className="w-full max-w-[440px] bg-white rounded-[3px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden">

          {/* Header Section */}
          {/* ── CHANGE: p-8 pb-4 → px-8 pt-7 pb-5 ── */}
          <div className="px-4 sm:px-6 md:px-8 pt-5 sm:pt-7 pb-4 sm:pb-5">
            {/* ── CHANGE: removed border-b and pb-2 (no more bottom line) ── */}
            <div className="text-left">
              {/* ── CHANGE: text-[20px] → text-[15px], tracking-tight → tracking-widest ── */}
              <h1 className="text-[15px] font-medium tracking-widest uppercase text-gray-900">
                {t("login.title")}
              </h1>
            </div>
          </div>

          {/* Login Tabs */}
          {/* ── CHANGE: kept px-8, removed flex wrapper (unnecessary) ── */}
          <div className="px-4 sm:px-6 md:px-8">
            <div className="flex w-full rounded-[3px] overflow-hidden border border-gray-200">
              {/* ── CHANGE: removed inner p-1 and bg-gray-50/50 on wrapper;
                   active tab = solid black fill, no rounded corners inside ── */}
              <button
                type="button"
                className={`flex-1 py-[14px] text-[13px] font-medium uppercase tracking-wider transition-all cursor-pointer ${mode === 'otp'
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-900 hover:bg-gray-50'
                  }`}
                onClick={() => { setMode("otp"); setOtpSent(false); setErrors({}); window.history.replaceState(null, "", lp("/login?mode=otp")); }}
              >
                {t("login.modeOtp") || "Login With OTP"}
              </button>
              <button
                type="button"
                className={`flex-1 py-[14px] text-[13px] font-medium uppercase tracking-wider transition-all cursor-pointer border-l border-gray-100 ${mode === 'password'
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-900 hover:bg-gray-50'
                  }`}
                onClick={() => { setMode("password"); setOtpSent(false); setErrors({}); window.history.replaceState(null, "", lp("/login?mode=password")); }}
              >
                {t("login.modePassword") || "Login With Password"}
              </button>
            </div>
          </div>

          {/* ── CHANGE: p-8 pt-6 → px-8 pt-5 pb-8 (unified horizontal padding) ── */}
          <div className="px-4 sm:px-6 md:px-8 pt-4 sm:pt-5 pb-6 sm:pb-8">
            {/* ── CHANGE: text-[13px] → text-[13px] (same), mb-6 → mb-5 ── */}
            <p className="text-[12px] sm:text-[13px] text-gray-500 font-medium leading-relaxed mb-5">
              {mode === 'password'
                ? t("login.signInWithEmail")
                : t("login.signInWithMobile")}
            </p>

            {/* ── CHANGE: space-y-5 → flex flex-col gap-[14px] ── */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-[14px]" noValidate>
              {mode === 'password' && (
                <>
                  {/* ── CHANGE: space-y-2 → flex flex-col gap-[5px] ── */}
                  <div className="flex flex-col gap-[5px]">
                    {/* ── CHANGE: text-[12px] → text-[13px], removed uppercase/tracking ── */}
                    <label className="block text-[13px] font-medium text-gray-900 cursor-pointer">
                      {t("login.emailLabel")} <span className="text-red-600">*</span>
                    </label>
                    {/* ── CHANGE: h-12 → h-10, outline → border, removed rounded-[1px] ── */}
                    <input
                      id="email-input"
                      type="email"
                      placeholder={t("login.emailPlaceholder")}
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: '' }); }}
                      className={`w-full h-[48px] bg-white px-3 text-sm border transition-all outline-none cursor-text ${errors.email ? 'border-red-500' : 'border-gray-300 focus:border-gray-600'
                        }`}
                    />
                    {errors.email && <span className="text-red-500 text-[11px] font-bold">{errors.email}</span>}
                  </div>

                  <div className="flex flex-col gap-[5px]">
                    <label className="block text-[13px] font-medium text-gray-900 cursor-pointer">
                      {t("login.passwordLabel")} <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="password-input"
                      type="password"
                      placeholder={t("login.passwordPlaceholder")}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: '' }); }}
                      className={`w-full h-[48px] bg-white px-3 text-sm border transition-all outline-none cursor-text ${errors.password ? 'border-red-500' : 'border-gray-300 focus:border-gray-600'
                        }`}
                    />
                    {errors.password && <span className="text-red-500 text-[11px] font-bold">{errors.password}</span>}
                  </div>
                </>
              )}

              {mode === 'otp' && (
                <>
                  <div className="flex flex-col gap-[5px] relative">
                    <label className="block text-[13px] font-medium text-gray-900">
                      {t("login.mobileNumberLabel")} <span className="text-red-600">*</span>
                    </label>
                    {/* ── CHANGE: h-12 → h-10, outline → border ── */}
                    <div className={`flex h-[48px] bg-white border transition-all ${errors.mobile ? 'border-red-500' : 'border-gray-300 focus-within:border-gray-600'
                      }`}>
                      <div
                        className="px-4 flex items-center gap-2 border-r border-gray-100 cursor-pointer min-w-[110px] sm:min-w-[120px] hover:bg-gray-50 transition-colors"
                        onClick={() => setShowDropdown(!showDropdown)}
                      >
                        <span className={`${selectedCountry?.flagClass} scale-125`}></span>
                        <span className="text-red-500 font-normal text-[18px]">{selectedCountry?.code}</span>
                        <span className="text-[10px] text-gray-400 ml-auto">▲</span>
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
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-100 shadow-[0_15px_60px_-15px_rgba(0,0,0,0.15)] z-[100] rounded-sm mt-1 sm:min-w-[400px]">
                          {COUNTRY_CODES.map((item) => (
                            <div
                              key={item.code}
                              onClick={() => { setCountryCode(item.code); setShowDropdown(false); }}
                              className="px-4 py-3.5 hover:bg-gray-50 cursor-pointer flex items-center justify-between group border-b last:border-0 border-gray-50"
                            >
                              <div className="flex items-center gap-4">
                                <span className={`${item.flagClass} scale-[1.3]`}></span>
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-[14px] font-normal text-red-500 whitespace-nowrap">{item.country}</span>
                                  <span className="text-[14px] font-normal text-red-500 whitespace-nowrap" dir="rtl">({item.arCountry})</span>
                                </div>
                              </div>
                              <span className="text-[14px] font-normal text-gray-400 whitespace-nowrap">{item.code}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.mobile && <span className="text-red-500 text-[11px] font-bold">{errors.mobile}</span>}
                  </div>

                  {otpSent && (
                    <div className="flex flex-col gap-[5px]">
                      <label className="block text-[13px] font-medium text-gray-900">
                        {t("login.verificationCode")} <span className="text-red-600">*</span>
                      </label>
                      <input
                        id="otp-input"
                        type="text"
                        value={otp}
                        onChange={(e) => { setOtp(e.target.value); if (errors.otp) setErrors({ ...errors, otp: '' }); }}
                        className={`w-full h-10 bg-white px-3 text-sm border transition-all outline-none text-center font-black tracking-[8px] cursor-text placeholder:font-normal placeholder:tracking-normal ${errors.otp ? 'border-red-500' : 'border-gray-300 focus:border-gray-600'
                          }`}
                        placeholder={t("login.enterOtp")}
                      />
                      {errors.otp && <span className="text-red-500 text-[11px] font-bold">{errors.otp}</span>}
                    </div>
                  )}
                </>
              )}

              {/* ── CHANGE: pt-4 → pt-2, gap-4 → gap-3 ── */}
              <div className="pt-2 flex flex-col gap-3">
                {/* ── CHANGE: h-[55px] → h-[46px], removed rounded-[3px] and shadow ── */}
                <button
                  id="submit-button"
                  type={mode === 'otp' && !otpSent ? 'button' : 'submit'}
                  disabled={loading || reduxLoading}
                  onClick={mode === 'otp' && !otpSent ? handleSendOtp : undefined}
                  className="w-full h-10 sm:h-[46px] bg-[#f5b21a] hover:bg-[#e0a218] text-black font-medium uppercase transition-all disabled:opacity-50 cursor-pointer active:scale-[0.98] tracking-widest text-[11px] sm:text-[12px]"
                >
                  {mode === 'otp' && !otpSent ? t("forgotPassword.sendOtp") : (loading || reduxLoading ? t("login.pleaseWait") : t("login.signIn"))}
                </button>

                {/* ── CHANGE: text-center → text-right, removed pt-2, adjusted color ── */}
                <div className="text-right">
                  <Link href={lp("/forgot-password")}>
                    <span className="text-[12px] font-medium text-gray-700 hover:text-black cursor-pointer hover:underline underline-offset-2 py-2 inline-block">
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