"use client";

import { useState } from "react";
import Link from "next/link";
import { products, formatPrice } from "@/lib/dummy-data";
import { cn } from "@/lib/utils";
import { Plus, Search, Eye, Pencil } from "lucide-react";

export default function ProductsListModule() {
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<"all" | "men" | "women" | "unisex">("all");

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = genderFilter === "all" || product.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-1000">Products</h1>
          <p className="text-sm text-neutral-700 mt-1">Manage your product catalog</p>
        </div>
        <button className="flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-400 transition-colors cursor-pointer">
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-700">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search by name or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-neutral-100 py-2.5 pl-10 pr-4 text-sm text-primary-1000 placeholder:text-neutral-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-2">
          {(["all", "men", "women", "unisex"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setGenderFilter(filter)}
              className={cn(
                "rounded-lg px-4 py-2 text-xs font-medium capitalize transition-colors cursor-pointer",
                genderFilter === filter
                  ? "bg-primary-500 text-white"
                  : "bg-neutral-200 text-neutral-800 hover:bg-neutral-300"
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-neutral-300 bg-neutral-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-300 bg-neutral-200">
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Product</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Category</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Season</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Gender</th>
                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-neutral-800">Base Price</th>
                <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-neutral-800">Stock</th>
                <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-neutral-800">Dimensions (cm)</th>
                <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-neutral-800">Weight (g)</th>
                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-neutral-800">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-300">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-neutral-200 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-primary-1000">{product.name}</span>
                      <span className="text-xs text-neutral-700">{product.slug}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-neutral-800">{product.category.name}</td>
                  <td className="px-5 py-3 text-neutral-800">{product.season.name}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-neutral-200 px-2.5 py-0.5 text-xs font-medium text-primary-800 capitalize">
                      {product.gender}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-primary-1000">
                    {formatPrice(product.basePrice)}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span
                      className={cn(
                        "font-medium",
                        product.stock === 0 && "text-red-200",
                        product.stock > 0 && product.stock < 10 && "text-yellow-200",
                        product.stock >= 10 && "text-green-200"
                      )}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center text-neutral-700 text-xs">
                    {product.length}x{product.width}x{product.height}
                  </td>
                  <td className="px-5 py-3 text-center text-neutral-700 text-xs">
                    {product.weight}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="rounded-lg p-1.5 text-neutral-700 hover:bg-neutral-300 hover:text-primary-1000 transition-colors"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        className="rounded-lg p-1.5 text-neutral-700 hover:bg-neutral-300 hover:text-primary-1000 transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-neutral-700">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


