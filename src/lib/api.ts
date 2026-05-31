const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

type JsonRecord = Record<string, unknown>

interface ApiResponse<T> {
  success?: boolean
  code?: string
  message?: string
  data: T
}

interface ApiListResponse<T> {
  success?: boolean
  code?: string
  message?: string
  data: T[]
  meta?: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export interface AuthStatusResponse {
  status: string
  message?: string
  csrf_token?: string
}

export interface AuthSessionSummary {
  id: string
  device_name?: string
  user_agent?: string
  ip_address?: string
  last_seen_at: string
  expires_at: string
  created_at: string
  current: boolean
}

export interface User {
  id: string
  email: string
  name: string
  role: string
  phone?: string
  address?: string
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface UserPayload {
  email: string
  name: string
  role?: string
  phone?: string
  address?: string
}

export interface CreateUserPayload extends UserPayload {
  password: string
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface RequestConfig {
  unwrapData?: boolean
  retryOnUnauthorized?: boolean
  csrfRetries?: number
  unauthorizedRetries?: number
}

interface APIRequestInit extends Omit<RequestInit, 'body'> {
  body?: BodyInit | object | null
}

interface AuthSessionsResponse {
  data: AuthSessionSummary[]
}

let csrfTokenCache: string | null = null
let csrfPromise: Promise<string> | null = null
let refreshPromise: Promise<void> | null = null
let silentRefreshTimer: ReturnType<typeof setInterval> | null = null

const requestCache = new Map<string, { data: unknown; expiry: number }>()
const CACHE_TTL_MS = 30_000

function cacheKey(endpoint: string, init?: APIRequestInit) {
  const method = init?.method || 'GET'
  const bodyKey = init?.body && typeof init.body === 'string' ? init.body : ''
  return `${method}:${endpoint}:${bodyKey}`
}

function getCached<T>(key: string): T | undefined {
  const entry = requestCache.get(key)
  if (entry && entry.expiry > Date.now()) {
    return entry.data as T
  }
  requestCache.delete(key)
  return undefined
}

function setCache<T>(key: string, data: T) {
  requestCache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS })
}

export function clearApiCache() {
  requestCache.clear()
}

const SILENT_REFRESH_INTERVAL_MS = 10 * 60 * 1000

function startSilentRefresh() {
  if (typeof window === 'undefined') {
    return
  }

  stopSilentRefresh()
  silentRefreshTimer = setInterval(() => {
    void api.auth.refresh().catch(() => undefined)
  }, SILENT_REFRESH_INTERVAL_MS)
}

function stopSilentRefresh() {
  if (silentRefreshTimer) {
    clearInterval(silentRefreshTimer)
    silentRefreshTimer = null
  }
}

function isObject(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== 'undefined' && value instanceof FormData
}

function isResponseEnvelope(value: unknown): value is ApiResponse<unknown> | ApiListResponse<unknown> {
  return isObject(value) && 'data' in value
}

function getStoredCsrfToken() {
  if (csrfTokenCache) {
    return csrfTokenCache
  }

  if (typeof window === 'undefined') {
    return null
  }

  const stored = window.sessionStorage.getItem('csrf_token')
  if (stored) {
    csrfTokenCache = stored
  }

  return csrfTokenCache
}

function setStoredCsrfToken(token: string | null) {
  csrfTokenCache = token && token.trim() ? token.trim() : null

  if (typeof window === 'undefined') {
    return
  }

  if (csrfTokenCache) {
    window.sessionStorage.setItem('csrf_token', csrfTokenCache)
    return
  }

  window.sessionStorage.removeItem('csrf_token')
}

function storeCsrfTokenFromPayload(payload: unknown) {
  if (!isObject(payload)) {
    return
  }

  const tokenValue = payload.csrf_token
  if (typeof tokenValue === 'string' && tokenValue.trim()) {
    setStoredCsrfToken(tokenValue)
  }
}

function storeCsrfTokenFromHeaders(response: Response) {
  const headerToken = response.headers.get('X-CSRF-Token')?.trim()
  if (headerToken) {
    setStoredCsrfToken(headerToken)
  }
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (!isObject(payload)) {
    return fallback
  }

  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message
  }

  if (typeof payload.error === 'string' && payload.error.trim()) {
    return payload.error
  }

  return fallback
}

function isInvalidCsrf(payload: unknown) {
  return getErrorMessage(payload, '').toLowerCase().includes('csrf')
}

