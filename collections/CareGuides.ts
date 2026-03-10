import type { CollectionConfig } from 'payload'

import { createCatalogSyncHooks } from './catalogSync.ts'

export const CareGuides: CollectionConfig = {
  slug: 'care-guides',
  admin: {
    useAsTitle: 'title',
  },
  hooks: createCatalogSyncHooks('care-guides'),
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'instructions',
      type: 'richText',
      required: true,
    },
  ],
}