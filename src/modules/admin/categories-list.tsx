'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'

import ImagePickerSingle from '@/components/admin/image-picker-single'
import SlugInput from '@/components/admin/slug-input'
import { api, type Category, type Media } from '@/lib/api'
import { formatDate } from '@/modules/admin/helpers'

interface CategoryFormState {
  name: string
  slug: string
  coverImageId: string
}

const emptyForm: CategoryFormState = {
  name: '',
  slug: '',
  coverImageId: '',
}

export default function CategoriesListModule() {
  const [categories, setCategories] = useState<Category[]>([])
  const [media, setMedia] = useState<Media[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<CategoryFormState>(emptyForm)
  const [draftId, setDraftId] = useState<string | undefined>(undefined)

  async function loadData() {
    setLoading(true)
    setError(null)

    try {
      const categoryItems = await api.categories.getAll()
      setCategories(categoryItems)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to load categories.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const filteredCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.slug.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [categories, searchTerm],
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

  function openEditForm(category: Category) {
    setEditingId(category.id)
    setForm({
      name: category.name,
      slug: category.slug,
      coverImageId: category.cover_image_id ? String(category.cover_image_id) : '',
    })
    setDraftId(undefined)
    setEditorOpen(true)
    setError(null)
    void api.media.getAll().then(setMedia).catch(() => undefined)
  }

  function closeEditor() {
    setEditorOpen(false)
    setEditingId(null)
    setForm(emptyForm)
    setDraftId(undefined)
  }

  function handleMediaUploaded(items: Media[]) {
    if (!items.length) {
      return
    }

    setMedia((current) => mergeMedia(current, items))
    setForm((current) => ({ ...current, coverImageId: String(items[0].id) }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        cover_image_id: form.coverImageId ? Number.parseInt(form.coverImageId, 10) || 0 : 0,
        draft_id: editingId ? undefined : draftId,
      }

      if (editingId) {
        await api.categories.update(editingId, payload)
      } else {
        await api.categories.create(payload)
      }

      closeEditor()
      await loadData()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to save category.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(categoryId: number) {
    if (!window.confirm('Delete this category?')) {
      return
    }

    try {
      await api.categories.delete(categoryId)
      await loadData()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to delete category.')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-1000">Categories</h1>
          <p className="mt-1 text-sm text-neutral-700">Manage product categories from the Go backend API.</p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-400"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      <div className="relative w-full max-w-sm">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-700">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="w-full rounded-lg border border-neutral-300 bg-neutral-100 py-2.5 pl-10 pr-4 text-sm text-primary-1000 placeholder:text-neutral-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {editorOpen && (
        <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border border-neutral-300 bg-neutral-100 p-5 shadow-sm lg:grid-cols-3">
          <div className="lg:col-span-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-primary-1000">{editingId ? 'Edit category' : 'Create category'}</h2>
            <button type="button" onClick={closeEditor} className="text-sm font-medium text-neutral-700 hover:text-primary-1000">
              Cancel
            </button>
          </div>

          <label className="flex flex-col gap-2 text-sm text-primary-900">
            <span>Name</span>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
            />
          </label>

          <SlugInput
            name={form.name}
            slug={form.slug}
            onChange={(slug) => setForm((current) => ({ ...current, slug }))}
          />

          <div className="flex flex-col gap-2 text-sm text-primary-900">
            <span>Cover Image</span>
            <ImagePickerSingle
              media={media}
              selectedId={form.coverImageId}
              onSelect={(id) => setForm((current) => ({ ...current, coverImageId: id ? String(id) : '' }))}
              onUpload={handleMediaUploaded}
              uploadLabel="Upload new cover"
              uploadAltPrefix={`Category Cover ${form.name || form.slug || 'Untitled'}`}
              draftId={draftId}
              showExisting={!!editingId}
            />
          </div>

          {error && <p className="lg:col-span-3 text-sm text-red-600">{error}</p>}

          <div className="lg:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? 'Saving...' : editingId ? 'Update Category' : 'Create Category'}
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
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Name</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Slug</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Cover</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Updated</th>
                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-neutral-800">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-300">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-neutral-700">
                    Loading categories...
                  </td>
                </tr>
              )}

              {!loading &&
                filteredCategories.map((category) => (
                  <tr key={category.id} className="transition-colors hover:bg-neutral-200">
                    <td className="px-5 py-3 font-medium text-primary-1000">{category.name}</td>
                    <td className="px-5 py-3 font-mono text-xs text-neutral-700">{category.slug}</td>
                    <td className="px-5 py-3 text-neutral-800">{category.cover_image?.alt || (category.cover_image_id ? `#${category.cover_image_id}` : '-')}</td>
                    <td className="px-5 py-3 text-neutral-700">{formatDate(category.updated_at)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(category)}
                          className="rounded-lg p-1.5 text-neutral-700 transition-colors hover:bg-neutral-300 hover:text-primary-1000"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(category.id)}
                          className="rounded-lg p-1.5 text-neutral-700 transition-colors hover:bg-red-100 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-neutral-700">
                    No categories found
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


function MediaPreviewCard({ media }: { media: Media }) {
  return (
    <div className="rounded-lg border border-neutral-300 bg-neutral-50 p-3">
      <div className="flex items-start gap-3">
        <Image src={media.url} alt={media.alt} width={64} height={64} className="h-16 w-16 rounded-md object-cover" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-primary-1000">{media.alt || media.filename}</p>
          <p className="truncate text-xs text-neutral-700">#{media.id} • {media.filename}</p>
        </div>
      </div>
    </div>
  )
}
