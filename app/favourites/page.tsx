"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { fetchProducts } from "../products/api";
import type { Product } from "../../modules/types/product";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FavouritesPage() {
  const router = useRouter();

  const [favProducts, setFavProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFavourites = async () => {
      try {
        const stored = localStorage.getItem("favourites");
        const favIds: number[] = stored ? JSON.parse(stored) : [];

        const allProducts = await fetchProducts();

        const filtered = allProducts.filter((product: Product) =>
          favIds.includes(product.product_id)
        );

        setFavProducts(filtered);
      } catch (error) {
        console.error("Failed to load favourites:", error);
        alert("Failed to load favourites");
      } finally {
        setLoading(false);
      }
    };

    loadFavourites();
  }, []);

  const removeFromFavourites = (productId: number) => {
    const stored = localStorage.getItem("favourites");
    const favIds: number[] = stored ? JSON.parse(stored) : [];

    const updated = favIds.filter((id) => id !== productId);

    localStorage.setItem("favourites", JSON.stringify(updated));

    setFavProducts((prev) =>
      prev.filter((product) => product.product_id !== productId)
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="p-6">
        <div className="flex justify-between mb-4">
          <h1 className="text-2xl font-bold">Favourite Products</h1>

          <button
            onClick={() => router.push("/products")}
            className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded cursor-pointer"
          >
            Back
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : favProducts.length === 0 ? (
          <p>No favourite products</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {favProducts.map((product) => (
              <div
                key={product.product_id}
                className="bg-white p-4 rounded shadow hover:shadow-lg transition"
              >


                <h2 className="font-semibold">{product.name}</h2>

                <p className="text-sm text-gray-500">
                  {product.tyre_size}
                </p>

                <p className="font-bold text-green-600 mt-1">
                  ﷼ {product.final_price}
                </p>

                <Star
                  className="text-yellow-500 fill-yellow-500 mt-3 cursor-pointer"
                  onClick={() =>
                    removeFromFavourites(product.product_id)
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}