'use client'

import { useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Media } from '@/lib/api'

interface ImagePreviewModalProps {
  images: Media[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onNavigate?: (index: number) => void
}

export default function ImagePreviewModal({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}: ImagePreviewModalProps) {
  const hasNavigation = images.length > 1
  const currentImage = images[currentIndex]

  const goNext = useCallback(() => {
    if (!hasNavigation || !onNavigate) return
    const next = (currentIndex + 1) % images.length
    onNavigate(next)
  }, [currentIndex, images.length, hasNavigation, onNavigate])

  const goPrev = useCallback(() => {
    if (!hasNavigation || !onNavigate) return
    const prev = (currentIndex - 1 + images.length) % images.length
    onNavigate(prev)
  }, [currentIndex, images.length, hasNavigation, onNavigate])

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowRight':
          goNext()
          break
        case 'ArrowLeft':
          goPrev()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose, goNext, goPrev])

  if (!isOpen || !currentImage) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:right-6 sm:top-6"
        aria-label="Close preview"
      >
        <X className="h-5 w-5" />
      </button>

      {hasNavigation && (
        <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-md sm:top-6">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {hasNavigation && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            goPrev()
          }}
          className="absolute left-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:left-6 md:left-8"
          aria-label="Previous image"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      <div
        className="mx-12 flex max-h-[85vh] max-w-[90vw] items-center justify-center sm:mx-16 md:mx-20"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentImage.url}
          alt={currentImage.alt || currentImage.filename}
          className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl sm:max-h-[80vh] md:max-h-[85vh]"
        />
      </div>

      {hasNavigation && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            goNext()
          }}
          className="absolute right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:right-6 md:right-8"
          aria-label="Next image"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
