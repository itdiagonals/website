'use client'

import { Plus, Trash2 } from 'lucide-react'

export interface DetailInfoItem {
  key: string
  value: string
}

interface DynamicKeyValueEditorProps {
  items: DetailInfoItem[]
  onChange: (items: DetailInfoItem[]) => void
  disabled?: boolean
}

export default function DynamicKeyValueEditor({ items, onChange, disabled }: DynamicKeyValueEditorProps) {
  function addItem() {
    onChange([...items, { key: '', value: '' }])
  }

  function removeItem(index: number) {
    const next = items.filter((_, i) => i !== index)
    onChange(next)
  }

  function updateItem(index: number, field: 'key' | 'value', value: string) {
    const next = items.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 && (
        <p className="text-sm text-neutral-500">No detail fields added yet.</p>
      )}

      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-2">
          <div className="flex flex-1 flex-col gap-1">
            <input
              type="text"
              placeholder="Field name (e.g. Material)"
              value={item.key}
              onChange={(event) => updateItem(index, 'key', event.target.value)}
              disabled={disabled}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <input
              type="text"
              placeholder="Value (e.g. 100% Cotton)"
              value={item.value}
              onChange={(event) => updateItem(index, 'value', event.target.value)}
              disabled={disabled}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
            />
          </div>
          <button
            type="button"
            onClick={() => removeItem(index)}
            disabled={disabled}
            title="Remove field"
            className="mt-1 rounded-lg p-2 text-neutral-600 transition-colors hover:bg-red-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        disabled={disabled}
        className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs font-medium text-primary-900 transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus className="h-3.5 w-3.5" />
        Add detail field
      </button>
    </div>
  )
}

export function detailInfoToObject(items: DetailInfoItem[]): Record<string, unknown> | null {
  const obj: Record<string, unknown> = {}
  let hasValue = false

  for (const item of items) {
    const key = item.key.trim()
    const value = item.value.trim()
    if (key) {
      obj[key] = value || ''
      hasValue = true
    }
  }

  return hasValue ? obj : null
}

export function objectToDetailInfo(value: Record<string, unknown> | null): DetailInfoItem[] {
  if (!value || typeof value !== 'object') {
    return []
  }

  return Object.entries(value).map(([key, val]) => ({
    key,
    value: typeof val === 'string' ? val : JSON.stringify(val),
  }))
}
