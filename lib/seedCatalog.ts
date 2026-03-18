import fs from 'node:fs'
import path from 'node:path'

import { getPayload } from 'payload'

import config from '../payload.config.ts'

type DocWithID = {
  id: number | string
}

type SlugDoc = DocWithID & {
  slug?: string
}

const seedImagePath = path.resolve(process.cwd(), 'public', 'download (30).png')

const assertSeedImageExists = () => {
  if (!fs.existsSync(seedImagePath)) {
    throw new Error(`Seed image not found at ${seedImagePath}`)
  }
}

const ensureMedia = async (payload: Awaited<ReturnType<typeof getPayload>>, alt: string) => {
  const existing = await payload.find({
    collection: 'media',
    limit: 1,
    overrideAccess: true,
    where: {
      alt: {
        equals: alt,
      },
    },
  })

  if (existing.docs[0]) {
    return existing.docs[0] as DocWithID
  }

  return payload.create({
    collection: 'media',
    data: {
      alt,
    },
    filePath: seedImagePath,
    overrideAccess: true,
  }) as Promise<DocWithID>
}

const upsertBySlug = async <TData extends Record<string, unknown>>(
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: 'categories' | 'products' | 'seasons',
  slug: string,
  data: TData,
) => {
  const existing = await payload.find({
    collection,
    limit: 1,
    overrideAccess: true,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  if (existing.docs[0]) {
    return payload.update({
      collection,
      id: (existing.docs[0] as SlugDoc).id,
      data,
      overrideAccess: true,
    })
  }

  return payload.create({
    collection,
    data,
    overrideAccess: true,
  })
}

const upsertCareGuideByTitle = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  title: string,
  instructions: ReturnType<typeof createLexicalParagraph>,
) => {
  const existing = await payload.find({
    collection: 'care-guides',
    limit: 1,
    overrideAccess: true,
    where: {
      title: {
        equals: title,
      },
    },
  })

  if (existing.docs[0]) {
    return payload.update({
      collection: 'care-guides',
      id: (existing.docs[0] as SlugDoc).id,
      data: {
        instructions,
        title,
      },
      overrideAccess: true,
    })
  }

  return payload.create({
    collection: 'care-guides',
    data: {
      instructions,
      title,
    },
    overrideAccess: true,
  })
}

const createLexicalParagraph = (text: string) => ({
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text,
            type: 'text',
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: null,
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
})

export const seedCatalog = async () => {
  assertSeedImageExists()

  const payload = await getPayload({ config: await config })

  const seasonCover = await ensureMedia(payload, 'Cross Player season cover')
  const seasonLookbook = await ensureMedia(payload, 'Cross Player lookbook image')
  const topCategoryCover = await ensureMedia(payload, 'Top category cover')
  const shortsCategoryCover = await ensureMedia(payload, 'Shorts category cover')
  const headwearCategoryCover = await ensureMedia(payload, 'Headwear category cover')
  const jerseyCover = await ensureMedia(payload, 'Cross Player jersey cover')
  const shortsCover = await ensureMedia(payload, 'Cross Player shorts cover')
  const capCover = await ensureMedia(payload, 'Cross Player cap cover')

  const season = await upsertBySlug(payload, 'seasons', 'cross-player', {
    cover_image: seasonCover.id,
    description: 'Season drop dengan nuansa sport streetwear untuk katalog awal.',
    is_active: true,
    lookbook_images: [{ image: seasonLookbook.id }],
    name: 'Cross Player',
    slug: 'cross-player',
    subtitle: 'Season launch untuk seed data awal',
  })

  const topCategory = await upsertBySlug(payload, 'categories', 'top', {
    cover_image: topCategoryCover.id,
    name: 'Top',
    slug: 'top',
  })

  const shortsCategory = await upsertBySlug(payload, 'categories', 'shorts', {
    cover_image: shortsCategoryCover.id,
    name: 'Shorts',
    slug: 'shorts',
  })

  const headwearCategory = await upsertBySlug(payload, 'categories', 'headwear', {
    cover_image: headwearCategoryCover.id,
    name: 'Headwear',
    slug: 'headwear',
  })

  const cottonCareGuide = await upsertCareGuideByTitle(
    payload,
    'Cotton Care',
    createLexicalParagraph('Cuci dengan air dingin, hindari pemutih, dan jemur terbalik.'),
  )

  const shortsCareGuide = await upsertCareGuideByTitle(
    payload,
    'Shorts Care',
    createLexicalParagraph('Setrika suhu rendah dan jemur terbalik setelah dicuci.'),
  )

  const capCareGuide = await upsertCareGuideByTitle(
    payload,
    'Cap Care',
    createLexicalParagraph('Bersihkan lokal dengan kain lembap dan jangan dicuci mesin.'),
  )

  await upsertBySlug(payload, 'products', 'cross-player-jersey', {
    available_colors: [
      { color_name: 'Bone White', hex_code: '#F4EFE6' },
      { color_name: 'Night Black', hex_code: '#101010' },
    ],
    available_sizes: [{ size: 'S' }, { size: 'M' }, { size: 'L' }, { size: 'XL' }],
    base_price: 329000,
    care_guide: cottonCareGuide.id,
    category: topCategory.id,
    cover_image: jerseyCover.id,
    description: 'Jersey ringan dengan siluet relaxed untuk daily wear.',
    detail_info: createLexicalParagraph('Material quick dry dengan feel ringan untuk mobilitas tinggi.'),
    gallery: [{ image: jerseyCover.id }, { image: seasonLookbook.id }],
    gender: 'unisex',
    name: 'Cross Player Jersey',
    season: season.id,
    slug: 'cross-player-jersey',
    stock: 48,
    weight: 300,
  })

  await upsertBySlug(payload, 'products', 'cross-player-shorts', {
    available_colors: [
      { color_name: 'Graphite', hex_code: '#3A3A3A' },
      { color_name: 'Clay', hex_code: '#A68A64' },
    ],
    available_sizes: [{ size: 'M' }, { size: 'L' }, { size: 'XL' }],
    base_price: 279000,
    care_guide: shortsCareGuide.id,
    category: shortsCategory.id,
    cover_image: shortsCover.id,
    description: 'Shorts utilitarian untuk drop Cross Player.',
    detail_info: createLexicalParagraph('Pinggang elastis dan potongan lurus untuk kenyamanan harian.'),
    gallery: [{ image: shortsCover.id }, { image: seasonLookbook.id }],
    gender: 'pria',
    name: 'Cross Player Shorts',
    season: season.id,
    slug: 'cross-player-shorts',
    stock: 32,
    weight: 250,
  })

  await upsertBySlug(payload, 'products', 'cross-player-cap', {
    available_colors: [
      { color_name: 'Midnight Navy', hex_code: '#1F2A44' },
      { color_name: 'Sand', hex_code: '#D9C7A3' },
    ],
    available_sizes: [{ size: 'All Size' }],
    base_price: 189000,
    care_guide: capCareGuide.id,
    category: headwearCategory.id,
    cover_image: capCover.id,
    description: 'Cap structured dengan branding minimal untuk koleksi awal.',
    detail_info: createLexicalParagraph('Visor melengkung ringan dan strap adjustable.'),
    gallery: [{ image: capCover.id }, { image: seasonLookbook.id }],
    gender: 'unisex',
    name: 'Cross Player Cap',
    season: season.id,
    slug: 'cross-player-cap',
    stock: 24,
    weight: 150,
  })

  return {
    categories: ['top', 'shorts', 'headwear'],
    products: ['cross-player-jersey', 'cross-player-shorts', 'cross-player-cap'],
    season: 'cross-player',
    success: true,
  }
}