async function parsePayload(response: Response) {
  if (response.status === 204) {
    return undefined
  }

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return undefined
  }

  return response.json().catch(() => undefined)
}

async function ensureCsrfToken(force = false): Promise<string> {
  const cached = getStoredCsrfToken()
  if (!force && cached) {
    return cached
  }

  if (!force && csrfPromise) {
    return csrfPromise
  }

  csrfPromise = (async () => {
    const response = await fetch(`${API_BASE_URL}/auth/csrf`, {
      credentials: 'include',
      cache: 'no-store',
    })

    const payload = await parsePayload(response)
    storeCsrfTokenFromHeaders(response)
    storeCsrfTokenFromPayload(payload)

    if (!response.ok) {
      throw new ApiError(getErrorMessage(payload, 'Failed to get CSRF token'), response.status)
    }

    const token = getStoredCsrfToken()
    if (!token) {
      throw new ApiError('Failed to get CSRF token', 500)
    }

    return token
  })()

  try {
    return await csrfPromise
  } finally {
    csrfPromise = null
  }
}

async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    const csrfToken = await ensureCsrfToken()
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'X-CSRF-Token': csrfToken,
      },
    })

    const payload = await parsePayload(response)
    storeCsrfTokenFromHeaders(response)
    storeCsrfTokenFromPayload(payload)

    if (response.ok) {
      return
    }

    if (isInvalidCsrf(payload)) {
      const nextToken = await ensureCsrfToken(true)
      const retryResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'X-CSRF-Token': nextToken,
        },
      })

      const retryPayload = await parsePayload(retryResponse)
      storeCsrfTokenFromHeaders(retryResponse)
      storeCsrfTokenFromPayload(retryPayload)

      if (retryResponse.ok) {
        return
      }

      throw new ApiError(getErrorMessage(retryPayload, 'Session refresh failed'), retryResponse.status)
    }

    if (response.status === 401) {
      setStoredCsrfToken(null)
    }

    throw new ApiError(getErrorMessage(payload, 'Session refresh failed'), response.status)
  })()

  try {
    await refreshPromise
  } finally {
    refreshPromise = null
  }
}

async function request<T>(endpoint: string, init: APIRequestInit = {}, config: RequestConfig = {}): Promise<T> {
  const {
    unwrapData = true,
    retryOnUnauthorized = false,
    csrfRetries = 1,
    unauthorizedRetries = retryOnUnauthorized ? 1 : 0,
  } = config

  const method = (init.method || 'GET').toUpperCase()

  if (method === 'GET' || method === 'HEAD') {
    const key = cacheKey(endpoint, init)
    const cached = getCached<T>(key)
    if (cached !== undefined) {
      return cached
    }
  }

  const headers = new Headers(init.headers)
  let body = init.body

  if (body && !isFormData(body) && typeof body !== 'string') {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(body)
  }

  if (method !== 'GET' && method !== 'HEAD' && !headers.has('Authorization')) {
    headers.set('X-CSRF-Token', await ensureCsrfToken())
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...init,
    method,
    body,
    headers,
    credentials: 'include',
    cache: 'no-store',
  })

  const payload = await parsePayload(response)
  storeCsrfTokenFromHeaders(response)
  storeCsrfTokenFromPayload(payload)

  if (!response.ok) {
    if (response.status === 401 && unauthorizedRetries > 0) {
      await refreshAccessToken()
      return request<T>(endpoint, init, {
        unwrapData,
        retryOnUnauthorized,
        csrfRetries,
        unauthorizedRetries: unauthorizedRetries - 1,
      })
    }

    if (response.status === 403 && csrfRetries > 0 && isInvalidCsrf(payload)) {
      await ensureCsrfToken(true)
      return request<T>(endpoint, init, {
        unwrapData,
        retryOnUnauthorized,
        csrfRetries: csrfRetries - 1,
        unauthorizedRetries,
      })
    }

    throw new ApiError(getErrorMessage(payload, `HTTP ${response.status}`), response.status)
  }

  if ((method === 'GET' || method === 'HEAD') && response.ok) {
    setCache(cacheKey(endpoint, init), unwrapData && isResponseEnvelope(payload) ? payload.data : payload)
  }

  if (response.status === 204) {
    return undefined as T
  }

  if (!unwrapData || !isResponseEnvelope(payload)) {
    return payload as T
  }

  return payload.data as T
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
  cover_image_id: number
  cover_image?: Media
  created_at: string
  updated_at: string
}

