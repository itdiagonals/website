'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'

import ImagePickerSingle from '@/components/admin/image-picker-single'
import ImagePickerMultiple from '@/components/admin/image-picker-multiple'
import SlugInput from '@/components/admin/slug-input'
import { api, type Media, type Season } from '@/lib/api'
import { formatDate } from '@/modules/admin/helpers'

interface SeasonFormState {
  name: string
  slug: string
  subtitle: string
  description: string
  coverImageId: string
  lookbookImageIds: string[]
  isActive: boolean
}

const emptyForm: SeasonFormState = {
  name: '',
  slug: '',
  subtitle: '',
  description: '',
  coverImageId: '',
  lookbookImageIds: [],
  isActive: true,
}

export default function SeasonsListModule() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [media, setMedia] = useState<Media[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<SeasonFormState>(emptyForm)
  const [draftId, setDraftId] = useState<string | undefined>(undefined)

  async function loadData() {
    setLoading(true)
    setError(null)

    try {
      const seasonItems = await api.seasons.getAll()
      setSeasons(seasonItems)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to load seasons.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const filteredSeasons = useMemo(
    () =>
      seasons.filter((season) => {
        const haystack = `${season.name} ${season.slug} ${season.subtitle || ''} ${season.description || ''}`.toLowerCase()
        return haystack.includes(searchTerm.toLowerCase())
      }),
    [searchTerm, seasons],
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

  function openEditForm(season: Season) {
    setEditingId(season.id)
    setForm({
      name: season.name,
      slug: season.slug,
      subtitle: season.subtitle || '',
      description: season.description || '',
      coverImageId: season.cover_image_id ? String(season.cover_image_id) : '',
      lookbookImageIds: (season.lookbook_images || []).map((item) => String(item.id)),
      isActive: season.is_active,
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

  function handleLookbookUploaded(items: Media[]) {
    if (!items.length) {
      return
    }

    setMedia((current) => mergeMedia(current, items))
    setForm((current) => ({
      ...current,
      lookbookImageIds: Array.from(new Set([...current.lookbookImageIds, ...items.map((item) => String(item.id))])),
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        subtitle: form.subtitle.trim(),
        description: form.description.trim(),
        cover_image_id: form.coverImageId ? Number.parseInt(form.coverImageId, 10) || 0 : 0,
        lookbook_image_ids: form.lookbookImageIds.map((value) => Number.parseInt(value, 10)).filter(Boolean),
        is_active: form.isActive,
        draft_id: editingId ? undefined : draftId,
      }

      if (editingId) {
        await api.seasons.update(editingId, payload)
      } else {
        await api.seasons.create(payload)
      }

      closeEditor()
      await loadData()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to save season.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(seasonId: number) {
    if (!window.confirm('Delete this season?')) {
      return
    }

    try {
      await api.seasons.delete(seasonId)
      await loadData()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to delete season.')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-1000">Seasons</h1>
          <p className="mt-1 text-sm text-neutral-700">Manage season records, cover image, and lookbook media.</p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-400"
        >
          <Plus className="h-4 w-4" />
          Add Season
        </button>
      </div>

      <div className="relative w-full max-w-sm">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-700">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          placeholder="Search seasons..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="w-full rounded-lg border border-neutral-300 bg-neutral-100 py-2.5 pl-10 pr-4 text-sm text-primary-1000 placeholder:text-neutral-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {editorOpen && (
        <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border border-neutral-300 bg-neutral-100 p-5 shadow-sm lg:grid-cols-2">
          <div className="lg:col-span-2 flex items-center justify-between">
            <h2 className="text-base font-bold text-primary-1000">{editingId ? 'Edit season' : 'Create season'}</h2>
            <button type="button" onClick={closeEditor} className="text-sm font-medium text-neutral-700 hover:text-primary-1000">
              Cancel
            </button>
          </div>

          <label className="flex flex-col gap-2 text-sm text-primary-900">
            <span>Name</span>
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required className="rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-primary-500" />
          </label>

          <SlugInput
            name={form.name}
            slug={form.slug}
            onChange={(slug) => setForm((current) => ({ ...current, slug }))}
          />

          <label className="flex flex-col gap-2 text-sm text-primary-900">
            <span>Subtitle</span>
            <input value={form.subtitle} onChange={(event) => setForm((current) => ({ ...current, subtitle: event.target.value }))} className="rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-primary-500" />
          </label>

          <div className="flex flex-col gap-2 text-sm text-primary-900">
            <span>Cover Image</span>
            <ImagePickerSingle
              media={media}
              selectedId={form.coverImageId}
              onSelect={(id) => setForm((current) => ({ ...current, coverImageId: id ? String(id) : '' }))}
              onUpload={handleCoverUploaded}
              uploadLabel="Upload new cover"
              uploadAltPrefix={`Season Cover ${form.name || form.slug || 'Untitled'}`}
              draftId={draftId}
              showExisting={!!editingId}
            />
          </div>

          <label className="lg:col-span-2 flex flex-col gap-2 text-sm text-primary-900">
            <span>Description</span>
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              rows={4}
              className="rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-primary-500"
            />
          </label>

          <div className="lg:col-span-2 flex flex-col gap-2 text-sm text-primary-900">
            <span>Lookbook Images</span>
            <ImagePickerMultiple
              media={media}
              selectedIds={form.lookbookImageIds}
              onChange={(ids) => setForm((current) => ({ ...current, lookbookImageIds: ids.map(String) }))}
              onUpload={handleLookbookUploaded}
              uploadLabel="Upload lookbook images"
              uploadAltPrefix={`Season Lookbook ${form.name || form.slug || 'Untitled'}`}
              draftId={draftId}
              showExisting={!!editingId}
            />
          </div>

          <label className="lg:col-span-2 flex items-center gap-3 rounded-lg border border-neutral-300 px-3 py-3 text-sm text-primary-900">
            <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
            Active season
          </label>

          {error && <p className="lg:col-span-2 text-sm text-red-600">{error}</p>}

          <div className="lg:col-span-2 flex justify-end">
            <button type="submit" disabled={saving} className="rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-70">
              {saving ? 'Saving...' : editingId ? 'Update Season' : 'Create Season'}
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
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Subtitle</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Status</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Lookbook</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Updated</th>
                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-neutral-800">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-300">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-neutral-700">
                    Loading seasons...
                  </td>
                </tr>
              )}

              {!loading &&
                filteredSeasons.map((season) => (
                  <tr key={season.id} className="transition-colors hover:bg-neutral-200">
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-primary-1000">{season.name}</span>
                        <span className="text-xs text-neutral-700">{season.slug}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-neutral-800">{season.subtitle || '-'}</td>
                    <td className="px-5 py-3 text-neutral-800">{season.is_active ? 'Active' : 'Inactive'}</td>
                    <td className="px-5 py-3 text-neutral-800">{season.lookbook_images?.length || 0} image(s)</td>
                    <td className="px-5 py-3 text-neutral-700">{formatDate(season.updated_at)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button type="button" onClick={() => openEditForm(season)} className="rounded-lg p-1.5 text-neutral-700 transition-colors hover:bg-neutral-300 hover:text-primary-1000">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => handleDelete(season.id)} className="rounded-lg p-1.5 text-neutral-700 transition-colors hover:bg-red-100 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && filteredSeasons.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-neutral-700">
                    No seasons found
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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
