'use client'

import { useEffect, useState } from 'react'
import { Pencil, PencilOff } from 'lucide-react'

function toKebabCase(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

interface SlugInputProps {
  name: string
  slug: string
  onChange: (slug: string) => void
  disabled?: boolean
}

export default function SlugInput({ name, slug, onChange, disabled }: SlugInputProps) {
  const [auto, setAuto] = useState(true)

  useEffect(() => {
    if (!auto) return
    const derived = toKebabCase(name)
    if (derived !== slug) {
      onChange(derived)
    }
  }, [name, auto])

  function toggleAuto() {
    if (!auto) {
      setAuto(true)
      onChange(toKebabCase(name))
    } else {
      setAuto(false)
    }
  }

  return (
    <label className="flex flex-col gap-2 text-sm text-primary-900">
      <span className="flex items-center justify-between">
        <span>Slug</span>
        <button
          type="button"
          onClick={toggleAuto}
          disabled={disabled}
          title={auto ? 'Switch to manual slug editing' : 'Auto-generate slug from name'}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-200 hover:text-primary-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {auto ? <Pencil className="h-3 w-3" /> : <PencilOff className="h-3 w-3" />}
          {auto ? 'Auto' : 'Manual'}
        </button>
      </span>
      <input
        value={slug}
        onChange={(event) => onChange(event.target.value)}
        required
        disabled={disabled}
        readOnly={auto}
        className={`rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-500 ${auto ? 'cursor-default bg-neutral-200 text-neutral-600' : 'bg-white text-primary-900'}`}
      />
    </label>
  )
}