export interface CategoryPayload {
  name: string
  slug: string
  cover_image_id: number
  draft_id?: string
}

export interface Season {
  id: number
  name: string
  slug: string
  subtitle?: string
  description?: string
  cover_image_id: number
  cover_image?: Media
  is_active: boolean
  lookbook_images?: Media[]
  created_at: string
  updated_at: string
}

export interface SeasonPayload {
  name: string
  slug: string
  subtitle?: string
  description?: string
  cover_image_id: number
  lookbook_image_ids?: number[]
  is_active?: boolean
  draft_id?: string
}

export interface CareGuide {
  id: number
  title: string
  instructions?: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface CareGuidePayload {
  title: string
  instructions?: Record<string, unknown> | null
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
  season_id: number
  season?: Season
  category_id: number
  category?: Category
  gender: string
  base_price: number
  weight: number
  length: number
  width: number
  height: number
  stock: number
  description?: string
  cover_image_id: number
  cover_image?: Media
  detail_info?: Record<string, unknown> | null
  care_guide_id: number
  care_guide?: CareGuide
  available_colors?: ProductColor[]
  available_sizes?: ProductSize[]
  gallery?: ProductGalleryItem[]
  variants?: ProductVariant[]
  created_at: string
  updated_at: string
}

export interface ProductColorPayload {
  _order: number
  color_name: string
  hex_code: string
}

export interface ProductSizePayload {
  _order: number
  size: string
}

export interface ProductGalleryPayload {
  _order: number
  image_id: number
}

export interface ProductVariantPayload {
  _order: number
  color_name: string
  size: string
  stock: number
}

export interface ProductPayload {
  name: string
  slug: string
  season_id: number
  category_id: number
  gender: string
  base_price: number
  weight: number
  length: number
  width: number
  height: number
  stock: number
  description?: string
  cover_image_id: number
  detail_info?: Record<string, unknown> | null
  care_guide_id: number
  available_colors?: ProductColorPayload[]
  available_sizes?: ProductSizePayload[]
  gallery?: ProductGalleryPayload[]
  variants?: ProductVariantPayload[]
  draft_id?: string
}

export interface CartItem {
  id: number
  product_id: number
  product_name: string
  gender: string
  image_url: string
  base_price: number
  available_stock: number
  stock_sufficient: boolean
  stock_message?: string
  quantity: number
  subtotal: number
  selected_size: string
  selected_color_name: string
  selected_color_hex?: string
}

export interface Cart {
  user_id: string
  items: CartItem[]
}

export interface AddToCartPayload {
  product_id: number
  quantity: number
  selected_size: string
  selected_color_name: string
  selected_color_hex?: string
}

export interface UpdateCartQuantityPayload {
  cart_item_id: number
  quantity: number
}

export interface RemoveFromCartPayload {
  cart_item_id: number
}

export interface TransactionHistoryListItem {
  id: number
  order_id: string
  customer_id: string
  total_amount: number
  shipping_cost: number
  status: string
  shipping_status: string
  courier_name: string
  courier_service: string
  tracking_number?: string
  created_at: string
}

export interface TransactionHistoryPagination {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface TransactionHistoryListResponse {
  data: TransactionHistoryListItem[]
  pagination: TransactionHistoryPagination
}

export interface ShippingRate {
  courier_name: string
  courier_code: string
  service_name: string
  service_code: string
  price: number
  estimated_days?: string
  estimated_range?: string
  available_collection_types?: string[]
  shipping_fee?: number
  insurance_fee?: number
  cash_on_delivery_fee?: number
}

export interface TransactionHistoryDetailItem {
  id: number
  product_id: number
  selected_size: string
  selected_color_name: string
  selected_color_hex?: string
  quantity: number
  price: number
  subtotal: number
}

export interface TransactionHistoryAddressSummary {
  id: number
  title: string
  recipient_name: string
  phone_number: string
  province: string
  city: string
  district: string
  village: string
  postal_code: string
  full_address: string
  latitude?: number
  longitude?: number
  destination_area_id?: string
  destination_area_label?: string
  is_primary: boolean
}

export interface TransactionHistorySenderInfo {
  name: string
  phone: string
  email: string
  address: string
  postal_code: string
}

export interface TransactionHistoryDetail {
  id: number
  order_id: string
  customer_id: string
  shipping_address_id: number
  total_amount: number
  shipping_cost: number
  status: string
  shipping_status: string
  courier_name: string
  courier_service: string
  tracking_number?: string
  snap_token: string
  notes?: string
  created_at: string
  updated_at: string
  shipping_address: TransactionHistoryAddressSummary
  sender?: TransactionHistorySenderInfo
  items: TransactionHistoryDetailItem[]
}

export interface ShippingTrackingEvent {
  status?: string
  note?: string
  description?: string
  updated_at?: string
  [key: string]: unknown
}

export interface TransactionTrackingData {
  order_id: string
  biteship_order_id?: string
  tracking_number?: string
  shipping_status: string
  raw_status?: string
  tracking_link?: string
  courier_name: string
  courier_service: string
  events?: ShippingTrackingEvent[]
}

export interface CustomerAddress {
  id: number
  user_id: string
  title: string
  recipient_name: string
  phone_number: string
  province: string
  city: string
  district: string
  village: string
  postal_code: string
  full_address: string
  latitude?: number
  longitude?: number
  place_id?: string
  map_provider?: string
  location_source?: string
  destination_area_id?: string
  destination_area_label?: string
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface AddAddressPayload {
  title: string
  recipient_name: string
  phone_number: string
  province: string
  city: string
  district: string
  village: string
  postal_code: string
  full_address: string
  latitude?: number | null
  longitude?: number | null
  place_id?: string
  map_provider?: string
  location_source?: string
  destination_area_id?: string
  destination_area_label?: string
  is_primary?: boolean
}

export type UpdateAddressPayload = AddAddressPayload

export interface PresignedURLResponse {
  signed_url: string
  object_key: string
  public_url: string
}

export interface ConfirmUploadPayload {
  object_key: string
  alt: string
  draft_id?: string
  width?: number
  height?: number
  filesize?: number
  mime_type?: string
}

export const api = {
  auth: {
    getCsrf: () => ensureCsrfToken(true),
    register: async (data: { name: string; email: string; password: string }) => {
      const response = await request<AuthStatusResponse>('/auth/register', { method: 'POST', body: data }, { unwrapData: false })
      return response
    },
    verifyRegistration: async (data: { email: string; code: string }) => {
      const response = await request<AuthStatusResponse>('/auth/verify-registration', { method: 'POST', body: data }, { unwrapData: false })
      startSilentRefresh()
      return response
    },
    login: async (data: { email: string; password: string }) => {
      const response = await request<AuthStatusResponse>('/auth/login', { method: 'POST', body: data }, { unwrapData: false })
      startSilentRefresh()
      return response
    },
    refresh: async () => {
      const response = await request<AuthStatusResponse>('/auth/refresh', { method: 'POST' }, { unwrapData: false })
      startSilentRefresh()
      return response
    },
    ensureFreshToken: async () => {
      try {
        await api.auth.refresh()
      } catch {
        return
      }
    },
    resetPassword: (data: { email: string; code: string; new_password: string }) =>
      request<AuthStatusResponse>('/auth/reset-password', { method: 'POST', body: data }, { unwrapData: false }),
    listSessions: () => request<AuthSessionsResponse>('/auth/sessions', undefined, { retryOnUnauthorized: true, unwrapData: false }).then((response) => response.data),
    logout: async () => {
      stopSilentRefresh()
      return request<AuthStatusResponse>('/auth/logout', { method: 'POST' }, { retryOnUnauthorized: true, unwrapData: false })
    },
    logoutAll: async () => {
      stopSilentRefresh()
      return request<AuthStatusResponse>('/auth/logout-all', { method: 'POST' }, { retryOnUnauthorized: true, unwrapData: false })
    },
  },

  otp: {
    request: (data: { email: string; purpose: 'account_verification' | 'password_reset' }) =>
      request<{ message: string }>('/otp/request', { method: 'POST', body: data }, { unwrapData: false }),
  },

  users: {
    me: () => request<User>('/users/me', undefined, { retryOnUnauthorized: true }),
    updateMe: (data: { name: string; phone?: string }) => request<User>('/users/me', { method: 'PUT', body: data }, { retryOnUnauthorized: true }),
    getAll: (page = 1, limit = 50) => request<User[]>(`/users?page=${page}&limit=${limit}`, undefined, { retryOnUnauthorized: true }),
    create: (data: CreateUserPayload) => request<User>('/users', { method: 'POST', body: data }, { retryOnUnauthorized: true }),
    update: (id: string, data: UserPayload) => request<User>(`/users/${id}`, { method: 'PUT', body: data }, { retryOnUnauthorized: true }),
    delete: (id: string) => request<void>(`/users/${id}`, { method: 'DELETE' }, { retryOnUnauthorized: true }),
    invite: (data: { email: string }) => request<{ message: string; token?: string }>('/users/invite', { method: 'POST', body: data }, { retryOnUnauthorized: true }),
    inviteRedeem: (data: { token: string }) => request<{ message: string }>('/users/invite-redeem', { method: 'POST', body: data }),
  },

  categories: {
    getAll: (page = 1, limit = 50) => request<Category[]>(`/categories?page=${page}&limit=${limit}`),
    getById: (id: number) => request<Category>(`/categories/${id}`),
    getBySlug: (slug: string) => request<Category>(`/categories/slug/${slug}`),
    create: (data: CategoryPayload) => request<Category>('/categories', { method: 'POST', body: data }, { retryOnUnauthorized: true }),
    update: (id: number, data: CategoryPayload) =>
      request<Category>(`/categories/${id}`, { method: 'PUT', body: data }, { retryOnUnauthorized: true }),
    delete: (id: number) => request<void>(`/categories/${id}`, { method: 'DELETE' }, { retryOnUnauthorized: true }),
  },

  seasons: {
    getAll: (page = 1, limit = 50) => request<Season[]>(`/seasons?page=${page}&limit=${limit}`),
    getById: (id: number) => request<Season>(`/seasons/${id}`),
    getBySlug: (slug: string) => request<Season>(`/seasons/slug/${slug}`),
    create: (data: SeasonPayload) => request<Season>('/seasons', { method: 'POST', body: data }, { retryOnUnauthorized: true }),
    update: (id: number, data: SeasonPayload) =>
      request<Season>(`/seasons/${id}`, { method: 'PUT', body: data }, { retryOnUnauthorized: true }),
    delete: (id: number) => request<void>(`/seasons/${id}`, { method: 'DELETE' }, { retryOnUnauthorized: true }),
  },

  careGuides: {
    getAll: (page = 1, limit = 50) => request<CareGuide[]>(`/care-guides?page=${page}&limit=${limit}`),
    getById: (id: number) => request<CareGuide>(`/care-guides/${id}`),
    create: (data: CareGuidePayload) =>
      request<CareGuide>('/care-guides', { method: 'POST', body: data }, { retryOnUnauthorized: true }),
    update: (id: number, data: CareGuidePayload) =>
      request<CareGuide>(`/care-guides/${id}`, { method: 'PUT', body: data }, { retryOnUnauthorized: true }),
    delete: (id: number) => request<void>(`/care-guides/${id}`, { method: 'DELETE' }, { retryOnUnauthorized: true }),
  },

  products: {
    getAll: (categorySlug?: string, page = 1, limit = 50) => {
      const params = new URLSearchParams()
      if (categorySlug) params.set('category', categorySlug)
      params.set('page', String(page))
      params.set('limit', String(limit))
      return request<Product[]>(`/products?${params.toString()}`)
    },
    getById: (id: number) => request<Product>(`/products/${id}`),
    getBySlug: (slug: string) => request<Product>(`/products/slug/${slug}`),
    getSimilar: (id: number, limit = 4) => request<Product[]>(`/products/${id}/similar?limit=${limit}`),
    create: (data: ProductPayload) => request<Product>('/products', { method: 'POST', body: data }, { retryOnUnauthorized: true }),
    update: (id: number, data: ProductPayload) =>
      request<Product>(`/products/${id}`, { method: 'PUT', body: data }, { retryOnUnauthorized: true }),
    delete: (id: number) => request<void>(`/products/${id}`, { method: 'DELETE' }, { retryOnUnauthorized: true }),
  },

  media: {
    getAll: (page = 1, limit = 50) => request<Media[]>(`/media?page=${page}&limit=${limit}`),
    getById: (id: number) => request<Media>(`/media/${id}`),
    getByDraft: (draftId: string) => request<Media[]>(`/media?draft_id=${encodeURIComponent(draftId)}`),
    create: (data: Pick<Media, 'alt' | 'url' | 'filename'> & Partial<Pick<Media, 'mime_type' | 'filesize' | 'width' | 'height'>>) =>
      request<Media>('/media', { method: 'POST', body: data }, { retryOnUnauthorized: true }),
    getPresignedUrl: (filename: string, contentType: string) =>
      request<PresignedURLResponse>('/media/presigned-url', { method: 'POST', body: { filename, content_type: contentType } }, { retryOnUnauthorized: true }),
    uploadToSignedUrl: async (signedUrl: string, file: File) => {
      const response = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })
      if (!response.ok) {
        throw new ApiError(`Direct upload failed: ${response.status}`, response.status)
      }
    },
    confirmUpload: (data: ConfirmUploadPayload) =>
      request<Media>('/media/confirm', { method: 'POST', body: data }, { retryOnUnauthorized: true }),
    upload: (file: File, alt: string, draftId?: string) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('alt', alt)
      if (draftId) {
        formData.append('draft_id', draftId)
      }

