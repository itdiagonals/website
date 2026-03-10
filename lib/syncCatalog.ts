import { getPayload } from 'payload'

import { buildCatalogSyncEnvelope, sendCatalogSyncEnvelope, type CatalogSyncCollection } from './catalogSync'
import config from '../payload.config.ts'

const collectionsInOrder: CatalogSyncCollection[] = ['media', 'categories', 'seasons', 'care-guides', 'products']

const findAllDocuments = async (collection: CatalogSyncCollection) => {
  const payload = await getPayload({ config: await config })
  const documents: unknown[] = []

  let page = 1
  let hasNextPage = true

  while (hasNextPage) {
    const result = await payload.find({
      collection: collection as never,
      depth: 0,
      limit: 100,
      overrideAccess: true,
      page,
    })

    documents.push(...result.docs)
    hasNextPage = result.hasNextPage
    page += 1
  }

  return documents
}

export const syncCatalog = async () => {
  if (!process.env.BACKEND_CATALOG_SYNC_URL) {
    throw new Error('BACKEND_CATALOG_SYNC_URL is not set')
  }

  if (!process.env.CATALOG_SYNC_SECRET) {
    throw new Error('CATALOG_SYNC_SECRET is not set')
  }

  const summary: Record<CatalogSyncCollection, number> = {
    'care-guides': 0,
    categories: 0,
    media: 0,
    products: 0,
    seasons: 0,
  }

  for (const collection of collectionsInOrder) {
    const documents = await findAllDocuments(collection)

    for (const document of documents) {
      await sendCatalogSyncEnvelope(buildCatalogSyncEnvelope(collection, 'upsert', document as never))

      summary[collection] += 1
    }
  }

  return summary
}