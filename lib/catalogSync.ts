import crypto from 'node:crypto'

export type CatalogSyncCollection = 'media' | 'categories' | 'seasons' | 'care-guides' | 'products'
export type CatalogSyncOperation = 'delete' | 'upsert'

type RelationValue = null | number | string | { id?: number | string | null } | undefined

type SyncEnvelope = {
  eventId: string
  collection: CatalogSyncCollection
  operation: CatalogSyncOperation
  documentId: number
  occurredAt: string
  document?: Record<string, unknown>
}

type MediaDoc = {
  alt?: string
  id: number | string
  url?: string
}

type CategoryDoc = {
  cover_image?: RelationValue
  id: number | string
  name?: string
  slug?: string
}

type SeasonDoc = {
  cover_image?: RelationValue
  description?: string
  id: number | string
  is_active?: boolean
  lookbook_images?: Array<{ image?: RelationValue }>
  name?: string
  slug?: string
  subtitle?: string
}

type CareGuideDoc = {
  id: number | string
  instructions?: unknown
  title?: string
}

type ProductDoc = {
  available_colors?: Array<{ color_name?: string; hex_code?: string }>
  available_sizes?: Array<{ size?: string }>
  base_price?: number
  care_guide?: RelationValue
  category?: RelationValue
  cover_image?: RelationValue
  description?: string
  detail_info?: unknown
  gallery?: Array<{ image?: RelationValue }>
  gender?: string
  id: number | string
  name?: string
  season?: RelationValue
  slug?: string
  stock?: number
}

const syncURL = process.env.BACKEND_CATALOG_SYNC_URL || ''
const syncSecret = process.env.CATALOG_SYNC_SECRET || ''

const normalizeID = (value: number | string) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid document id: ${String(value)}`)
  }

  return parsed
}

const normalizeRelationID = (value: RelationValue): number | null => {
  if (value == null) {
    return null
  }

  if (typeof value === 'object') {
    if (value.id == null) {
      return null
    }

    return normalizeID(value.id)
  }

  return normalizeID(value)
}

const signPayload = (payload: string) => {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const signature = crypto.createHmac('sha256', syncSecret).update(`${timestamp}.${payload}`).digest('hex')

  return {
    signature: `sha256=${signature}`,
    timestamp,
  }
}

const sendEnvelope = async (envelope: SyncEnvelope) => {
  if (!syncURL || !syncSecret) {
    return
  }

  const payload = JSON.stringify(envelope)
  const { signature, timestamp } = signPayload(payload)

  const response = await fetch(syncURL, {
    body: payload,
    headers: {
      'Content-Type': 'application/json',
      'X-Catalog-Sync-Signature': signature,
      'X-Catalog-Sync-Timestamp': timestamp,
    },
    method: 'POST',
  })

  if (!response.ok) {
    const responseText = await response.text()
    throw new Error(`Catalog sync failed with status ${response.status}: ${responseText}`)
  }
}

export const sendCatalogSyncEnvelope = async (envelope: SyncEnvelope) => {
  await sendEnvelope(envelope)
}

export const buildCatalogSyncEnvelope = (
  collection: CatalogSyncCollection,
  operation: CatalogSyncOperation,
  doc: CategoryDoc | CareGuideDoc | MediaDoc | ProductDoc | SeasonDoc,
) => {
  const documentId = normalizeID(doc.id)
  const baseEnvelope = {
    collection,
    documentId,
    eventId: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    operation,
  } satisfies Omit<SyncEnvelope, 'document'>

  if (operation === 'delete') {
    return {
      ...baseEnvelope,
    } satisfies SyncEnvelope
  }

  switch (collection) {
    case 'media': {
      const mediaDoc = doc as MediaDoc
      return {
        ...baseEnvelope,
        document: {
          alt: mediaDoc.alt || '',
          id: documentId,
          url: mediaDoc.url || '',
        },
      } satisfies SyncEnvelope
    }
    case 'categories': {
      const categoryDoc = doc as CategoryDoc
      return {
        ...baseEnvelope,
        document: {
          coverImageId: normalizeRelationID(categoryDoc.cover_image),
          id: documentId,
          name: categoryDoc.name || '',
          slug: categoryDoc.slug || '',
        },
      } satisfies SyncEnvelope
    }
    case 'seasons': {
      const seasonDoc = doc as SeasonDoc
      return {
        ...baseEnvelope,
        document: {
          coverImageId: normalizeRelationID(seasonDoc.cover_image),
          description: seasonDoc.description || '',
          id: documentId,
          isActive: Boolean(seasonDoc.is_active),
          lookbookImages: (seasonDoc.lookbook_images || []).map((item, index) => ({
            imageId: normalizeRelationID(item.image),
            sortOrder: index,
          })).filter((item): item is { imageId: number; sortOrder: number } => item.imageId != null),
          name: seasonDoc.name || '',
          slug: seasonDoc.slug || '',
          subtitle: seasonDoc.subtitle || '',
        },
      } satisfies SyncEnvelope
    }
    case 'care-guides': {
      const careGuideDoc = doc as CareGuideDoc
      return {
        ...baseEnvelope,
        document: {
          id: documentId,
          instructions: careGuideDoc.instructions ?? null,
          title: careGuideDoc.title || '',
        },
      } satisfies SyncEnvelope
    }
    case 'products': {
      const productDoc = doc as ProductDoc
      return {
        ...baseEnvelope,
        document: {
          availableColors: (productDoc.available_colors || []).map((item, index) => ({
            colorName: item.color_name || '',
            hexCode: item.hex_code || '',
            sortOrder: index,
          })),
          availableSizes: (productDoc.available_sizes || []).map((item, index) => ({
            size: item.size || '',
            sortOrder: index,
          })),
          basePrice: Number(productDoc.base_price || 0),
          careGuideId: normalizeRelationID(productDoc.care_guide),
          categoryId: normalizeRelationID(productDoc.category),
          coverImageId: normalizeRelationID(productDoc.cover_image),
          description: productDoc.description || '',
          detailInfo: productDoc.detail_info ?? null,
          gallery: (productDoc.gallery || []).map((item, index) => ({
            imageId: normalizeRelationID(item.image),
            sortOrder: index,
          })).filter((item): item is { imageId: number; sortOrder: number } => item.imageId != null),
          gender: productDoc.gender || '',
          id: documentId,
          name: productDoc.name || '',
          seasonId: normalizeRelationID(productDoc.season),
          slug: productDoc.slug || '',
          stock: Number(productDoc.stock || 0),
        },
      } satisfies SyncEnvelope
    }
    default:
      throw new Error(`Unsupported collection for catalog sync: ${collection}`)
  }
}

export const syncCatalogDocument = async (
  collection: CatalogSyncCollection,
  operation: CatalogSyncOperation,
  doc: CategoryDoc | CareGuideDoc | MediaDoc | ProductDoc | SeasonDoc,
) => {
  await sendEnvelope(buildCatalogSyncEnvelope(collection, operation, doc))
}