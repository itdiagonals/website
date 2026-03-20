import type { CollectionConfig } from 'payload'

type SelectOption = {
  label: string
  value: string
}

const normalizeLabel = (value: unknown): string => String(value ?? '').trim()

const buildColorOptions = (data: unknown): SelectOption[] => {
  const rawData = (data ?? {}) as Record<string, unknown>
  const colors = Array.isArray(rawData['available_colors'])
    ? (rawData['available_colors'] as Array<Record<string, unknown>>)
    : []

  return colors
    .map((item) => normalizeLabel(item['color_name']))
    .filter((item) => item.length > 0)
    .map((item) => ({ label: item, value: item }))
}

const buildSizeOptions = (data: unknown): SelectOption[] => {
  const rawData = (data ?? {}) as Record<string, unknown>
  const sizes = Array.isArray(rawData['available_sizes'])
    ? (rawData['available_sizes'] as Array<Record<string, unknown>>)
    : []

  return sizes
    .map((item) => normalizeLabel(item['size']))
    .filter((item) => item.length > 0)
    .map((item) => ({ label: item, value: item }))
}

const sumVariantStock = (variants: unknown): number => {
  if (!Array.isArray(variants)) {
    return 0
  }

  return variants.reduce((total, rawRow) => {
    const row = rawRow as Record<string, unknown>
    const value = Number(row['stock'])
    if (!Number.isFinite(value) || value <= 0) {
      return total
    }

    return total + Math.floor(value)
  }, 0)
}

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data || typeof data !== 'object') {
          return data
        }

        const mutableData = data as Record<string, unknown>
        mutableData['stock'] = sumVariantStock(mutableData['variants'])
        return mutableData
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'season',
      type: 'relationship',
      relationTo: 'seasons',
      required: true,
      hasMany: false,
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      hasMany: false,
    },
    {
      name: 'gender',
      type: 'select',
      required: true,
      defaultValue: 'unisex',
      options: [
        {
          label: 'Pria',
          value: 'pria',
        },
        {
          label: 'Wanita',
          value: 'wanita',
        },
        {
          label: 'Unisex',
          value: 'unisex',
        },
      ],
    },
    {
      name: 'base_price',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'weight',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Berat produk dalam gram (untuk shipping)',
      },
    },
    {
      name: 'length',
      type: 'number',
      required: true,
      min: 1,
      admin: {
        description: 'Panjang produk dalam sentimeter (untuk shipping)',
      },
    },
    {
      name: 'width',
      type: 'number',
      required: true,
      min: 1,
      admin: {
        description: 'Lebar produk dalam sentimeter (untuk shipping)',
      },
    },
    {
      name: 'height',
      type: 'number',
      required: true,
      min: 1,
      admin: {
        description: 'Tinggi produk dalam sentimeter (untuk shipping)',
      },
    },
    {
      name: 'stock',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        readOnly: true,
        description: 'Total stock otomatis dari penjumlahan seluruh varian.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'cover_image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'gallery',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'available_colors',
      type: 'array',
      fields: [
        {
          name: 'color_name',
          type: 'text',
          required: true,
        },
        {
          name: 'hex_code',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'available_sizes',
      type: 'array',
      fields: [
        {
          name: 'size',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'variants',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'color_name',
          type: 'text',
          required: true,
          admin: {
            components: {
              Field: '/components/payload/VariantSelectFields#VariantColorField',
            },
            description: 'Pilih warna dari Available Colors.',
          },
        },
        {
          name: 'size',
          type: 'text',
          required: true,
          admin: {
            components: {
              Field: '/components/payload/VariantSelectFields#VariantSizeField',
            },
            description: 'Pilih ukuran dari Available Sizes.',
          },
        },
        {
          name: 'stock',
          type: 'number',
          required: true,
          min: 0,
        },
      ],
      validate: (value, { data }: { data?: unknown }) => {
        if (!Array.isArray(value) || value.length === 0) {
          return 'Minimal harus ada satu varian stok.'
        }

        const colorOptions = new Set(buildColorOptions(data).map((item) => item.value.toLowerCase()))
        const sizeOptions = new Set(buildSizeOptions(data).map((item) => item.value.toLowerCase()))

        const seen = new Set<string>()
        for (const rawRow of value as Array<Record<string, unknown>>) {
          const colorNameValue = rawRow['color_name']
          const sizeValue = rawRow['size']
          const color = String(colorNameValue ?? '').trim().toLowerCase()
          const size = String(sizeValue ?? '').trim().toLowerCase()
          if (!color || !size) {
            return 'Setiap varian wajib memiliki color_name dan size.'
          }

          if (colorOptions.size > 0 && !colorOptions.has(color)) {
            return `Warna varian tidak valid: ${String(colorNameValue ?? '')}. Harus sesuai Available Colors.`
          }

          if (sizeOptions.size > 0 && !sizeOptions.has(size)) {
            return `Size varian tidak valid: ${String(sizeValue ?? '')}. Harus sesuai Available Sizes.`
          }

          const key = `${color}::${size}`
          if (seen.has(key)) {
            return `Kombinasi varian duplikat ditemukan: ${String(colorNameValue ?? '')} - ${String(sizeValue ?? '')}`
          }

          seen.add(key)
        }

        return true
      },
      admin: {
        description: 'Stok utama per kombinasi warna dan ukuran. Pastikan warna/ukuran mengikuti daftar available di atas.',
      },
    },
    {
      name: 'detail_info',
      type: 'richText',
    },
    {
      name: 'care_guide',
      type: 'relationship',
      relationTo: 'care-guides',
      hasMany: false,
    },
  ],
}