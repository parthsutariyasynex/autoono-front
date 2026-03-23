// "use client";

// import { useCart } from "@/modules/cart/hooks/useCart";

// export default function AddToCartButton({ sku }: { sku: string }) {
//   const { addToCart } = useCart();

//   return (
//     <button onClick={() => addToCart(sku, 1)}>
//       Add To Cart
//     </button>
//   );
// }


"use client";

import { useCart } from "@/modules/cart/hooks/useCart";

export default function AddToCartButton({ sku }: { sku: string | number }) {
  const { addToCart } = useCart();

  return (
    <button onClick={() => addToCart(String(sku), 1)}>
      Add To Cart
    </button>
  );
}