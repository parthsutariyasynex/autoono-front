"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { getSession, signOut } from "next-auth/react";

export interface CartItem {
  item_id: number;
  sku: string;
  name: string;
  price: number;
  qty: number;
  image_url: string;
  product_url?: string;
  size_display?: string;
  pattern_display?: string;
  row_total: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax_amount: number;
  tax_label: string;
  grand_total: number;
  currency_code: string;
  items_count: number;
  cart_id: number | string | null;
}

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  addToCart: (sku: string, qty: number) => Promise<void>;
  updateCartItem: (itemId: number, qty: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refetchCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

async function getAuthToken(): Promise<string | null> {
  const session: any = await getSession();
  return session?.accessToken ?? null;
}

function isAuthError(status: number): boolean {
  return status === 401 || status === 403;
}

function handleAuthError() {
  console.warn("Cart: token expired or unauthorized — signing out");
  signOut({ callbackUrl: "/login" });
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setIsLoading(true);
      setError(null);

      const token = await getAuthToken();
      if (!token) {
        setCart(null);
        return;
      }

      const res = await fetch("/api/kleverapi/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const data = await res.json();
      console.log("Cart API response:", data);

      if (!res.ok) {
        if (isAuthError(res.status)) {
          setCart(null);
          handleAuthError();
          return;
        }
        throw new Error(data.message || "Failed to fetch cart");
      }

      // Normalize Magento kleverapi/cart response
      // Sometimes items are in data.items, sometimes in data.cart.items
      const rawItems = Array.isArray(data.items) ? data.items
        : Array.isArray(data.cart?.items) ? data.cart.items
          : [];

      // Ensure each item has the fields requested by the user
      const items: CartItem[] = rawItems.map((item: any) => ({
        item_id: Number(item.item_id),
        sku: item.sku,
        name: item.name,
        price: Number(item.price || 0),
        qty: Number(item.qty || 0),
        image_url: item.image_url || "/images/tyre-sample.png",
        product_url: item.product_url,
        size_display: item.size_display,
        pattern_display: item.pattern_display,
        row_total: Number(item.row_total || 0),
      }));

      const subtotal = Number(data.subtotal ?? data.cart?.subtotal ?? 0);
      const tax_amount = Number(data.tax_amount ?? data.cart?.tax_amount ?? 0);
      const tax_label = data.tax_label ?? data.cart?.tax_label ?? "Tax";
      const grand_total = Number(data.grand_total ?? data.cart?.grand_total ?? subtotal);
      const currency_code = data.currency_code ?? data.cart?.currency_code ?? "SAR";

      // Calculate total units instead of unique SKUs for navbar count
      const items_count = items.reduce((sum: number, i: CartItem) => sum + i.qty, 0);
      const cart_id = data.cart_id ?? data.cart?.cart_id ?? null;

      setCart({ items, subtotal, tax_amount, tax_label, grand_total, currency_code, items_count, cart_id });
    } catch (err) {
      console.error("Fetch Cart Error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (sku: string, qty: number) => {
    try {
      setError(null);
      const token = await getAuthToken();
      if (!token) throw new Error("Not authenticated");

      // Requirement: Send the quantity to add. 
      // Most Cart APIs handle the increment internally if the item already exists.
      const res = await fetch("/api/kleverapi/cart/add", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sku, qty }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (isAuthError(res.status)) { handleAuthError(); return; }
        throw new Error(data.message || "Failed to add item");
      }

      await fetchCart();
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add item");
      throw err;
    }
  };

  const updateCartItem = async (itemId: number, qty: number) => {
    try {
      setError(null);
      const token = await getAuthToken();
      if (!token) throw new Error("Not authenticated");

      // If qty is less than 1, remove the item instead
      if (qty < 1) {
        await removeFromCart(itemId);
        return;
      }

      const res = await fetch(`/api/kleverapi/cart/update/${itemId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qty }),
      });

      if (!res.ok) {
        if (isAuthError(res.status)) { handleAuthError(); return; }
        const data = await res.json();
        throw new Error(data.message || "Failed to update cart");
      }

      // Refetch without showing full-page loader
      await fetchCart(false);
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update cart");
      throw err;
    }
  };

  const removeFromCart = async (itemId: number) => {
    try {
      setError(null);
      const token = await getAuthToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`/api/kleverapi/cart/remove/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (isAuthError(res.status)) { handleAuthError(); return; }
        const data = await res.json();
        throw new Error(data.message || "Failed to remove item");
      }

      await fetchCart();
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove item");
      throw err;
    }
  };

  const clearCart = async () => {
    try {
      setError(null);
      const token = await getAuthToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/kleverapi/cart/clear", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (isAuthError(res.status)) { handleAuthError(); return; }
        const data = await res.json();
        throw new Error(data.message || "Failed to clear cart");
      }

      await fetchCart();
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear cart");
      throw err;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        error,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        refetchCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}