"use client";

import Link from "next/link";
import { products, formatPrice } from "@/lib/dummy-data";
import { cn } from "@/lib/utils";

interface ProductDetailModuleProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailModule({ params }: ProductDetailModuleProps) {
  const product = products.find((p) => p.id === 1);
  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-lg font-medium text-primary-1000">Product not found</p>
        <Link
          href="/admin/products"
          className="text-sm font-medium text-primary-700 hover:text-primary-1000"
        >
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-700">
        <Link href="/admin/products" className="hover:text-primary-1000 transition-colors">
          Products
        </Link>
        <span>/</span>
        <span className="text-primary-1000 font-medium">{product.name}</span>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-primary-1000">{product.name}</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/products"
            className="flex-1 rounded-lg border border-neutral-300 bg-neutral-100 px-4 py-2.5 text-center text-sm font-medium text-primary-800 hover:bg-neutral-200 transition-colors sm:flex-none"
          >
            Back
          </Link>
          <button className="flex-1 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-400 transition-colors cursor-pointer sm:flex-none">
            Edit Product
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-6 shadow-sm">
            <h2 className="text-base font-bold text-primary-1000 mb-4">Product Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-700">Name</span>
                <span className="text-sm font-medium text-primary-1000">{product.name}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-700">Slug</span>
                <span className="text-sm font-medium text-primary-1000">{product.slug}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-700">Gender</span>
                <span className="text-sm font-medium text-primary-1000 capitalize">{product.gender}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-700">Category</span>
                <span className="text-sm font-medium text-primary-1000">{product.category.name}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-700">Season</span>
                <span className="text-sm font-medium text-primary-1000">{product.season.name}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-700">Stock</span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    product.stock === 0 && "text-red-200",
                    product.stock > 0 && product.stock < 10 && "text-yellow-200",
                    product.stock >= 10 && "text-green-200"
                  )}
                >
                  {product.stock} units
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-700">Dimensions</span>
                <span className="text-sm font-medium text-primary-1000">
                  {product.length} x {product.width} x {product.height} cm
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-700">Weight</span>
                <span className="text-sm font-medium text-primary-1000">{product.weight} g</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-6 shadow-sm">
            <h2 className="text-base font-bold text-primary-1000 mb-4">Description</h2>
            <p className="text-sm text-primary-800 leading-relaxed">{product.description}</p>
          </div>

          {product.detailInfo && Object.keys(product.detailInfo).length > 0 && (
            <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-6 shadow-sm">
              <h2 className="text-base font-bold text-primary-1000 mb-4">Detail Info</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Object.entries(product.detailInfo).map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-1">
                    <span className="text-xs font-medium uppercase tracking-wide text-neutral-700">{key}</span>
                    <span className="text-sm font-medium text-primary-1000">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {product.gallery.length > 0 && (
            <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-6 shadow-sm">
              <h2 className="text-base font-bold text-primary-1000 mb-4">Gallery</h2>
              <div className="flex flex-wrap gap-3">
                {product.gallery.map((item) => (
                  <div
                    key={item.id}
                    className="flex h-20 w-20 items-center justify-center rounded-lg bg-neutral-200 text-xs text-neutral-700"
                  >
                    {item.imageUrl}
                  </div>
                ))}
              </div>
            </div>
          )}

          {product.variants.length > 0 && (
            <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-6 shadow-sm">
              <h2 className="text-base font-bold text-primary-1000 mb-4">Variants</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-300 bg-neutral-200">
                      <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">SKU</th>
                      <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Color</th>
                      <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Size</th>
                      <th className="px-4 py-2 text-right text-xs font-bold uppercase tracking-wide text-neutral-800">Stock</th>
                      <th className="px-4 py-2 text-right text-xs font-bold uppercase tracking-wide text-neutral-800">Price Adj</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-300">
                    {product.variants.map((variant) => (
                      <tr key={variant.id} className="hover:bg-neutral-200 transition-colors">
                        <td className="px-4 py-2 font-mono text-xs text-primary-1000">{variant.sku}</td>
                        <td className="px-4 py-2 text-neutral-800">{variant.color}</td>
                        <td className="px-4 py-2 text-neutral-800">{variant.size}</td>
                        <td className="px-4 py-2 text-right font-medium">{variant.stock}</td>
                        <td className="px-4 py-2 text-right font-medium">
                          {variant.priceAdjustment === 0 ? "-" : formatPrice(variant.priceAdjustment)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-6 shadow-sm">
            <h2 className="text-base font-bold text-primary-1000 mb-4">Pricing</h2>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-700">Base Price</span>
              <span className="text-lg font-bold text-primary-1000">{formatPrice(product.basePrice)}</span>
            </div>
          </div>

          {product.coverImage && (
            <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-6 shadow-sm">
              <h2 className="text-base font-bold text-primary-1000 mb-4">Cover Image</h2>
              <div className="flex h-40 w-full items-center justify-center rounded-lg bg-neutral-200 text-xs text-neutral-700">
                {product.coverImage.url}
              </div>
            </div>
          )}

          {product.careGuide && (
            <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-6 shadow-sm">
              <h2 className="text-base font-bold text-primary-1000 mb-4">Care Guide</h2>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-primary-1000">{product.careGuide.title}</span>
                {product.careGuide.instructions && (
                  <div className="flex flex-col gap-1">
                    {Object.entries(product.careGuide.instructions).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-xs font-medium uppercase text-neutral-700">{key}</span>
                        <span className="text-xs text-primary-800">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {product.availableColors.length > 0 && (
            <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-6 shadow-sm">
              <h2 className="text-base font-bold text-primary-1000 mb-4">Available Colors</h2>
              <div className="flex flex-wrap gap-2">
                {product.availableColors.map((color) => (
                  <div key={color.id} className="flex items-center gap-2 rounded-full bg-neutral-200 px-3 py-1 text-xs font-medium text-primary-800">
                    <span
                      className="inline-block h-3 w-3 rounded-full border border-neutral-300"
                      style={{ backgroundColor: color.hex }}
                    />
                    {color.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {product.availableSizes.length > 0 && (
            <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-6 shadow-sm">
              <h2 className="text-base font-bold text-primary-1000 mb-4">Available Sizes</h2>
              <div className="flex flex-wrap gap-2">
                {product.availableSizes.map((size) => (
                  <span
                    key={size.id}
                    className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-medium text-primary-800"
                  >
                    {size.name} ({size.label})
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-6 shadow-sm">
            <h2 className="text-base font-bold text-primary-1000 mb-4">Metadata</h2>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-700">Created</span>
                <span className="text-primary-800">{new Date(product.createdAt).toLocaleDateString("id-ID")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-700">Updated</span>
                <span className="text-primary-800">{new Date(product.updatedAt).toLocaleDateString("id-ID")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
