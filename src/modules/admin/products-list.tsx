'use client'

import Link from 'next/link'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react'

import ImagePickerSingle from '@/components/admin/image-picker-single'
import ImagePickerMultiple from '@/components/admin/image-picker-multiple'
import ProductVariantBuilder from '@/components/admin/product-variant-builder'
import type {
  BuilderColor,
  BuilderSize,
  BuilderVariant,
} from '@/components/admin/product-variant-builder'
import { api, type CareGuide, type Category, type Media, type Product, type Season } from '@/lib/api'
import {
  formatPrice,
  parseFloatNumber,
  parseInteger,
  parseJsonObject,
  stringifyJson,
} from '@/modules/admin/helpers'
import { cn } from '@/lib/utils'

interface ProductFormState {
  name: string
  slug: string
  categoryId: string
  seasonId: string
  careGuideId: string
  coverImageId: string
  gender: string
  basePrice: string
  weight: string
  length: string
  width: string
  height: string
  description: string
  detailInfoText: string
  colors: BuilderColor[]
  sizes: BuilderSize[]
  galleryImageIds: string[]
  variants: BuilderVariant[]
}

const emptyForm: ProductFormState = {
  name: '',
  slug: '',
  categoryId: '',
  seasonId: '',
  careGuideId: '',
  coverImageId: '',
  gender: 'unisex',
  basePrice: '',
  weight: '',
  length: '',
  width: '',
  height: '',
  description: '',
  detailInfoText: '',
  colors: [],
  sizes: [],
  galleryImageIds: [],
  variants: [],
}

