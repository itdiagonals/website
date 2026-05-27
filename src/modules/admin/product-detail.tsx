'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, Box, Calendar, ChevronRight, Edit3, Layers, Package, Palette, Ruler, Scale, Tag } from 'lucide-react'

import { api, type Product } from '@/lib/api'
import { formatDate, formatPrice } from '@/modules/admin/helpers'
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
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-primary-500" />
        <p className="text-sm text-neutral-600">Loading product...</p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold text-primary-1000">{error || 'Product not found'}</p>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </Link>
      </div>
    )
  }

  const stockStatus =
    product.stock === 0
      ? { label: 'Out of stock', className: 'bg-red-50 text-red-700 ring-1 ring-red-100' }
      : product.stock < 10
        ? { label: 'Low stock', className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' }
        : { label: 'In stock', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' }

  const detailInfo = product.detail_info ?? null
  const hasDetailInfo = detailInfo && typeof detailInfo === 'object' && Object.keys(detailInfo).length > 0

  return (
    <div className="flex flex-col gap-8">
      <nav className="flex items-center gap-1.5 text-sm text-neutral-500">
        <Link href="/admin/products" className="transition-colors hover:text-primary-1000">
          Products
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-primary-1000">{product.name}</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          {product.cover_image?.url && (
            <img
              src={product.cover_image.url}
              alt={product.cover_image.alt || product.name}
              className="h-14 w-14 shrink-0 rounded-lg object-cover ring-1 ring-neutral-200"
            />
          )}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-primary-1000">{product.name}</h1>
            <p className="mt-0.5 text-sm text-neutral-500">
              {product.category?.name ?? 'Uncategorized'} · {product.season?.name ?? 'No season'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-primary-800 transition-colors hover:bg-neutral-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-800"
          >
            <Edit3 className="h-4 w-4" />
            Edit Product
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <section className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60">
            <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-neutral-400">
              <Layers className="h-4 w-4" />
              Product Information
            </h2>
            <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-8">
              <InfoRow icon={<Tag className="h-3.5 w-3.5 text-neutral-400" />} label="Name" value={product.name} />
              <InfoRow icon={<Tag className="h-3.5 w-3.5 text-neutral-400" />} label="Slug" value={product.slug} />
              <InfoRow
                icon={<Tag className="h-3.5 w-3.5 text-neutral-400" />}
                label="Gender"
                value={
                  <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium capitalize text-neutral-700">
                    {product.gender}
                  </span>
                }
              />
              <InfoRow icon={<Layers className="h-3.5 w-3.5 text-neutral-400" />} label="Category" value={product.category?.name || '-'} />
              <InfoRow icon={<Calendar className="h-3.5 w-3.5 text-neutral-400" />} label="Season" value={product.season?.name || '-'} />
              <InfoRow icon={<Package className="h-3.5 w-3.5 text-neutral-400" />} label="Care Guide" value={product.care_guide?.title || '-'} />
              <InfoRow
                icon={<Box className="h-3.5 w-3.5 text-neutral-400" />}
                label="Stock"
                value={
                  <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold', stockStatus.className)}>
                    <span className={cn('inline-block h-1.5 w-1.5 rounded-full', product.stock === 0 ? 'bg-red-500' : product.stock < 10 ? 'bg-amber-500' : 'bg-emerald-500')} />
                    {product.stock} units
                  </span>
                }
              />
              <InfoRow icon={<Ruler className="h-3.5 w-3.5 text-neutral-400" />} label="Dimensions" value={`${product.length} × ${product.width} × ${product.height} cm`} />
              <InfoRow icon={<Scale className="h-3.5 w-3.5 text-neutral-400" />} label="Weight" value={`${product.weight} g`} />
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-neutral-400">
              <Package className="h-4 w-4" />
              Images
            </h2>
            <div className="flex flex-col gap-5">
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Cover Image</p>
                {product.cover_image?.url ? (
                  <div className="relative overflow-hidden rounded-xl bg-neutral-50">
                    <img
                      src={product.cover_image.url}
                      alt={product.cover_image.alt || 'Cover'}
                      className="aspect-video w-full object-contain"
                    />
                    {product.cover_image.alt && (
                      <p className="px-1 pt-2 text-xs text-neutral-500">{product.cover_image.alt}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 text-sm text-neutral-400">
                    No cover image
                  </div>
                )}
              </div>

              {product.gallery && product.gallery.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    Gallery ({product.gallery.length})
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {product.gallery.map((item) =>
                      item.image?.url ? (
                        <div
                          key={item.id}
                          className="group relative overflow-hidden rounded-xl bg-neutral-50"
                        >
                          <img
                            src={item.image.url}
                            alt={item.image.alt || `Gallery ${item.id}`}
                            className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      ) : null,
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-400">Description</h2>
            {product.description ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">{product.description}</p>
            ) : (
              <p className="text-sm italic text-neutral-400">No description provided.</p>
            )}
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">Variants</h2>
            {product.variants?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100">
                      <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Color</th>
                      <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Size</th>
                      <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((variant) => (
                      <tr key={variant.id} className="border-b border-neutral-50 transition-colors last:border-0 hover:bg-neutral-50/50">
                        <td className="px-3 py-2.5 text-neutral-700">{variant.color_name}</td>
                        <td className="px-3 py-2.5 text-neutral-700">{variant.size}</td>
                        <td className={cn('px-3 py-2.5 text-right font-medium', variant.stock === 0 && 'text-red-600', variant.stock > 0 && variant.stock < 10 && 'text-amber-600', variant.stock >= 10 && 'text-emerald-600')}>
                          {variant.stock}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-neutral-400">No variants configured.</p>
            )}
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">Detail Info</h2>
            {hasDetailInfo ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Object.entries(detailInfo as Record<string, unknown>).map(([key, val]) => (
                  <div key={key}>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{key}</span>
                    <p className="mt-0.5 text-sm font-medium text-neutral-800">
                      {typeof val === 'string' ? val : JSON.stringify(val)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-400">No detail info provided.</p>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <section className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">Pricing</h2>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Base Price</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-primary-1000">{formatPrice(product.base_price)}</p>
              </div>
              <div className="h-px bg-neutral-100" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">Stock Status</span>
                <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold', stockStatus.className)}>
                  {stockStatus.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">Total Units</span>
                <span className="text-sm font-semibold text-neutral-800">{product.stock}</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-neutral-400">
              <Palette className="h-4 w-4" />
              Available Colors
            </h2>
            <div className="flex flex-wrap gap-2">
              {product.available_colors?.length ? (
                product.available_colors.map((color) => (
                  <div
                    key={color.id}
                    className="flex items-center gap-2 rounded-full border border-neutral-100 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700"
                  >
                    <span
                      className="inline-block h-3 w-3 rounded-full ring-1 ring-neutral-200"
                      style={{ backgroundColor: color.hex_code }}
                    />
                    {color.color_name}
                  </div>
                ))
              ) : (
                <span className="text-sm text-neutral-400">No colors configured.</span>
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-neutral-400">
              <Ruler className="h-4 w-4" />
              Available Sizes
            </h2>
            <div className="flex flex-wrap gap-2">
              {product.available_sizes?.length ? (
                product.available_sizes.map((size) => (
                  <span
                    key={size.id}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-100 bg-neutral-50 text-xs font-semibold text-neutral-700"
                  >
                    {size.size}
                  </span>
                ))
              ) : (
                <span className="text-sm text-neutral-400">No sizes configured.</span>
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">Metadata</h2>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Created</span>
                <span className="text-neutral-800">{formatDate(product.created_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Updated</span>
                <span className="text-neutral-800">{formatDate(product.updated_at)}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-1">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{label}</span>
        <span className="text-sm font-medium text-neutral-800">{value}</span>
      </div>
    </div>
  )
}
