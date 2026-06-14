'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Check, X, Eye, Search } from 'lucide-react'
import type { Media } from '@/lib/api'
import MediaUploadButton from '@/components/admin/media-upload-button'
import ImagePreviewModal from '@/components/admin/image-preview-modal'

interface ImagePickerMultipleProps {
  media: Media[]
  selectedIds: (string | number)[]
  onChange: (ids: (string | number)[]) => void
  onUpload: (items: Media[]) => void
  uploadLabel: string
  uploadAltPrefix: string
  draftId?: string
  showExisting?: boolean
}

export default function ImagePickerMultiple({
  media,
  selectedIds,
  onChange,
  onUpload,
  uploadLabel,
  uploadAltPrefix,
  draftId,
  showExisting = true,
}: ImagePickerMultipleProps) {
  const selectedCount = selectedIds.length
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  const selectedMediaItems = selectedIds
    .map((id) => media.find((m) => String(m.id) === String(id)))
    .filter(Boolean) as Media[]

  const filteredMedia = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return media
    return media.filter((item) =>
      (item.alt || item.filename || '').toLowerCase().includes(query)
    )
  }, [media, searchQuery])

  function toggleSelection(id: string | number) {
    const stringId = String(id)
    const isSelected = selectedIds.map(String).includes(stringId)

    if (isSelected) {
      onChange(selectedIds.filter((selectedId) => String(selectedId) !== stringId))
    } else {
      onChange([...selectedIds, stringId])
    }
  }

  function openPreviewAt(index: number) {
    if (selectedMediaItems.length === 0) return
    setPreviewIndex(index)
    setPreviewOpen(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-primary-900">
          Selected ({selectedCount})
        </span>
        {selectedCount > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-wrap gap-3">
          {selectedIds.map((id, index) => {
            const item = media.find((m) => String(m.id) === String(id))
            if (!item) return null
            return (
              <div key={id} className="relative h-24 w-24 overflow-hidden rounded-lg border border-neutral-200 shadow-sm sm:h-28 sm:w-28 md:h-32 md:w-32">
                <button
                  type="button"
                  onClick={() => openPreviewAt(index)}
                  className="relative h-full w-full"
                >
                  <Image
                    src={item.url}
                    alt={item.alt || item.filename}
                    fill
                    sizes="(max-width: 640px) 96px, (max-width: 768px) 112px, 128px"
                    className="object-cover transition-transform hover:scale-105"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => toggleSelection(id)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-sm transition-colors hover:bg-red-200"
                  title="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <MediaUploadButton
        label={uploadLabel}
        altPrefix={uploadAltPrefix}
        onUploaded={onUpload}
        multiple
        draftId={draftId}
      />

      {showExisting && media.length > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Existing Media ({filteredMedia.length})
            </span>
            <div className="relative w-full max-w-xs">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400">
                <Search className="h-3.5 w-3.5" />
              </div>
              <input
                type="text"
                placeholder="Search media..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-neutral-200 bg-white py-1.5 pl-8 pr-3 text-xs text-primary-1000 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="grid max-h-80 grid-cols-3 gap-3 overflow-y-auto rounded-md bg-white p-3 shadow-sm sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {filteredMedia.map((item) => {
              const isSelected = selectedIds.map(String).includes(String(item.id))
              return (
                <div
                  key={item.id}
                  className={`group relative h-24 w-full overflow-hidden rounded-md border-2 bg-neutral-100 transition-all sm:h-28 md:h-32 ${
                    isSelected ? 'border-primary-500 shadow-sm' : 'border-neutral-200 hover:border-primary-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSelection(item.id)}
                    className="absolute inset-0 flex items-center justify-center overflow-hidden"
                  >
                    <Image
                      src={item.url}
                      alt={item.alt || item.filename}
                      fill
                      sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                      className="object-cover transition-transform group-hover:scale-[1.02]"
                    />
                    {isSelected && (
                      <>
                        <div className="absolute inset-0 bg-primary-500/10" />
                        <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-white shadow-sm">
                          <Check className="h-3 w-3" />
                        </div>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPreviewIndex(0)
                      setPreviewOpen(true)
                    }}
                    className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/30 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
                    title="Preview image"
                  >
                    <Eye className="h-3 w-3" />
                  </button>
                </div>
              )
            })}
          </div>

          {filteredMedia.length === 0 && (
            <p className="text-center text-xs text-neutral-400 py-4">
              No media found matching your search.
            </p>
          )}
        </div>
      )}

      <ImagePreviewModal
        images={selectedMediaItems}
        currentIndex={previewIndex}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        onNavigate={setPreviewIndex}
      />
    </div>
  )
}
