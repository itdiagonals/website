'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ImageOff, X } from 'lucide-react'
import type { Media } from '@/lib/api'
import MediaUploadButton from '@/components/admin/media-upload-button'
import ImagePreviewModal from '@/components/admin/image-preview-modal'

interface ImagePickerSingleProps {
  media: Media[]
  selectedId: string | number | null
  onSelect: (id: string | number | null) => void
  onUpload: (items: Media[]) => void
  uploadLabel: string
  uploadAltPrefix: string
  draftId?: string
  showExisting?: boolean
}

export default function ImagePickerSingle({
  media,
  selectedId,
  onSelect,
  onUpload,
  uploadLabel,
  uploadAltPrefix,
  draftId,
  showExisting = true,
}: ImagePickerSingleProps) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const selectedMedia = media.find((item) => String(item.id) === String(selectedId))

  return (
    <div className="flex flex-col gap-4">
      {selectedMedia ? (
        <div className="relative w-fit self-start">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="overflow-hidden rounded-lg border-2 border-primary-500 shadow-sm transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <Image
              src={selectedMedia.url}
              alt={selectedMedia.alt || selectedMedia.filename}
              width={192}
              height={192}
              className="h-48 w-48 object-cover"
            />
          </button>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-sm transition-colors hover:bg-red-200"
            title="Remove selected image"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="mt-2 max-w-[12rem] truncate text-xs font-medium text-neutral-700">
            Selected: {selectedMedia.filename}
          </div>

          <ImagePreviewModal
            images={[selectedMedia]}
            currentIndex={0}
            isOpen={previewOpen}
            onClose={() => setPreviewOpen(false)}
          />
        </div>
      ) : (
        <div className="flex h-48 w-48 flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 text-neutral-400">
          <ImageOff className="mb-2 h-8 w-8" />
          <span className="text-sm">No image selected</span>
        </div>
      )}

      <MediaUploadButton
        label={uploadLabel}
        altPrefix={uploadAltPrefix}
        onUploaded={onUpload}
        draftId={draftId}
      />

      {showExisting && media.length > 0 && (
        <div className="mt-2">
          <p className="mb-2 text-xs font-medium text-neutral-600">Or pick from existing:</p>
          <div className="grid max-h-60 grid-cols-3 gap-2 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-2 shadow-inner sm:grid-cols-4 md:grid-cols-5">
            {media.map((item) => {
              const isSelected = String(item.id) === String(selectedId)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={`group relative flex h-20 w-full items-center justify-center overflow-hidden rounded-md border-2 bg-neutral-100 transition-all sm:h-24 md:h-28 ${
                    isSelected ? 'border-primary-500 shadow-sm' : 'border-neutral-200 hover:border-primary-300'
                  }`}
                >
                  <Image
                    src={item.url}
                    alt={item.alt || item.filename}
                    fill
                    sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                    className="object-cover transition-transform group-hover:scale-[1.02]"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary-500/10" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
