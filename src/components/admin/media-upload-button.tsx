'use client'

import { useId, useState } from 'react'
import { ImagePlus, LoaderCircle } from 'lucide-react'

import type { Media } from '@/lib/api'
import { api } from '@/lib/api'
import { convertImageFileToWebP } from '@/lib/image-upload'

interface MediaUploadButtonProps {
  label: string
  altPrefix: string
  multiple?: boolean
  disabled?: boolean
  draftId?: string
  onUploaded: (items: Media[]) => void
}

export default function MediaUploadButton({
  label,
  altPrefix,
  multiple = false,
  disabled = false,
  draftId,
  onUploaded,
}: MediaUploadButtonProps) {
  const inputId = useId()
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) {
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      await api.auth.ensureFreshToken()

      const uploadedItems: Media[] = []
      const files = Array.from(fileList)

      for (const [index, file] of files.entries()) {
        const webpFile = await convertImageFileToWebP(file)
        const alt = buildAltText(altPrefix, file.name, index)
        const uploaded = await api.media.upload(webpFile, alt, draftId)
        uploadedItems.push(uploaded)
      }

      onUploaded(uploadedItems)
      setMessage(`${uploadedItems.length} image uploaded successfully.`)
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : 'Failed to upload image.')
    } finally {
      const input = document.getElementById(inputId) as HTMLInputElement | null
      if (input) {
        input.value = ''
      }
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        disabled={disabled || uploading}
        className="hidden"
        onChange={(event) => void handleFiles(event.target.files)}
      />
      <label
        htmlFor={inputId}
        className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm font-medium text-primary-900 transition-colors hover:bg-neutral-200"
      >
        {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        {uploading ? 'Converting & uploading...' : label}
      </label>
      <p className="text-xs text-neutral-600">Only admins can upload. Images are converted to WebP in the browser before being sent.</p>
      {message && <p className={`text-xs ${message.includes('successfully') ? 'text-emerald-700' : 'text-red-600'}`}>{message}</p>}
    </div>
  )
}

function buildAltText(prefix: string, fileName: string, index: number) {
  const sanitizedPrefix = prefix.trim().replace(/\s+/g, ' ') || 'Admin Upload'
  const sanitizedName = fileName.replace(/\.[^.]+$/, '').trim() || 'image'
  const suffix = index > 0 ? ` ${index + 1}` : ''

  return `${sanitizedPrefix} - ${sanitizedName}${suffix}`
}
