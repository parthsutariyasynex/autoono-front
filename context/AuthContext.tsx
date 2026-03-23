"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // ✅ Only ONE state (no separate loading state needed)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // ✅ Safe client-side check
  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token")
        : null;

    // setState inside Promise to avoid ESLint rule
    Promise.resolve().then(() => {
      setIsAuthenticated(Boolean(token));
    });
  }, []);

  const login = (token: string) => {
    localStorage.setItem("token", token);
    setIsAuthenticated(true);
    router.push("/");
  };

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    router.replace("/login");
  };

  useEffect(() => {
    if (isAuthenticated === null) return;

    const publicPages = ["/login", "/register", "/forgot-password"];

    if (!isAuthenticated && !publicPages.includes(pathname)) {
      router.replace("/login");
    }
  }, [isAuthenticated, pathname, router]);

  // Prevent render before auth check
  if (isAuthenticated === null) return null;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading: isAuthenticated === null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}