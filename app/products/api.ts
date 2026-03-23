// app/products/api.ts
import { api } from "@/lib/api/api-client";
import type { Product } from "../../modules/types/product";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

// export async function fetchProducts(): Promise<Product[]> {
//   try {
//     // const data = await api.get("/products");
//     const data = await api.get("api/category-products");
//     console.log("API RESPONSE:", data);
//     return data.products ?? [];
//   } catch (error) {
//     console.error("fetchProducts error:", error);
//     return [];
//   }
// }


export async function fetchProducts(searchParams?: URLSearchParams | string): Promise<Product[]> {
  try {
    let url = "/category-products?categoryId=5"; // Default fallback structure

    if (searchParams instanceof URLSearchParams) {
      url = `/products?${searchParams.toString()}`;
    }

    const data = await api.get(url);

    console.log("API RESPONSE:", data);
    return data.products ?? data.items ?? [];
  } catch (error) {
    console.error("fetchProducts error:", error);
    return [];
  }
}

export async function addToCart(sku: string): Promise<Record<string, unknown>> {
  return api.post("/cart/add", { sku, qty: 1 });
}

export async function removeFromCart(itemId: number) {
  return api.delete(`/cart?itemId=${itemId}`);
}

export function checkAuth(router: AppRouterInstance): boolean {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return false;
    }
    return true;
  }
  return false;
}