import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

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
                let url = "";
                let body = {};

                if (isOtp) {
                    url = `${process.env.NEXT_PUBLIC_BASE_URL}/login/otp`;
                    body = {
                        mobile: (credentials as any).mobile,
                        otp: (credentials as any).otp,
                        countryCode: (credentials as any).countryCode
                    };
                    console.log("Calling Magento OTP Auth:", url);
                } else {
                    url = process.env.MAGENTO_AUTH_TOKEN_URL || "";
                    body = {
                        username: (credentials as any).email,
                        password: (credentials as any).password,
                    };
                    console.log("Calling Magento Password Auth:", url);
                    console.log("Credentials keys:", Object.keys(credentials as any));
                    console.log("Attempting login for username:", (body as any).username);
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
                    console.log("Magento Auth Response:", data);

                    if (res.ok && data) {
                        const token = isOtp
                            ? (data.token || (data.customer && data.customer.token))
                            : (typeof data === 'string' ? data : data.token);

                        if (!token) {
                            console.error("No token found in successful response. Data:", data);
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
            console.log("JWT callback - user:", user);
            if (user) {
                token.accessToken = (user as any).token;
            }
            console.log("JWT callback - final token:", token);
            return token;
        },
        async session({ session, token }) {
            console.log("Session callback - token:", token);
            (session as any).accessToken = token.accessToken;
            console.log("Session callback - final session:", session);
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET || "yoursecret",
};
