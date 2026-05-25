'use client'

import { useState } from 'react'
import { Check, X, Eye } from 'lucide-react'
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

  const selectedMediaItems = selectedIds
    .map((id) => media.find((m) => String(m.id) === String(id)))
    .filter(Boolean) as Media[]

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

  function openExistingPreview(item: Media) {
    setPreviewIndex(0)
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
                  className="h-full w-full"
                >
                  <img
                    src={item.url}
                    alt={item.alt || item.filename}
                    className="h-full w-full object-cover transition-transform hover:scale-105"
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
        <div className="grid max-h-96 grid-cols-3 gap-2 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50 p-2 shadow-inner sm:grid-cols-4 sm:gap-3 sm:p-3 md:grid-cols-5 lg:grid-cols-6">
          {media.map((item) => {
            const isSelected = selectedIds.map(String).includes(String(item.id))
            return (
              <div
                key={item.id}
                className={`group relative aspect-square overflow-hidden rounded-md border-2 transition-all ${
                  isSelected ? 'border-primary-500 shadow-sm' : 'border-transparent hover:border-neutral-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleSelection(item.id)}
                  className="h-full w-full"
                >
                  <img
                    src={item.url}
                    alt={item.alt || item.filename}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
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
