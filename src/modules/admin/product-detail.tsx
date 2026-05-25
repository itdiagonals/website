'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { api, type Product } from '@/lib/api'
import { formatDate, formatPrice, stringifyJson } from '@/modules/admin/helpers'
import { cn } from '@/lib/utils'

export default function ProductDetailModule() {
  const params = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProduct() {
      if (!params?.id) {
        setError('Product id is missing.')
        setLoading(false)
        return
      }

      try {
        setProduct(await api.products.getById(Number.parseInt(params.id, 10)))
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load product.')
      } finally {
        setLoading(false)
      }
    }

    void loadProduct()
  }, [params?.id])

  if (loading) {
    return <div className="py-20 text-center text-sm text-neutral-700">Loading product...</div>
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-lg font-medium text-primary-1000">{error || 'Product not found'}</p>
        <Link href="/admin/products" className="text-sm font-medium text-primary-700 hover:text-primary-1000">
          Back to products
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-700">
        <Link href="/admin/products" className="transition-colors hover:text-primary-1000">
          Products
        </Link>
        <span>/</span>
        <span className="font-medium text-primary-1000">{product.name}</span>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-primary-1000">{product.name}</h1>
        <Link href="/admin/products" className="rounded-lg border border-neutral-300 bg-neutral-100 px-4 py-2.5 text-center text-sm font-medium text-primary-800 transition-colors hover:bg-neutral-200">
          Back
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-primary-1000">Product Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoItem label="Name" value={product.name} />
              <InfoItem label="Slug" value={product.slug} />
              <InfoItem label="Gender" value={product.gender} />
              <InfoItem label="Category" value={product.category?.name || '-'} />
              <InfoItem label="Season" value={product.season?.name || '-'} />
              <InfoItem label="Care Guide" value={product.care_guide?.title || '-'} />
              <InfoItem label="Stock" value={`${product.stock} units`} valueClassName={cn(product.stock === 0 && 'text-red-600', product.stock > 0 && product.stock < 10 && 'text-amber-600', product.stock >= 10 && 'text-emerald-600')} />
              <InfoItem label="Dimensions" value={`${product.length} x ${product.width} x ${product.height} cm`} />
              <InfoItem label="Weight" value={`${product.weight} g`} />
              <InfoItem label="Cover Image" value={product.cover_image?.alt || (product.cover_image_id ? `#${product.cover_image_id}` : '-')} />
            </div>
          </div>

          <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-primary-1000">Description</h2>
            <p className="text-sm leading-relaxed text-primary-800">{product.description || '-'}</p>
          </div>

          <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-primary-1000">Detail Info</h2>
            <pre className="overflow-x-auto rounded-lg bg-neutral-200 p-4 text-xs text-primary-900">{stringifyJson(product.detail_info) || '-'}</pre>
          </div>

          <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-primary-1000">Variants</h2>
            {product.variants?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-300 bg-neutral-200">
                      <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Color</th>
                      <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Size</th>
                      <th className="px-4 py-2 text-right text-xs font-bold uppercase tracking-wide text-neutral-800">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-300">
                    {product.variants.map((variant) => (
                      <tr key={variant.id}>
                        <td className="px-4 py-2 text-neutral-800">{variant.color_name}</td>
                        <td className="px-4 py-2 text-neutral-800">{variant.size}</td>
                        <td className="px-4 py-2 text-right font-medium text-primary-1000">{variant.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-neutral-700">No variants configured.</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-primary-1000">Pricing</h2>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-700">Base Price</span>
              <span className="text-lg font-bold text-primary-1000">{formatPrice(product.base_price)}</span>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-primary-1000">Available Colors</h2>
            <div className="flex flex-wrap gap-2">
              {product.available_colors?.length ? (
                product.available_colors.map((color) => (
                  <div key={color.id} className="flex items-center gap-2 rounded-full bg-neutral-200 px-3 py-1 text-xs font-medium text-primary-800">
                    <span className="inline-block h-3 w-3 rounded-full border border-neutral-300" style={{ backgroundColor: color.hex_code }} />
                    {color.color_name}
                  </div>
                ))
              ) : (
                <span className="text-sm text-neutral-700">No colors configured.</span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-primary-1000">Available Sizes</h2>
            <div className="flex flex-wrap gap-2">
              {product.available_sizes?.length ? (
                product.available_sizes.map((size) => (
                  <span key={size.id} className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-medium text-primary-800">
                    {size.size}
                  </span>
                ))
              ) : (
                <span className="text-sm text-neutral-700">No sizes configured.</span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-primary-1000">Gallery</h2>
            <div className="flex flex-col gap-2 text-sm text-neutral-800">
              {product.gallery?.length ? (
                product.gallery.map((item) => <span key={item.id}>Image #{item.image_id}</span>)
              ) : (
                <span className="text-neutral-700">No gallery images configured.</span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-primary-1000">Metadata</h2>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-700">Created</span>
                <span className="text-primary-800">{formatDate(product.created_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-700">Updated</span>
                <span className="text-primary-800">{formatDate(product.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-neutral-700">{label}</span>
      <span className={cn('text-sm font-medium text-primary-1000', valueClassName)}>{value}</span>
    </div>
  )
}
