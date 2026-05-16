const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

export interface Media {
  id: number
  alt: string
  url: string
  filename: string
  mime_type?: string
  filesize?: number
  width?: number
  height?: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: number
  name: string
  slug: string
  cover_image_id?: number
  cover_image?: Media
  created_at: string
  updated_at: string
}

export interface Season {
  id: number
  name: string
  slug: string
  subtitle?: string
  description?: string
  cover_image_id?: number
  cover_image?: Media
  is_active: boolean
  lookbook_images?: Media[]
  created_at: string
  updated_at: string
}

export interface CareGuide {
  id: number
  title: string
  instructions?: any
  created_at: string
  updated_at: string
}

export interface ProductColor {
  id: number
  _parent_id: number
  _order: number
  color_name: string
  hex_code: string
}

export interface ProductSize {
  id: number
  _parent_id: number
  _order: number
  size: string
}

export interface ProductGalleryItem {
  id: number
  _parent_id: number
  _order: number
  image_id: number
  image?: Media
}

export interface ProductVariant {
  id: number
  _parent_id: number
  _order: number
  color_name: string
  size: string
  stock: number
}

export interface Product {
  id: number
  name: string
  slug: string
  season_id?: number
  season?: Season
  category_id?: number
  category?: Category
  gender: string
  base_price: number
  weight: number
  length: number
  width: number
  height: number
  stock: number
  description?: string
  cover_image_id?: number
  cover_image?: Media
  detail_info?: any
  care_guide_id?: number
  care_guide?: CareGuide
  available_colors?: ProductColor[]
  available_sizes?: ProductSize[]
  gallery?: ProductGalleryItem[]
  variants?: ProductVariant[]
  created_at: string
  updated_at: string
}

export const api = {
  categories: {
    getAll: () => fetchAPI<Category[]>('/categories'),
    getById: (id: number) => fetchAPI<Category>(`/categories/${id}`),
    getBySlug: (slug: string) => fetchAPI<Category>(`/categories/slug/${slug}`),
    create: (data: Partial<Category>) => fetchAPI<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Category>) => fetchAPI<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchAPI<void>(`/categories/${id}`, { method: 'DELETE' }),
  },

  seasons: {
    getAll: () => fetchAPI<Season[]>('/seasons'),
    getById: (id: number) => fetchAPI<Season>(`/seasons/${id}`),
    getBySlug: (slug: string) => fetchAPI<Season>(`/seasons/slug/${slug}`),
    create: (data: Partial<Season>) => fetchAPI<Season>('/seasons', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Season>) => fetchAPI<Season>(`/seasons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchAPI<void>(`/seasons/${id}`, { method: 'DELETE' }),
  },

  careGuides: {
    getAll: () => fetchAPI<CareGuide[]>('/care-guides'),
    getById: (id: number) => fetchAPI<CareGuide>(`/care-guides/${id}`),
    create: (data: Partial<CareGuide>) => fetchAPI<CareGuide>('/care-guides', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<CareGuide>) => fetchAPI<CareGuide>(`/care-guides/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchAPI<void>(`/care-guides/${id}`, { method: 'DELETE' }),
  },

  products: {
    getAll: (categorySlug?: string) => {
      const query = categorySlug ? `?category=${encodeURIComponent(categorySlug)}` : ''
      return fetchAPI<Product[]>(`/products${query}`)
    },
    getById: (id: number) => fetchAPI<Product>(`/products/${id}`),
    getBySlug: (slug: string) => fetchAPI<Product>(`/products/slug/${slug}`),
    create: (data: Partial<Product>) => fetchAPI<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Product>) => fetchAPI<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchAPI<void>(`/products/${id}`, { method: 'DELETE' }),
  },

  media: {
    getAll: () => fetchAPI<Media[]>('/media'),
    getById: (id: number) => fetchAPI<Media>(`/media/${id}`),
    create: (data: Partial<Media>) => fetchAPI<Media>('/media', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Media>) => fetchAPI<Media>(`/media/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchAPI<void>(`/media/${id}`, { method: 'DELETE' }),
  },
}
