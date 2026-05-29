'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'

import { api, type CareGuide } from '@/lib/api'
import { formatDate, parseJsonObject, stringifyJson } from '@/modules/admin/helpers'

interface CareGuideFormState {
  title: string
  instructionsText: string
}

const emptyForm: CareGuideFormState = {
  title: '',
  instructionsText: '',
}

export default function CareGuidesListModule() {
  const [careGuides, setCareGuides] = useState<CareGuide[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<CareGuideFormState>(emptyForm)

  async function loadData() {
    setLoading(true)
    setError(null)

    try {
      setCareGuides(await api.careGuides.getAll())
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to load care guides.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const filteredGuides = useMemo(
    () => careGuides.filter((guide) => guide.title.toLowerCase().includes(searchTerm.toLowerCase())),
    [careGuides, searchTerm],
  )

  function openCreateForm() {
    setEditingId(null)
    setForm(emptyForm)
    setEditorOpen(true)
    setError(null)
  }

  function openEditForm(guide: CareGuide) {
    setEditingId(guide.id)
    setForm({
      title: guide.title,
      instructionsText: stringifyJson(guide.instructions),
    })
    setEditorOpen(true)
    setError(null)
  }

  function closeEditor() {
    setEditingId(null)
    setForm(emptyForm)
    setEditorOpen(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const payload = {
        title: form.title.trim(),
        instructions: parseJsonObject(form.instructionsText),
      }

      if (editingId) {
        await api.careGuides.update(editingId, payload)
      } else {
        await api.careGuides.create(payload)
      }

      closeEditor()
      await loadData()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to save care guide.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(guideId: number) {
    if (!window.confirm('Delete this care guide?')) {
      return
    }

    try {
      await api.careGuides.delete(guideId)
      await loadData()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to delete care guide.')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-1000">Care Guides</h1>
          <p className="mt-1 text-sm text-neutral-700">Manage JSON-based care instructions used by products.</p>
        </div>
        <button type="button" onClick={openCreateForm} className="flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-400">
          <Plus className="h-4 w-4" />
          Add Care Guide
        </button>
      </div>

      <div className="relative w-full max-w-sm">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-700">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          placeholder="Search care guides..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="w-full rounded-lg border border-neutral-300 bg-neutral-100 py-2.5 pl-10 pr-4 text-sm text-primary-1000 placeholder:text-neutral-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {editorOpen && (
        <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border border-neutral-300 bg-neutral-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-primary-1000">{editingId ? 'Edit care guide' : 'Create care guide'}</h2>
            <button type="button" onClick={closeEditor} className="text-sm font-medium text-neutral-700 hover:text-primary-1000">
              Cancel
            </button>
          </div>

          <label className="flex flex-col gap-2 text-sm text-primary-900">
            <span>Title</span>
            <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required className="rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-primary-500" />
          </label>

          <label className="flex flex-col gap-2 text-sm text-primary-900">
            <span>Instructions JSON</span>
            <textarea
              value={form.instructionsText}
              onChange={(event) => setForm((current) => ({ ...current, instructionsText: event.target.value }))}
              rows={8}
              placeholder='{"wash": "cold", "dry": "air dry"}'
              className="rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm outline-none focus:border-primary-500"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-70">
              {saving ? 'Saving...' : editingId ? 'Update Care Guide' : 'Create Care Guide'}
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
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Title</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Instructions</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Updated</th>
                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-neutral-800">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-300">
              {loading && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-neutral-700">
                    Loading care guides...
                  </td>
                </tr>
              )}

              {!loading &&
                filteredGuides.map((guide) => (
                  <tr key={guide.id} className="transition-colors hover:bg-neutral-200">
                    <td className="px-5 py-3 font-medium text-primary-1000">{guide.title}</td>
                    <td className="px-5 py-3 text-xs text-neutral-800">{stringifyJson(guide.instructions) || '-'}</td>
                    <td className="px-5 py-3 text-neutral-700">{formatDate(guide.updated_at)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button type="button" onClick={() => openEditForm(guide)} className="rounded-lg p-1.5 text-neutral-700 transition-colors hover:bg-neutral-300 hover:text-primary-1000">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => handleDelete(guide.id)} className="rounded-lg p-1.5 text-neutral-700 transition-colors hover:bg-red-100 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && filteredGuides.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-neutral-700">
                    No care guides found
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
