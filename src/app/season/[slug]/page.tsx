import Link from 'next/link'
import { notFound } from 'next/navigation'

import LookbookCarousel from '@/components/lookbook-carousel'
import RowGallery from '@/components/row-gallery'
import ThemeDesc from '@/components/theme-desc'
import ProductsFilter from '@/src/components/products-filter'
import ProductRow from '@/src/components/product-row'
import { api } from '@/src/lib/api'
import ThemeHero from '@/src/modules/theme-hero'

function formatRupiah(price: number): string {
  return `Rp ${price.toLocaleString('id-ID')}`
}

function normalizeGender(gender: string): string {
  return gender.trim().toLowerCase()
}

function toTitleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

interface SeasonPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    season?: string
    category?: string
    gender?: string
  }>
}

async function fetchAllProducts(limit = 200) {
  const products = [] as Awaited<ReturnType<typeof api.products.getAll>>
  let page = 1

  while (true) {
    const batch = await api.products.getAll(undefined, page, limit)
    products.push(...batch)

    if (batch.length < limit) {
      break
    }

    page += 1
  }

  return products
}

export const dynamic = 'force-dynamic'

export default async function SeasonPage({ params, searchParams }: SeasonPageProps) {
  const { slug } = await params
  const resolvedSearchParams = await searchParams

  const selectedSeason = resolvedSearchParams.season || ''
  const selectedCategory = resolvedSearchParams.category || ''
  const selectedGender = resolvedSearchParams.gender || ''

  const [season, products, categories, allSeasons] = await Promise.all([
    api.seasons.getBySlug(slug).catch(() => null),
    fetchAllProducts(),
    api.categories.getAll(1, 200),
    api.seasons.getAll(1, 200).catch(() => []),
  ])

  const activeSeason = allSeasons.find((s) => s.is_active) || null

  if (!season) {
    notFound()
  }

  const encodedSeasonSlug = encodeURIComponent(season.slug)
  const seasonProductsHref = `/products?${new URLSearchParams({ season: season.slug }).toString()}`

  const seasonProducts = products.filter((product) => product.season?.slug === season.slug)

  const filteredProducts = seasonProducts.filter((product) => {
    const matchesSeason = selectedSeason ? product.season?.slug === selectedSeason : true
    const matchesCategory = selectedCategory ? product.category?.slug === selectedCategory : true
    const matchesGender = selectedGender
      ? normalizeGender(product.gender) === normalizeGender(selectedGender)
      : true

    return matchesSeason && matchesCategory && matchesGender
  })

  const mappedProducts = filteredProducts.map((product) => ({
    id: product.id,
    name: product.name,
    price: formatRupiah(product.base_price),
    image: product.cover_image?.url || '/lookbook-placeholder.webp',
    slug: product.slug,
  }))

  const firstHalf = mappedProducts.slice(0, 4)
  const secondHalf = mappedProducts.slice(4)

  const seasonOptions = [{ label: season.name, value: season.slug }]

  const availableCategorySlugs = new Set(seasonProducts.map((product) => product.category?.slug).filter(Boolean))
  const categoryOptions = [
    { label: 'All Categories', value: '' },
    ...categories
      .filter((category) => availableCategorySlugs.has(category.slug))
      .map((category) => ({ label: category.name, value: category.slug })),
  ]

  const genderOptions = [
    { label: 'All Genders', value: '' },
    ...Array.from(new Set(seasonProducts.map((product) => normalizeGender(product.gender))))
      .filter(Boolean)
      .map((gender) => ({
        label: toTitleCase(gender),
        value: gender,
      })),
  ]

  const galleryItems = (season.lookbook_images || []).slice(0, 3).map((image) => ({
    image: image.url,
  }))

  const lookbookSource = seasonProducts.filter((product) => product.is_lookbook)
  const lookbookProducts = (lookbookSource.length > 0 ? lookbookSource : seasonProducts).slice(0, 3)
  const lookbookItems = lookbookProducts.map((product) => ({
    id: product.id,
    productName: product.name,
    price: formatRupiah(product.base_price),
    image: product.cover_image?.url || '/lookbook-placeholder.webp',
    href: `/products/${encodeURIComponent(product.slug)}`,
  }))

  return (
    <>
      <ThemeHero
        theme={{
          title: season.name,
          subtitle: season.subtitle || 'Theme of the season!',
          image: season.cover_image?.url || '/image-2.png',
        }}
      />

      <section className="bg-neutral-100 py-8 md:py-16 flex flex-col items-center gap-6 md:gap-12">
        <ProductsFilter seasons={seasonOptions} categories={categoryOptions} genders={genderOptions} />

        {(selectedCategory || selectedGender) && (
          <div className="w-full max-w-full md:max-w-[1440px] px-4 sm:px-6 md:px-12 lg:px-20 text-center flex flex-col items-center gap-3 bg-neutral-200/50 py-4 md:py-6 rounded-lg border border-neutral-300/30">
            <p className="text-base md:text-lg lg:text-xl text-primary-500 font-medium">
              Showing
              {selectedCategory ? <span className="font-bold text-black"> · {categoryOptions.find((option) => option.value === selectedCategory)?.label}</span> : null}
              {selectedGender ? <span className="font-bold text-black"> · {toTitleCase(selectedGender)}</span> : null}
              <span className="text-neutral-500 text-sm ml-2">({mappedProducts.length} items found)</span>
            </p>
            <Link
              href={`/season/${encodedSeasonSlug}`}
              className="text-sm font-bold text-primary-400 hover:text-black underline transition-colors duration-200 cursor-pointer"
            >
              Clear Filters
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-8 md:gap-16 w-full">
          {mappedProducts.length > 0 ? (
            <>
              <ProductRow products={firstHalf} />
              {secondHalf.length > 0 && <ProductRow products={secondHalf} />}
            </>
          ) : (
            <div className="w-full text-center py-8 md:py-20 flex flex-col items-center gap-6">
              <p className="text-xl md:text-2xl font-bold text-neutral-600">No products found matching this season</p>
              <p className="text-neutral-400 -mt-2">Try other filters, or view the full season selection.</p>
              <Link href={`/season/${encodedSeasonSlug}`}>
                <button className="px-4 md:px-6 lg:px-8 py-2 md:py-3 bg-primary-500 hover:bg-neutral-800 text-white font-bold rounded-none hover:scale-105 transition-all duration-300 cursor-pointer">
                  Browse Full Season
                </button>
              </Link>
            </div>
          )}
        </div>
      </section>

      <ThemeDesc
        type="current-season"
        title={(activeSeason?.name || season.name).toUpperCase()}
        subtitle={activeSeason?.subtitle || season.subtitle || 'Theme of the season!'}
        desc={activeSeason?.description || season.description || 'Discover the full story and product lineup from this season.'}
        href={activeSeason ? `/products?${new URLSearchParams({ season: activeSeason.slug }).toString()}` : seasonProductsHref}
      />

      {activeSeason && activeSeason.lookbook_images && activeSeason.lookbook_images.length > 0 && <RowGallery type="image-only" items={activeSeason.lookbook_images.map((image) => ({ image: image.url }))} />}
      {lookbookItems.length > 0 && <LookbookCarousel items={lookbookItems} />}
    </>
  )
}
