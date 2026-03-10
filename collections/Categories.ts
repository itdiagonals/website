import type { CollectionConfig } from 'payload'

import { createCatalogSyncHooks } from './catalogSync.ts'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
  },
  hooks: createCatalogSyncHooks('categories'),
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
      name: 'cover_image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
  ],
}