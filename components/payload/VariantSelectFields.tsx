'use client'

import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useField, useFormFields } from '@payloadcms/ui'

// ─── Types ────────────────────────────────────────────────────────────────────

type FieldState = { value?: unknown }
type FormFieldsState = Record<string, FieldState | undefined>

type VariantFieldProps = {
  path: string
  readOnly?: boolean
}

type SelectOption = {
  label: string
  value: string
  isLegacy?: boolean
}

type VariantSelectConfig = {
  placeholder: string
  sourceFieldName: string
  sourceKey: string
}

type CustomDropdownProps = {
  disabled?: boolean
  onChange: (nextValue: string) => void
  options: SelectOption[]
  placeholder: string
  value: string
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const S = {
  root: {
    position: 'relative' as const,
    marginBottom: '10px',
    width: '100%',
    maxWidth: '500px',
    fontFamily: 'inherit',
  },
  trigger: (disabled: boolean, open: boolean): React.CSSProperties => ({
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    padding: '9px 12px',
    border: `1px solid ${open ? '#525252' : '#3a3a3a'}`,
    borderRadius: '6px',
    background: disabled ? 'rgba(20,20,20,0.6)' : '#111',
    color: disabled ? '#555' : '#e5e5e5',
    fontSize: '13px',
    lineHeight: '1.4',
    textAlign: 'left' as const,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxShadow: open ? '0 0 0 2px rgba(120,120,120,0.15)' : 'none',
    outline: 'none',
  }),
  triggerLabel: (hasValue: boolean): React.CSSProperties => ({
    color: hasValue ? '#e5e5e5' : '#666',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    flex: 1,
  }),
  chevron: (open: boolean): React.CSSProperties => ({
    width: '16px',
    height: '16px',
    flexShrink: 0,
    color: '#777',
    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
    transition: 'transform 0.15s ease',
  }),
  dropdown: {
    position: 'absolute' as const,
    left: 0,
    top: 'calc(100% + 4px)',
    zIndex: 9999,
    width: '100%',
    overflow: 'hidden',
    borderRadius: '6px',
    border: '1px solid #3a3a3a',
    background: '#111',
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
  },
  optionBase: {
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    fontSize: '13px',
    textAlign: 'left' as const,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.1s',
  },
  optionSelected: {
    background: '#1f1f1f',
    color: '#fff',
  },
  optionDefault: {
    color: '#ccc',
  },
  optionPlaceholder: {
    color: '#666',
  },
  legacyBadge: {
    fontSize: '10px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: '#f59e0b',
    background: 'rgba(245,158,11,0.1)',
    padding: '2px 6px',
    borderRadius: '4px',
    flexShrink: 0,
  },
} as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

const normalizeValue = (value: unknown): string => String(value ?? '').trim()

const isSameOption = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

const extractOptions = (rows: unknown, key: string): SelectOption[] => {
  if (!Array.isArray(rows)) return []
  const seen = new Set<string>()
  const out: SelectOption[] = []
  for (const rawRow of rows) {
    const row = rawRow as Record<string, unknown>
    const value = normalizeValue(row[key])
    if (!value) continue
    const k = value.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push({ label: value, value })
  }
  return out
}

const createLegacyOption = (value: string): SelectOption => ({
  label: `${value} (legacy)`,
  value,
  isLegacy: true,
})

const buildDropdownOptions = (options: SelectOption[], currentValue: string): SelectOption[] => {
  if (!currentValue) return options
  if (options.some((o) => isSameOption(o.value, currentValue))) return options
  return [createLegacyOption(currentValue), ...options]
}

const resolveTriggerLabel = (options: SelectOption[], value: string, placeholder: string): string => {
  if (!value) return placeholder
  return options.find((o) => isSameOption(o.value, value))?.label ?? createLegacyOption(value).label
}

const escapeForRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const extractOptionsFromFieldsState = (
  fields: FormFieldsState | undefined,
  sourceFieldName: string,
  sourceKey: string,
): SelectOption[] => {
  if (!fields) {
    return []
  }

  const seen = new Set<string>()
  const options: SelectOption[] = []
  const sourcePattern = new RegExp(
    `(?:^|\\.)${escapeForRegExp(sourceFieldName)}\\.[^.]+\\.${escapeForRegExp(sourceKey)}$`,
    'i',
  )

  for (const [fieldPath, fieldState] of Object.entries(fields)) {
    if (!sourcePattern.test(fieldPath)) {
      continue
    }

    const optionValue = normalizeValue(fieldState?.value)
    if (!optionValue) {
      continue
    }

    const normalizedKey = optionValue.toLowerCase()
    if (seen.has(normalizedKey)) {
      continue
    }

    seen.add(normalizedKey)
    options.push({ label: optionValue, value: optionValue })
  }

  return options
}

// ─── Hook ────────────────────────────────────────────────────────────────────

const useOptions = (sourceFieldName: string, sourceKey: string): SelectOption[] => {
  const source = useFormFields((ctx) => {
    const [fields] = ctx as [FormFieldsState, unknown]
    return {
      field: fields?.[sourceFieldName],
      fields,
    }
  })

  return useMemo(() => {
    const fromArrayValue = extractOptions(source.field?.value, sourceKey)
    if (fromArrayValue.length > 0) {
      return fromArrayValue
    }

    return extractOptionsFromFieldsState(source.fields, sourceFieldName, sourceKey)
  }, [source.field?.value, source.fields, sourceFieldName, sourceKey])
}

// ─── Chevron SVG ─────────────────────────────────────────────────────────────

const Chevron = ({ open }: { open: boolean }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 20 20"
    fill="none"
    style={S.chevron(open)}
  >
    <path
      d="M5 7.5L10 12.5L15 7.5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </svg>
)

// ─── Dropdown ────────────────────────────────────────────────────────────────

const CustomDropdown = ({ disabled, onChange, options, placeholder, value }: CustomDropdownProps) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const listboxId = useId()

  const displayOptions = useMemo(() => buildDropdownOptions(options, value), [options, value])
  const triggerLabel = useMemo(
    () => resolveTriggerLabel(displayOptions, value, placeholder),
    [displayOptions, placeholder, value],
  )

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div style={S.root} ref={rootRef}>
      {/* Trigger */}
      <button
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        style={S.trigger(!!disabled, open)}
        type="button"
        onMouseEnter={(e) => {
          if (!disabled && !open)
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#525252'
        }}
        onMouseLeave={(e) => {
          if (!open)
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#3a3a3a'
        }}
      >
        <span style={S.triggerLabel(!!value)}>{triggerLabel}</span>
        <Chevron open={open} />
      </button>

      {/* Options list */}
      {open && (
        <div id={listboxId} role="listbox" style={S.dropdown}>
          {/* Clear / placeholder option */}
          <button
            aria-selected={value === ''}
            onClick={() => { onChange(''); setOpen(false) }}
            role="option"
            style={{
              ...S.optionBase,
              ...(value === '' ? S.optionSelected : S.optionPlaceholder),
            }}
            type="button"
            onMouseEnter={(e) => {
              if (value !== '') (e.currentTarget as HTMLButtonElement).style.background = '#1a1a1a'
            }}
            onMouseLeave={(e) => {
              if (value !== '') (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            }}
          >
            {placeholder}
          </button>

          {displayOptions.map((option) => {
            const selected = isSameOption(option.value, value)
            return (
              <button
                aria-selected={selected}
                key={option.value.toLowerCase()}
                onClick={() => { onChange(option.value); setOpen(false) }}
                role="option"
                style={{
                  ...S.optionBase,
                  ...(selected ? S.optionSelected : S.optionDefault),
                }}
                type="button"
                onMouseEnter={(e) => {
                  if (!selected) (e.currentTarget as HTMLButtonElement).style.background = '#1a1a1a'
                }}
                onMouseLeave={(e) => {
                  if (!selected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                }}
              >
                <span>{option.label}</span>
                {option.isLegacy && <span style={S.legacyBadge}>Legacy</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Base field ───────────────────────────────────────────────────────────────

const VariantSelectField = ({
  path,
  readOnly,
  sourceFieldName,
  sourceKey,
  placeholder,
}: VariantFieldProps & VariantSelectConfig) => {
  const { value, setValue } = useField<string>({ path })
  const options = useOptions(sourceFieldName, sourceKey)

  return (
    <CustomDropdown
      disabled={readOnly}
      onChange={setValue}
      options={options}
      placeholder={placeholder}
      value={normalizeValue(value)}
    />
  )
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const VariantColorField = (props: VariantFieldProps) => (
  <VariantSelectField
    {...props}
    placeholder="Pilih warna"
    sourceFieldName="available_colors"
    sourceKey="color_name"
  />
)

export const VariantSizeField = (props: VariantFieldProps) => (
  <VariantSelectField
    {...props}
    placeholder="Pilih ukuran"
    sourceFieldName="available_sizes"
    sourceKey="size"
  />
)
