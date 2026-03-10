import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { syncCatalogDocument, type CatalogSyncCollection } from '../lib/catalogSync.ts'

export const createCatalogSyncHooks = (collection: CatalogSyncCollection) => {
  const afterChange: CollectionAfterChangeHook = async ({ doc }) => {
    await syncCatalogDocument(collection, 'upsert', doc as never)
    return doc
  }

  const afterDelete: CollectionAfterDeleteHook = async ({ doc }) => {
    await syncCatalogDocument(collection, 'delete', doc as never)
    return doc
  }

  return {
    afterChange: [afterChange],
    afterDelete: [afterDelete],
  }
}