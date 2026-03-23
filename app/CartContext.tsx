import { useState, useEffect, useCallback } from 'react';

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
    const loadCart = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          setError('Not authenticated');
          setIsLoading(false);
          return;
        }

        const res = await fetch('/api/cart', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch cart');
        }

        const data = await res.json();
        setCart(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, []);

  const updateCartItem = useCallback(async (itemId: number, qty: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/cart/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ item_id: itemId, qty }),
      });

      if (!res.ok) throw new Error('Failed to update cart');
      const data = await res.json();
      setCart(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  const removeFromCart = useCallback(async (itemId: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/cart/remove`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ item_id: itemId }),
      });

      if (!res.ok) throw new Error('Failed to remove item');
      const data = await res.json();
      setCart(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  return {
    cart,
    isLoading,
    error,
    updateCartItem,
    removeFromCart,
  };
}