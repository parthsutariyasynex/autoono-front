"use client";

import { useCart as useCartContext } from "../context/CartContext";

export function useCart() {
  return useCartContext();
}

// Re-export types for convenience
export type { Cart, CartItem } from "../context/CartContext";