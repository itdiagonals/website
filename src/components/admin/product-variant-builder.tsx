'use client'

import { useState, useCallback, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'

export interface BuilderColor {
  id: string
  name: string
  hex: string
}

export interface BuilderSize {
  id: string
  value: string
}

export interface BuilderVariant {
  colorName: string
  size: string
  stock: number
}

interface ProductVariantBuilderProps {
  colors: BuilderColor[]
  sizes: BuilderSize[]
  variants: BuilderVariant[]
  onChange: (colors: BuilderColor[], sizes: BuilderSize[], variants: BuilderVariant[]) => void
}

function generateId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function regenerateVariants(
  colors: BuilderColor[],
  sizes: BuilderSize[],
  currentVariants: BuilderVariant[],
): BuilderVariant[] {
  const colorNames = colors.map((c) => c.name).filter(Boolean)
  const sizeValues = sizes.map((s) => s.value).filter(Boolean)

  if (colorNames.length === 0 || sizeValues.length === 0) {
    return []
  }

  const variantMap = new Map<string, BuilderVariant>()
  for (const v of currentVariants) {
    variantMap.set(`${v.colorName}|${v.size}`, v)
  }

  const next: BuilderVariant[] = []
  for (const colorName of colorNames) {
    for (const sizeValue of sizeValues) {
      const key = `${colorName}|${sizeValue}`
      const existing = variantMap.get(key)
      next.push({
        colorName,
        size: sizeValue,
        stock: existing ? existing.stock : 0,
      })
    }
  }

  return next
}

export default function ProductVariantBuilder({
  colors,
  sizes,
  variants,
  onChange,
}: ProductVariantBuilderProps) {
  const [localColors, setLocalColors] = useState<BuilderColor[]>(colors.length > 0 ? colors : [])
  const [localSizes, setLocalSizes] = useState<BuilderSize[]>(sizes.length > 0 ? sizes : [])
  const [localVariants, setLocalVariants] = useState<BuilderVariant[]>(variants)

  useEffect(() => {
    setLocalColors(colors.length > 0 ? colors : [])
    setLocalSizes(sizes.length > 0 ? sizes : [])
    setLocalVariants(variants)
  }, [colors, sizes, variants])

  const updateParent = useCallback(
    (nextColors: BuilderColor[], nextSizes: BuilderSize[], nextVariants: BuilderVariant[]) => {
      setLocalColors(nextColors)
      setLocalSizes(nextSizes)
      setLocalVariants(nextVariants)
      onChange(nextColors, nextSizes, nextVariants)
    },
    [onChange],
  )

  const addColor = useCallback(() => {
    const nextColors = [...localColors, { id: generateId(), name: '', hex: '#000000' }]
    const nextVariants = regenerateVariants(nextColors, localSizes, localVariants)
    updateParent(nextColors, localSizes, nextVariants)
  }, [localColors, localSizes, localVariants, updateParent])

  const updateColor = useCallback(
    (id: string, patch: Partial<BuilderColor>) => {
      const nextColors = localColors.map((c) => (c.id === id ? { ...c, ...patch } : c))
      const nextVariants = regenerateVariants(nextColors, localSizes, localVariants)
      updateParent(nextColors, localSizes, nextVariants)
    },
    [localColors, localSizes, localVariants, updateParent],
  )

  const removeColor = useCallback(
    (id: string) => {
      const nextColors = localColors.filter((c) => c.id !== id)
      const nextVariants = regenerateVariants(nextColors, localSizes, localVariants)
      updateParent(nextColors, localSizes, nextVariants)
    },
    [localColors, localSizes, localVariants, updateParent],
  )

  const addSize = useCallback(() => {
    const nextSizes = [...localSizes, { id: generateId(), value: '' }]
    const nextVariants = regenerateVariants(localColors, nextSizes, localVariants)
    updateParent(localColors, nextSizes, nextVariants)
  }, [localColors, localSizes, localVariants, updateParent])

  const updateSize = useCallback(
    (id: string, value: string) => {
      const nextSizes = localSizes.map((s) => (s.id === id ? { ...s, value } : s))
      const nextVariants = regenerateVariants(localColors, nextSizes, localVariants)
      updateParent(localColors, nextSizes, nextVariants)
    },
    [localColors, localSizes, localVariants, updateParent],
  )

  const removeSize = useCallback(
    (id: string) => {
      const nextSizes = localSizes.filter((s) => s.id !== id)
      const nextVariants = regenerateVariants(localColors, nextSizes, localVariants)
      updateParent(localColors, nextSizes, nextVariants)
    },
    [localColors, localSizes, localVariants, updateParent],
  )

  const updateVariantStock = useCallback(
    (colorName: string, size: string, stock: number) => {
      const nextVariants = localVariants.map((v) =>
        v.colorName === colorName && v.size === size ? { ...v, stock: Math.max(0, stock) } : v,
      )
      setLocalVariants(nextVariants)
      onChange(localColors, localSizes, nextVariants)
    },
    [localColors, localSizes, localVariants, onChange],
  )

  const totalStock = localVariants.reduce((sum, v) => sum + v.stock, 0)

  const hasColors = localColors.length > 0 && localColors.some((c) => c.name.trim())
  const hasSizes = localSizes.length > 0 && localSizes.some((s) => s.value.trim())
  const showVariants = hasColors && hasSizes

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
        <div className="flex-1">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-primary-900">Available Colors</span>
            <button
              type="button"
              onClick={addColor}
              className="inline-flex items-center gap-1 rounded-md bg-neutral-200 px-2 py-1 text-xs font-medium text-neutral-800 transition-colors hover:bg-neutral-300"
            >
              <Plus className="h-3 w-3" />
              Add color
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {localColors.length === 0 && (
              <p className="text-xs text-neutral-500">No colors added yet.</p>
            )}
            {localColors.map((color) => (
              <div key={color.id} className="flex items-center gap-2">
                <input
                  type="color"
                  value={color.hex}
                  onChange={(e) => updateColor(color.id, { hex: e.target.value })}
                  className="h-9 w-9 flex-shrink-0 cursor-pointer rounded border border-neutral-300 bg-white p-0.5"
                />
                <input
                  type="text"
                  value={color.name}
                  onChange={(e) => updateColor(color.id, { name: e.target.value })}
                  placeholder="Color name"
                  className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm outline-none focus:border-primary-500"
                />
                <button
                  type="button"
                  onClick={() => removeColor(color.id)}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600"
                  title="Remove color"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-primary-900">Available Sizes</span>
            <button
              type="button"
              onClick={addSize}
              className="inline-flex items-center gap-1 rounded-md bg-neutral-200 px-2 py-1 text-xs font-medium text-neutral-800 transition-colors hover:bg-neutral-300"
            >
              <Plus className="h-3 w-3" />
              Add size
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {localSizes.length === 0 && (
              <p className="text-xs text-neutral-500">No sizes added yet.</p>
            )}
            {localSizes.map((size) => (
              <div key={size.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={size.value}
                  onChange={(e) => updateSize(size.id, e.target.value)}
                  placeholder="e.g. S, M, L"
                  className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm outline-none focus:border-primary-500"
                />
                <button
                  type="button"
                  onClick={() => removeSize(size.id)}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600"
                  title="Remove size"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showVariants && (
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium text-primary-900">Variants & Stock</span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              Total stock: {totalStock}
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-neutral-300">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-300 bg-neutral-200">
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">
                    Color
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">
                    Size
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wide text-neutral-800">
                    Stock
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-300">
                {localVariants.map((variant, index) => (
                  <tr
                    key={`${variant.colorName}|${variant.size}`}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-4 w-4 flex-shrink-0 rounded-full border border-neutral-300"
                          style={{
                            backgroundColor:
                              localColors.find((c) => c.name === variant.colorName)?.hex || '#ccc',
                          }}
                        />
                        <span className="font-medium text-primary-900">{variant.colorName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-neutral-800">{variant.size}</td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min={0}
                        value={variant.stock}
                        onChange={(e) =>
                          updateVariantStock(
                            variant.colorName,
                            variant.size,
                            Number.parseInt(e.target.value || '0', 10),
                          )
                        }
                        className="w-20 rounded border border-neutral-300 px-2 py-1 text-right text-sm outline-none focus:border-primary-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!showVariants && (localColors.length > 0 || localSizes.length > 0) && (
        <p className="text-xs text-neutral-500">
          Add at least one color name and one size to generate variant combinations.
        </p>
      )}
    </div>
  )
}
