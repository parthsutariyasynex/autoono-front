import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getMagentoBaseUrl, isValidLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { SESSION_COOKIE_NAME, CSRF_COOKIE_NAME, CALLBACK_URL_COOKIE_NAME } from "./constants";

/**
 * Decode a Magento JWT token to read its expiry time.
 * Returns the `exp` timestamp (seconds) or null if unreadable.
 */
function getMagentoTokenExpiry(token: string): number | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const payload = JSON.parse(
            Buffer.from(parts[1], "base64").toString("utf-8")
        );
        return payload.exp || null;
    } catch {
        return null;
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Magento",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials) return null;

                const isOtp = !!(credentials as any).otp;
                // Read locale from credentials (passed from login form)
                const credLocale = (credentials as any).locale;
                const locale: Locale = credLocale && isValidLocale(credLocale) ? credLocale : defaultLocale;
                const magentoBase = getMagentoBaseUrl(locale);
                let url = "";
                let body = {};

                if (isOtp) {
                    url = `${magentoBase}/login/otp`;
                    body = {
                        mobile: (credentials as any).mobile,
                        otp: (credentials as any).otp,
                        countryCode: (credentials as any).countryCode
                    };
                } else {
                    url = `${magentoBase}/login/email`;
                    body = {
                        email: (credentials as any).email,
                        password: (credentials as any).password,
                    };
                }

                if (!url) {
                    console.error("Auth URL is not defined");
                    return null;
                }

                try {
                    const headers: any = {
                        "Content-Type": "application/json"
                    };
                    if (isOtp) {
                        headers["platform"] = "web";
                    }

                    const res = await fetch(url, {
                        method: "POST",
                        headers: headers,
                        body: JSON.stringify(body),
                    });

                    const data = await res.json();

                    if (res.ok && data) {
                        const token = isOtp
                            ? (data.token || (data.customer && data.customer.token))
                            : (typeof data === 'string' ? data : data.token);

                        if (!token) {
                            console.error("No token found in successful response.");
                            return null;
                        }

                        const trimmedToken = String(token).trim();

                        return {
                            id: (credentials as any).email || (credentials as any).mobile,
                            email: (credentials as any).email || "",
                            name: (credentials as any).email || (credentials as any).mobile,
                            token: trimmedToken,
                        };
                    }
                    return null;
                } catch (error) {
                    console.error("Auth Error:", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            // First login — save the Magento token
            if (user) {
                token.accessToken = (user as any).token;
                // Store the Magento token expiry so we can detect when it expires
                const exp = getMagentoTokenExpiry((user as any).token);
                if (exp) {
                    token.magentoTokenExp = exp;
                }
            }

            // Check if the Magento token has expired
            if (token.magentoTokenExp) {
                const now = Math.floor(Date.now() / 1000);
                if (now >= (token.magentoTokenExp as number)) {
                    // Magento token expired — force user to re-login
                    // Clear the token so the session becomes invalid
                    console.warn("Magento token expired, forcing re-login");
                    token.accessToken = undefined;
                    token.error = "MagentoTokenExpired";
                }
            }

            return token;
        },
        async session({ session, token }) {
            (session as any).accessToken = token.accessToken;
            (session as any).error = token.error;
            return session;
        },
        /**
         * Strict same-origin redirect policy — prevents logout/login from
         * bouncing to another localhost project. Without this, NextAuth's
         * default falls back to baseUrl when origins don't match, which on
         * shared-cookie localhost setups can land on the wrong port.
         */
        async redirect({ url, baseUrl }) {
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            try {
                if (new URL(url).origin === baseUrl) return url;
            } catch { }
            return baseUrl;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    cookies: {
        sessionToken: {
            name: SESSION_COOKIE_NAME,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
        callbackUrl: {
            name: CALLBACK_URL_COOKIE_NAME,
            options: {
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
        csrfToken: {
            name: CSRF_COOKIE_NAME,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};
