import type {
  Product,
  ProductColorPayload,
  ProductGalleryPayload,
  ProductSizePayload,
  ProductVariantPayload,
} from '@/lib/api'

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatPrice(value: number) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0)
}

export function formatDate(value?: string) {
  if (!value) {
    return '-'
  }

  return dateFormatter.format(new Date(value))
}

export function formatDateTime(value?: string) {
  if (!value) {
    return '-'
  }

  return dateTimeFormatter.format(new Date(value))
}

export function parseInteger(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return 0
  }

  const parsed = Number.parseInt(trimmed, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

export function parseFloatNumber(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return 0
  }

  const parsed = Number.parseFloat(trimmed)
  return Number.isFinite(parsed) ? parsed : 0
}

export function parseJsonObject(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const parsed = JSON.parse(trimmed) as unknown
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('JSON harus berupa object.')
  }

  return parsed as Record<string, unknown>
}

export function stringifyJson(value: unknown) {
  if (!value) {
    return ''
  }

  return JSON.stringify(value, null, 2)
}

export function productColorsToText(product?: Product) {
  return (product?.available_colors || [])
    .map((item) => `${item.color_name}|${item.hex_code}`)
    .join('\n')
}

export function productSizesToText(product?: Product) {
  return (product?.available_sizes || []).map((item) => item.size).join('\n')
}

export function productGalleryToText(product?: Product) {
  return (product?.gallery || []).map((item) => String(item.image_id)).join('\n')
}

export function productVariantsToText(product?: Product) {
  return (product?.variants || [])
    .map((item) => `${item.color_name}|${item.size}|${item.stock}`)
    .join('\n')
}

export function parseProductColors(value: string): ProductColorPayload[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [colorName, hexCode] = line.split('|').map((item) => item.trim())
      if (!colorName || !hexCode) {
        throw new Error('Format warna harus color_name|hex_code per baris.')
      }

      return {
        _order: index + 1,
        color_name: colorName,
        hex_code: hexCode,
      }
    })
}

export function parseProductSizes(value: string): ProductSizePayload[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => ({
      _order: index + 1,
      size: line,
    }))
}

export function parseProductGallery(value: string): ProductGalleryPayload[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const imageId = parseInteger(line)
      if (!imageId) {
        throw new Error('Gallery harus berisi image id numerik, satu per baris.')
      }

      return {
        _order: index + 1,
        image_id: imageId,
      }
    })
}

export function parseProductVariants(value: string): ProductVariantPayload[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [colorName, size, stockValue] = line.split('|').map((item) => item.trim())
      if (!colorName || !size) {
        throw new Error('Format variant harus color_name|size|stock per baris.')
      }

      return {
        _order: index + 1,
        color_name: colorName,
        size,
        stock: parseInteger(stockValue || '0'),
      }
    })
}
