import { useEffect, useState } from "react";

export interface CartItem {
  item_id: number;
  sku: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  grand_total: number;
}

export function useCart() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch cart on mount
  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Not authenticated");
        setIsLoading(false);
        return;
      }

      const res = await fetch("/api/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch cart");
      }

      const data = await res.json();
      setCart(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch cart");
    } finally {
      setIsLoading(false);
    }
  };

  const updateCartItem = async (itemId: number, newQty: number) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("/api/cart/update", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          item_id: itemId,
          qty: newQty,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update cart");
      }

      await fetchCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update cart");
    }
  };

  const removeFromCart = async (itemId: number) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`/api/cart/remove/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to remove item");
      }

      await fetchCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove item");
    }
  };

  return {
    cart,
    isLoading,
    error,
    removeFromCart,
    updateCartItem,
    refetchCart: fetchCart,
  };
}