      return request<Media>('/media/upload', { method: 'POST', body: formData }, { retryOnUnauthorized: true })
    },
    update: (
      id: number,
      data: Pick<Media, 'alt' | 'url' | 'filename'> & Partial<Pick<Media, 'mime_type' | 'filesize' | 'width' | 'height'>>,
    ) => request<Media>(`/media/${id}`, { method: 'PUT', body: data }, { retryOnUnauthorized: true }),
    delete: (id: number) => request<void>(`/media/${id}`, { method: 'DELETE' }, { retryOnUnauthorized: true }),
  },

  cart: {
    get: () => request<Cart>('/cart', undefined, { retryOnUnauthorized: true }),
    add: (data: AddToCartPayload) => request<Cart>('/cart/add', { method: 'POST', body: data }, { retryOnUnauthorized: true }),
    updateQuantity: (data: UpdateCartQuantityPayload) => request<Cart>('/cart/quantity', { method: 'PATCH', body: data }, { retryOnUnauthorized: true }),
    remove: (data: RemoveFromCartPayload) => request<Cart>('/cart/remove', { method: 'DELETE', body: data }, { retryOnUnauthorized: true }),
  },

  checkout: {
    rates: (data: { address_id: number; couriers?: string; selected_cart_item_ids: number[] }) =>
      request<{ address_id: number; subtotal: number; total_weight: number; rates: ShippingRate[] }>('/checkout/rates', { method: 'POST', body: data }, { retryOnUnauthorized: true }),
    create: (data: { address_id: number; courier_name: string; courier_service: string; selected_cart_item_ids: number[]; notes?: string }) =>
      request<TransactionHistoryDetail>('/checkout', { method: 'POST', body: data }, { retryOnUnauthorized: true }),
  },