export default function ProductsListModule() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [careGuides, setCareGuides] = useState<CareGuide[]>([])
  const [media, setMedia] = useState<Media[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [genderFilter, setGenderFilter] = useState<'all' | 'men' | 'women' | 'unisex'>('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ProductFormState>(emptyForm)
  const [draftId, setDraftId] = useState<string | undefined>(undefined)

  async function loadData() {
    setLoading(true)
    setError(null)

    try {
      const [productItems, categoryItems, seasonItems, careGuideItems] = await Promise.all([
        api.products.getAll(),
        api.categories.getAll(),
        api.seasons.getAll(),
        api.careGuides.getAll(),
      ])

      setProducts(productItems)
      setCategories(categoryItems)
      setSeasons(seasonItems)
      setCareGuides(careGuideItems)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to load products.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesSearch = `${product.name} ${product.slug}`.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesGender = genderFilter === 'all' || product.gender === genderFilter
        return matchesSearch && matchesGender
      }),
    [genderFilter, products, searchTerm],
  )

  function openCreateForm() {
    setEditingId(null)
    setForm(emptyForm)
    const newDraftId = generateDraftId()
    setDraftId(newDraftId)
    setMedia([])
    setEditorOpen(true)
    setError(null)
  }

  function openEditForm(product: Product) {
    setEditingId(product.id)
    const colors: BuilderColor[] = (product.available_colors || []).map((c, i) => ({
      id: `color-${i}`,
      name: c.color_name,
      hex: c.hex_code,
    }))
    const sizes: BuilderSize[] = (product.available_sizes || []).map((s, i) => ({
      id: `size-${i}`,
      value: s.size,
    }))
    const variants: BuilderVariant[] = (product.variants || []).map((v) => ({
      colorName: v.color_name,
      size: v.size,
      stock: v.stock,
    }))
    setForm({
      name: product.name,
      slug: product.slug,
      categoryId: product.category_id ? String(product.category_id) : '',
      seasonId: product.season_id ? String(product.season_id) : '',
      careGuideId: product.care_guide_id ? String(product.care_guide_id) : '',
      coverImageId: product.cover_image_id ? String(product.cover_image_id) : '',
      gender: product.gender || 'unisex',
      basePrice: String(product.base_price || 0),
      weight: String(product.weight || 0),
      length: String(product.length || 0),
      width: String(product.width || 0),
      height: String(product.height || 0),
      description: product.description || '',
      detailInfoText: stringifyJson(product.detail_info),
      colors,
      sizes,
      galleryImageIds: (product.gallery || []).map((item) => String(item.image_id)),
      variants,
    })
    setDraftId(undefined)
    setEditorOpen(true)
    setError(null)
    void api.media.getAll().then(setMedia).catch(() => undefined)
  }

  function closeEditor() {
    setEditingId(null)
    setForm(emptyForm)
    setDraftId(undefined)
    setEditorOpen(false)
  }

  function handleCoverUploaded(items: Media[]) {
    if (!items.length) {
      return
    }

    setMedia((current) => mergeMedia(current, items))
    setForm((current) => ({ ...current, coverImageId: String(items[0].id) }))
  }

  function handleGalleryUploaded(items: Media[]) {
    if (!items.length) {
      return
    }

    setMedia((current) => mergeMedia(current, items))
    setForm((current) => ({
      ...current,
      galleryImageIds: Array.from(new Set([...current.galleryImageIds, ...items.map((item) => String(item.id))])),
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const availableColors = form.colors
        .filter((c) => c.name.trim() && c.hex.trim())
        .map((c, index) => ({ _order: index + 1, color_name: c.name.trim(), hex_code: c.hex.trim() }))

      const availableSizes = form.sizes
        .filter((s) => s.value.trim())
        .map((s, index) => ({ _order: index + 1, size: s.value.trim() }))

      const variants = form.variants.map((v, index) => ({
        _order: index + 1,
        color_name: v.colorName,
        size: v.size,
        stock: Math.max(0, v.stock),
      }))

      const totalStock = variants.reduce((sum, v) => sum + v.stock, 0)

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        category_id: parseInteger(form.categoryId),
        season_id: parseInteger(form.seasonId),
        care_guide_id: parseInteger(form.careGuideId),
        cover_image_id: parseInteger(form.coverImageId),
        gender: form.gender,
        base_price: parseFloatNumber(form.basePrice),
        stock: totalStock,
        weight: parseInteger(form.weight),
        length: parseInteger(form.length),
        width: parseInteger(form.width),
        height: parseInteger(form.height),
        description: form.description.trim(),
        detail_info: parseJsonObject(form.detailInfoText),
        available_colors: availableColors,
        available_sizes: availableSizes,
        gallery: form.galleryImageIds
          .map((value, index) => ({ _order: index + 1, image_id: parseInteger(value) }))
          .filter((item) => item.image_id > 0),
        variants: variants,
        draft_id: editingId ? undefined : draftId,
      }

      if (editingId) {
        await api.products.update(editingId, payload)
      } else {
        await api.products.create(payload)
      }

      closeEditor()
      await loadData()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to save product.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(productId: number) {
    if (!window.confirm('Delete this product?')) {
      return
    }

    try {
      await api.products.delete(productId)
      await loadData()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to delete product.')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-1000">Products</h1>
          <p className="mt-1 text-sm text-neutral-700">Manage product CRUD against the backend products API.</p>
        </div>
        <button type="button" onClick={openCreateForm} className="flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-400">
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
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-neutral-100 py-2.5 pl-10 pr-4 text-sm text-primary-1000 placeholder:text-neutral-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'men', 'women', 'unisex'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setGenderFilter(filter)}
              className={cn(
                'rounded-lg px-4 py-2 text-xs font-medium capitalize transition-colors',
                genderFilter === filter ? 'bg-primary-500 text-white' : 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300',
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {editorOpen && (
        <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border border-neutral-300 bg-neutral-100 p-5 shadow-sm lg:grid-cols-2">
          <div className="lg:col-span-2 flex items-center justify-between">
            <h2 className="text-base font-bold text-primary-1000">{editingId ? 'Edit product' : 'Create product'}</h2>
            <button type="button" onClick={closeEditor} className="text-sm font-medium text-neutral-700 hover:text-primary-1000">
              Cancel
            </button>
          </div>

          <label className="flex flex-col gap-2 text-sm text-primary-900">
            <span>Name</span>
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required className="rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-primary-500" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-primary-900">
            <span>Slug</span>
            <input value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} required className="rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-primary-500" />
          </label>

          <label className="flex flex-col gap-2 text-sm text-primary-900">
            <span>Category</span>
            <select value={form.categoryId} onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))} className="rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-primary-500">
              <option value="">No category</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-primary-900">
            <span>Season</span>
            <select value={form.seasonId} onChange={(event) => setForm((current) => ({ ...current, seasonId: event.target.value }))} className="rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-primary-500">
              <option value="">No season</option>
              {seasons.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-primary-900">
            <span>Care Guide</span>
            <select value={form.careGuideId} onChange={(event) => setForm((current) => ({ ...current, careGuideId: event.target.value }))} className="rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-primary-500">
              <option value="">No care guide</option>
              {careGuides.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-2 text-sm text-primary-900">
            <span>Cover Image</span>
            <ImagePickerSingle
              media={media}
              selectedId={form.coverImageId}
              onSelect={(id) => setForm((current) => ({ ...current, coverImageId: id ? String(id) : '' }))}
              onUpload={handleCoverUploaded}
              uploadLabel="Upload new cover"
              uploadAltPrefix={`Product Cover ${form.name || form.slug || 'Untitled'}`}
              draftId={draftId}
              showExisting={!!editingId}
            />
          </div>

          <label className="flex flex-col gap-2 text-sm text-primary-900">
            <span>Gender</span>
            <select value={form.gender} onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))} className="rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-primary-500">
              <option value="unisex">Unisex</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-primary-900">
            <span>Base Price</span>
            <input value={form.basePrice} onChange={(event) => setForm((current) => ({ ...current, basePrice: event.target.value }))} required className="rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-primary-500" />
          </label>
          <div className="flex flex-col gap-2 text-sm text-primary-900">
            <span>Total Stock</span>
            <div className="flex h-10 items-center rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm font-medium text-neutral-600">
              {form.variants.reduce((sum, v) => sum + v.stock, 0)} units
            </div>
            <p className="text-xs text-neutral-500">Auto-calculated from variant stocks below.</p>
          </div>
          <label className="flex flex-col gap-2 text-sm text-primary-900">
            <span>Weight (g)</span>
            <input value={form.weight} onChange={(event) => setForm((current) => ({ ...current, weight: event.target.value }))} className="rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-primary-500" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-primary-900">
            <span>Length (cm)</span>
            <input value={form.length} onChange={(event) => setForm((current) => ({ ...current, length: event.target.value }))} className="rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-primary-500" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-primary-900">
            <span>Width (cm)</span>
            <input value={form.width} onChange={(event) => setForm((current) => ({ ...current, width: event.target.value }))} className="rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-primary-500" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-primary-900">
            <span>Height (cm)</span>
            <input value={form.height} onChange={(event) => setForm((current) => ({ ...current, height: event.target.value }))} className="rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-primary-500" />
          </label>

          <label className="lg:col-span-2 flex flex-col gap-2 text-sm text-primary-900">
            <span>Description</span>
            <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} className="rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-primary-500" />
          </label>

          <label className="lg:col-span-2 flex flex-col gap-2 text-sm text-primary-900">
            <span>Detail Info JSON</span>
            <textarea value={form.detailInfoText} onChange={(event) => setForm((current) => ({ ...current, detailInfoText: event.target.value }))} rows={6} placeholder='{"material": "cotton"}' className="rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm outline-none focus:border-primary-500" />
          </label>

          <div className="lg:col-span-2 flex flex-col gap-2 text-sm text-primary-900">
            <span>Colors, Sizes & Variants</span>
            <ProductVariantBuilder
              colors={form.colors}
              sizes={form.sizes}
              variants={form.variants}
              onChange={(colors, sizes, variants) =>
                setForm((current) => ({ ...current, colors, sizes, variants }))
              }
            />
          </div>

          <div className="flex flex-col gap-2 text-sm text-primary-900">
            <span>Gallery Images</span>
            <ImagePickerMultiple
              media={media}
              selectedIds={form.galleryImageIds}
              onChange={(ids) => setForm((current) => ({ ...current, galleryImageIds: ids.map(String) }))}
              onUpload={handleGalleryUploaded}
              uploadLabel="Upload gallery images"
              uploadAltPrefix={`Product Gallery ${form.name || form.slug || 'Untitled'}`}
              draftId={draftId}
              showExisting={!!editingId}
            />
          </div>

          {error && <p className="lg:col-span-2 text-sm text-red-600">{error}</p>}

          <div className="lg:col-span-2 flex justify-end">
            <button type="submit" disabled={saving} className="rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-70">
              {saving ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      )}

      {error && !editorOpen && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-neutral-300 bg-neutral-100 shadow-sm">
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
                <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-neutral-800">Dimensions</th>
                <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-neutral-800">Weight</th>
                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-neutral-800">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-300">
              {loading && (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-neutral-700">
                    Loading products...
                  </td>
                </tr>
              )}

              {!loading &&
                filteredProducts.map((product) => (
                  <tr key={product.id} className="transition-colors hover:bg-neutral-200">
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-primary-1000">{product.name}</span>
                        <span className="text-xs text-neutral-700">{product.slug}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-neutral-800">{product.category?.name || '-'}</td>
                    <td className="px-5 py-3 text-neutral-800">{product.season?.name || '-'}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-neutral-200 px-2.5 py-0.5 text-xs font-medium capitalize text-primary-800">{product.gender}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-primary-1000">{formatPrice(product.base_price)}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={cn('font-medium', product.stock === 0 && 'text-red-600', product.stock > 0 && product.stock < 10 && 'text-amber-600', product.stock >= 10 && 'text-emerald-600')}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center text-xs text-neutral-700">
                      {product.length}x{product.width}x{product.height}
                    </td>
                    <td className="px-5 py-3 text-center text-xs text-neutral-700">{product.weight}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/products/${product.id}`} className="rounded-lg p-1.5 text-neutral-700 transition-colors hover:bg-neutral-300 hover:text-primary-1000" title="View details">
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button type="button" onClick={() => openEditForm(product)} className="rounded-lg p-1.5 text-neutral-700 transition-colors hover:bg-neutral-300 hover:text-primary-1000" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => handleDelete(product.id)} className="rounded-lg p-1.5 text-neutral-700 transition-colors hover:bg-red-100 hover:text-red-600" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && filteredProducts.length === 0 && (
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
  )
}

function mergeMedia(current: Media[], incoming: Media[]) {
  return [...incoming, ...current].filter(
    (item, index, array) => array.findIndex((candidate) => candidate.id === item.id) === index,
  )
}

function generateDraftId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}


function MediaPreviewGrid({ mediaItems }: { mediaItems: Media[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {mediaItems.map((item) => (
        <MediaPreviewCard key={item.id} media={item} />
      ))}
    </div>
  )
}

function MediaPreviewCard({ media }: { media: Media }) {
  return (
    <div className="rounded-lg border border-neutral-300 bg-neutral-50 p-3">
      <div className="flex items-start gap-3">
        <img src={media.url} alt={media.alt} className="h-16 w-16 rounded-md object-cover" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-primary-1000">{media.alt || media.filename}</p>
          <p className="truncate text-xs text-neutral-700">#{media.id} • {media.filename}</p>
        </div>
      </div>
    </div>
  )
}
