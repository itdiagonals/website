import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
  },
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
      name: 'season',
      type: 'relationship',
      relationTo: 'seasons',
      required: true,
      hasMany: false,
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      hasMany: false,
    },
    {
      name: 'gender',
      type: 'select',
      required: true,
      defaultValue: 'unisex',
      options: [
        {
          label: 'Pria',
          value: 'pria',
        },
        {
          label: 'Wanita',
          value: 'wanita',
        },
        {
          label: 'Unisex',
          value: 'unisex',
        },
      ],
    },
    {
      name: 'base_price',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'weight',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Berat produk dalam gram',
      },
    },
    {
      name: 'length',
      type: 'number',
      required: true,
      min: 1,
      admin: {
        description: 'Panjang produk dalam sentimeter',
      },
    },
    {
      name: 'width',
      type: 'number',
      required: true,
      min: 1,
      admin: {
        description: 'Lebar produk dalam sentimeter',
      },
    },
    {
      name: 'height',
      type: 'number',
      required: true,
      min: 1,
      admin: {
        description: 'Tinggi produk dalam sentimeter',
      },
    },
    {
      name: 'stock',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'cover_image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'gallery',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'available_colors',
      type: 'array',
      fields: [
        {
          name: 'color_name',
          type: 'text',
          required: true,
        },
        {
          name: 'hex_code',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'available_sizes',
      type: 'array',
      fields: [
        {
          name: 'size',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'detail_info',
      type: 'richText',
    },
    {
      name: 'care_guide',
      type: 'relationship',
      relationTo: 'care-guides',
      hasMany: false,
    },
  ],
}