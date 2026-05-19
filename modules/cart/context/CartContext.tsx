"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
  useRef,
} from "react";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { getAuthToken, getClientStoreCode } from "@/lib/api/api-client";

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
  discount_amount?: number;
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
  discount_amount?: number;
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

function isAuthError(status: number): boolean {
  return status === 401 || status === 403;
}

function handleAuthError() {
  console.warn("Cart: token expired or unauthorized — signing out");
  const locale = typeof window !== "undefined" && window.location.pathname.startsWith("/ar") ? "ar" : "en";
  // redirect:false + manual navigation keeps us on the current origin;
  // NextAuth's internal redirect falls back to http://localhost:3000.
  signOut({ redirect: false }).finally(() => {
    if (typeof window !== "undefined") window.location.href = `/${locale}/login`;
  });
}

export function getWarehouseKey(storeCode: string): string {
  const code = (storeCode || "").toLowerCase();
  if (code.includes("anwar")) return "cart_anwar";
  if (code.includes("hussain")) return "cart_hussain";
  if (code.includes("mohammed")) return "cart_mohammed";
  if (code.includes("abdulqader")) return "cart_abdulqader";
  return "cart_allwarehouse";
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pathname = usePathname();
  const isFetching = useRef(false);
  const pendingFetch = useRef(false);

  const fetchCart = useCallback(async (showLoader = true, _retry = 0) => {
    // If already fetching, mark a pending fetch so we re-run once current one finishes
    if (isFetching.current) {
      pendingFetch.current = true;
      return;
    }
    try {
      isFetching.current = true;
      pendingFetch.current = false;
      if (showLoader) setIsLoading(true);
      setError(null);

      const token = await getAuthToken();
      if (!token) {
        setCart(null);
        return;
      }

      // Read locale from URL (most up-to-date during language switch)
      const pathLocale = window.location.pathname.startsWith("/ar") ? "ar" : "en";
      const storeCode = getClientStoreCode();
      const res = await fetch("/api/kleverapi/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-locale": pathLocale,
          ...(storeCode && { "x-store-code": storeCode }),
        },
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        if (isAuthError(res.status)) {
          // Retry once after delay (handles post-login race condition)
          if (_retry < 1) {
            await new Promise(r => setTimeout(r, 1000));
            return fetchCart(showLoader, _retry + 1);
          }
          setCart(null);
          handleAuthError();
          return;
        }
        // Backend down or server error — fail silently
        setCart(null);
        return;
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
        discount_amount: item.discount_amount ? Number(item.discount_amount) : undefined,
      }));

      const subtotal = Number(data.subtotal ?? data.cart?.subtotal ?? 0);
      const tax_amount = Number(data.tax_amount ?? data.cart?.tax_amount ?? 0);
      const tax_label = data.tax_label ?? data.cart?.tax_label ?? "Tax";
      const grand_total = Number(data.grand_total ?? data.cart?.grand_total ?? subtotal);
      const currency_code = data.currency_code ?? data.cart?.currency_code ?? "SAR";
      // Magento's kleverapi/cart does not return a discount field directly.
      // Derive it from the totals: discount = subtotal + tax - grand_total (0 when no discount)
      const derived = subtotal + tax_amount - grand_total;
      const discount_amount = derived > 0.005 ? Math.round(derived * 100) / 100 : 0;

      // Calculate total units instead of unique SKUs for navbar count
      const items_count = items.reduce((sum: number, i: CartItem) => sum + i.qty, 0);
      const cart_id = data.cart_id ?? data.cart?.cart_id ?? null;

      setCart({ items, subtotal, tax_amount, tax_label, grand_total, currency_code, items_count, cart_id, discount_amount });
    } catch {
      // Network error or backend unreachable — fail silently
      setCart(null);
    } finally {
      isFetching.current = false;
      if (showLoader) setIsLoading(false);
      // If another fetch was requested while we were running, do it now
      if (pendingFetch.current) {
        pendingFetch.current = false;
        fetchCart(false);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const performSync = async () => {
      const token = await getAuthToken();
      if (!token) return;

      const storeCode = getClientStoreCode();
      const activeKey = getWarehouseKey(storeCode);
      const lastSynced = localStorage.getItem("current_synced_cart_warehouse");

      if (lastSynced === null) {
        // First time on this browser device. 
        // We assume whatever is in the backend cart belongs to the current warehouse.
        const pathLocale = window.location.pathname.startsWith("/ar") ? "ar" : "en";
        const res = await fetch("/api/kleverapi/cart", {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-locale": pathLocale,
            ...(storeCode && { "x-store-code": storeCode }),
          },
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          const rawItems = Array.isArray(data.items) ? data.items : (Array.isArray(data.cart?.items) ? data.cart.items : []);
          const itemsToSave = rawItems.map((item: any) => ({ sku: item.sku, qty: Number(item.qty || 1) }));
          localStorage.setItem(activeKey, JSON.stringify(itemsToSave));
        } else {
          localStorage.setItem(activeKey, "[]");
        }
        localStorage.setItem("current_synced_cart_warehouse", activeKey);
        await fetchCart();
      } else if (lastSynced !== activeKey) {
        // Warehouse has been switched! We MUST sync the backend cart to strictly reflect the isolated warehouse.
        setIsLoading(true);
        const pathLocale = window.location.pathname.startsWith("/ar") ? "ar" : "en";
        
        // 1. Clear backend cart to remove old warehouse's items
        const clearRes = await fetch("/api/kleverapi/cart/clear", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "x-locale": pathLocale,
            ...(storeCode && { "x-store-code": storeCode }),
          },
        });
        if (!clearRes.ok) {
          // Fallback manual clearance if endpoint fails
          const cartRes = await fetch("/api/kleverapi/cart", {
            headers: {
              Authorization: `Bearer ${token}`,
              "x-locale": pathLocale,
              ...(storeCode && { "x-store-code": storeCode }),
            },
            cache: "no-store",
          });
          if (cartRes.ok) {
            const cartData = await cartRes.json();
            const items = Array.isArray(cartData.items) ? cartData.items : (Array.isArray(cartData.cart?.items) ? cartData.cart.items : []);
            for (const item of items) {
              await fetch(`/api/kleverapi/cart/remove/${item.item_id}`, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "x-locale": pathLocale,
                  ...(storeCode && { "x-store-code": storeCode }),
                },
              });
            }
          }
        }

        // 2. Re-populate backend cart with only the active warehouse's items
        const savedRaw = localStorage.getItem(activeKey);
        if (savedRaw === null) {
          localStorage.setItem(activeKey, "[]");
        }
        const savedItems = JSON.parse(localStorage.getItem(activeKey) || "[]");
        
        for (const item of savedItems) {
          await fetch("/api/kleverapi/cart/add", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              "x-locale": pathLocale,
              ...(storeCode && { "x-store-code": storeCode }),
            },
            body: JSON.stringify({ sku: item.sku, qty: item.qty }),
          });
        }

        localStorage.setItem("current_synced_cart_warehouse", activeKey);
        await fetchCart(false);
        window.dispatchEvent(new Event("cart-updated"));
      } else {
        // Warehouse matches the last synced state, we can safely just fetch the totals!
        await fetchCart();
      }
    };

    performSync();
  }, [pathname, fetchCart]);

  // Re-fetch cart when locale changes (cart labels come from Magento in locale)
  useEffect(() => {
    const onLocaleChanged = () => fetchCart();
    window.addEventListener("locale-changed", onLocaleChanged);
    return () => window.removeEventListener("locale-changed", onLocaleChanged);
  }, [fetchCart]);

  const addToCart = async (sku: string, qty: number) => {
    try {
      setError(null);
      const token = await getAuthToken();
      if (!token) throw new Error("Not authenticated");

      // Check if item already exists in cart to update its quantity instead of adding a duplicate
      const existingItem = cart?.items?.find((item) => item.sku === sku);

      if (existingItem) {
        // Increment existing quantity
        const newQty = existingItem.qty + qty;
        await updateCartItem(existingItem.item_id, newQty);
        return;
      }

      // Update warehouse storage first
      const storeCode = getClientStoreCode();
      const activeKey = getWarehouseKey(storeCode);
      const savedItems = JSON.parse(localStorage.getItem(activeKey) || "[]");
      const itemIndex = savedItems.findIndex((i: any) => i.sku === sku);
      if (itemIndex > -1) {
        savedItems[itemIndex].qty += qty;
      } else {
        savedItems.push({ sku, qty });
      }
      localStorage.setItem(activeKey, JSON.stringify(savedItems));

      const pathLocale = window.location.pathname.startsWith("/ar") ? "ar" : "en";
      const res = await fetch("/api/kleverapi/cart/add", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-locale": pathLocale,
          ...(storeCode && { "x-store-code": storeCode }),
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

      // Update warehouse storage first
      const itemToUpdate = cart?.items?.find(i => i.item_id === itemId);
      if (itemToUpdate) {
        const storeCode = getClientStoreCode();
        const activeKey = getWarehouseKey(storeCode);
        const savedItems = JSON.parse(localStorage.getItem(activeKey) || "[]");
        const itemIndex = savedItems.findIndex((i: any) => i.sku === itemToUpdate.sku);
        if (itemIndex > -1) {
          savedItems[itemIndex].qty = qty;
          localStorage.setItem(activeKey, JSON.stringify(savedItems));
        }
      }

      // Optimistically update local state so UI reflects change immediately
      setCart(prev => {
        if (!prev) return null;
        const updatedItems = prev.items.map(i =>
          i.item_id === itemId ? { ...i, qty, row_total: i.price * qty } : i
        );
        const items_count = updatedItems.reduce((s, i) => s + i.qty, 0);
        return { ...prev, items: updatedItems, items_count };
      });

      const pathLocale = window.location.pathname.startsWith("/ar") ? "ar" : "en";
      const storeCode = getClientStoreCode();
      const res = await fetch(`/api/kleverapi/cart/update/${itemId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-locale": pathLocale,
          ...(storeCode && { "x-store-code": storeCode }),
        },
        body: JSON.stringify({ qty, cart_id: cart?.cart_id }),
      });

      if (!res.ok) {
        if (isAuthError(res.status)) { handleAuthError(); return; }
        const data = await res.json();
        throw new Error(data.message || "Failed to update cart");
      }

      // Don't fetchCart here — caller (handleUpdateCart) does a single refetch at the end
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

      // Update warehouse storage first
      const itemToRemove = cart?.items?.find(i => i.item_id === itemId);
      if (itemToRemove) {
        const storeCode = getClientStoreCode();
        const activeKey = getWarehouseKey(storeCode);
        const savedItems = JSON.parse(localStorage.getItem(activeKey) || "[]");
        const filteredItems = savedItems.filter((i: any) => i.sku !== itemToRemove.sku);
        localStorage.setItem(activeKey, JSON.stringify(filteredItems));
      }

      const pathLocale = window.location.pathname.startsWith("/ar") ? "ar" : "en";
      const storeCode = getClientStoreCode();
      const res = await fetch(`/api/kleverapi/cart/remove/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-locale": pathLocale,
          ...(storeCode && { "x-store-code": storeCode }),
        },
      });

      if (!res.ok) {
        if (isAuthError(res.status)) { handleAuthError(); return; }
        const data = await res.json();
        throw new Error(data.message || "Failed to remove item");
      }

      // Immediately remove from local state so the row disappears without waiting for re-fetch
      setCart(prev => {
        if (!prev) return null;
        const updatedItems = prev.items.filter(i => i.item_id !== itemId);
        const items_count = updatedItems.reduce((s, i) => s + i.qty, 0);
        return { ...prev, items: updatedItems, items_count };
      });
      window.dispatchEvent(new Event("cart-updated"));

      // Background re-fetch to get updated totals from server
      fetchCart(false);
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

      // Update warehouse storage first
      const storeCode = getClientStoreCode();
      const activeKey = getWarehouseKey(storeCode);
      localStorage.setItem(activeKey, JSON.stringify([]));

      const pathLocale = window.location.pathname.startsWith("/ar") ? "ar" : "en";
      const res = await fetch("/api/kleverapi/cart/clear", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-locale": pathLocale,
          ...(storeCode && { "x-store-code": storeCode }),
        },
      });

      if (!res.ok) {
        if (isAuthError(res.status)) { handleAuthError(); return; }

        // Fallback: remove every item individually when the clear endpoint is unavailable
        const items = cart?.items ?? [];
        if (items.length === 0) {
          setCart(null);
          window.dispatchEvent(new Event("cart-updated"));
          return;
        }
        for (const item of items) {
          const removeRes = await fetch(`/api/kleverapi/cart/remove/${item.item_id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "x-locale": pathLocale,
              ...(storeCode && { "x-store-code": storeCode }),
            },
          });
          if (!removeRes.ok && isAuthError(removeRes.status)) {
            handleAuthError();
            return;
          }
        }
      }

      // Immediately clear local state so the UI empties without waiting for the re-fetch
      setCart(prev => prev
        ? { ...prev, items: [], items_count: 0, subtotal: 0, tax_amount: 0, grand_total: 0, discount_amount: 0 }
        : null
      );
      window.dispatchEvent(new Event("cart-updated"));

      // Background re-fetch to sync with server (no loader since we already cleared the UI)
      fetchCart(false);
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