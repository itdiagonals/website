import type { CollectionConfig } from 'payload'

import { createCatalogSyncHooks } from './catalogSync.ts'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt',
  },
  hooks: createCatalogSyncHooks('media'),
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  },
}
