"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Product {
  product_id: number;
  sku: string;
  name: string;
  final_price: number;
  show_old_price: boolean;
  product_url: string;
  image_url: string;
  is_in_stock: boolean;
  stock_qty: number;
  year: string;
  origin: string;
  pattern: string;
  warranty_period: string;
  tyre_size: string;
  product_group: string;
}

export default function CategoryProductsPage() {
  const params = useParams();
  const categoryId = params.id as string;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const res = await fetch(`/api/category-products?categoryId=${categoryId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch products");
        }

        console.log("API Response:", data);
        setProducts(data.items || data.products || []);
      } catch (err: any) {
        console.error("Error loading products:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [categoryId]);

  if (loading) return <div className="p-6">Loading products...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Category {categoryId} — Products</h1>

      {products.length === 0 ? (
        <p>No products found in this category.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.product_id}
              className="border rounded-lg p-4 shadow-sm hover:shadow-md transition"
            >
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-40 object-contain mb-3"
                />
              )}
              <h3 className="font-semibold text-lg">{product.name}</h3>
              <p className="text-sm text-gray-500">{product.tyre_size}</p>
              <p className="text-sm text-gray-500">{product.origin} — {product.year}</p>
              <p className="font-bold text-xl mt-2">₹{product.final_price}</p>
              <p className={`text-sm mt-1 ${product.is_in_stock ? "text-green-600" : "text-red-500"}`}>
                {product.is_in_stock ? `In Stock (${product.stock_qty})` : "Out of Stock"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}