import type { CollectionConfig } from 'payload'

export const CareGuides: CollectionConfig = {
  slug: 'care-guides',
  admin: {
    useAsTitle: 'title',
  },
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