  transactions: {
    getAll: (page = 1, limit = 50) => request<TransactionHistoryListResponse>(`/transactions?page=${page}&limit=${limit}`, undefined, { retryOnUnauthorized: true, unwrapData: false }).then((response) => response.data),
    getByOrderId: (orderId: string) => request<TransactionHistoryDetail>(`/transactions/${orderId}`, undefined, { retryOnUnauthorized: true }),
    getTracking: (orderId: string, refresh = false) => request<TransactionTrackingData>(`/transactions/${orderId}/tracking${refresh ? '?refresh=true' : ''}`, undefined, { retryOnUnauthorized: true }),
  },

  addresses: {
    getAll: () => request<CustomerAddress[]>('/addresses', undefined, { retryOnUnauthorized: true }),
    create: (data: AddAddressPayload) => request<CustomerAddress>('/addresses', { method: 'POST', body: data }, { retryOnUnauthorized: true }),
    update: (id: number, data: UpdateAddressPayload) => request<CustomerAddress>(`/addresses/${id}`, { method: 'PUT', body: data }, { retryOnUnauthorized: true }),
  },

  admin: {
    packShipment: (data: { order_id: string }) =>
      request<{ message: string }>('/admin/shipments/pack', { method: 'POST', body: data }, { retryOnUnauthorized: true }),
    bookShipment: (data: { order_id: string }) =>
      request<{ message: string }>('/admin/shipments/book', { method: 'POST', body: data }, { retryOnUnauthorized: true }),
    transactions: (page = 1, limit = 50, status?: string) => {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (status) params.set('status', status)
      return request<TransactionHistoryListResponse>(`/admin/transactions?${params.toString()}`, undefined, { retryOnUnauthorized: true, unwrapData: false })
    },
    getByOrderId: (orderId: string) => request<TransactionHistoryDetail>(`/admin/transactions/${orderId}`, undefined, { retryOnUnauthorized: true }),
  },
}
