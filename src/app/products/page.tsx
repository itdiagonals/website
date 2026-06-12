import Link from 'next/link'

import ProductsFilter from '@/src/components/products-filter'
import { api } from '@/src/lib/api'
import ProductRow from '../../components/product-row'
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

interface PageProps {
  searchParams: Promise<{
    search?: string
    season?: string
    category?: string
    gender?: string
  }>
}

import type { Metadata } from 'next'
import { SITE_NAME } from '@/src/lib/seo'

export const metadata: Metadata = {
  title: `Shop All Products | ${SITE_NAME}`,
  description: 'Browse the full collection of Diagonals streetwear. Filter by season, category, and gender to find your perfect fit.',
  openGraph: {
    title: `Shop All Products | ${SITE_NAME}`,
    description: 'Browse the full collection of Diagonals streetwear. Filter by season, category, and gender to find your perfect fit.',
    type: 'website',
  },
  alternates: {
    canonical: '/products',
  },
}

export default async function Products({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams
  const searchQuery = resolvedSearchParams.search || ''
  const selectedSeason = resolvedSearchParams.season || ''
  const selectedCategory = resolvedSearchParams.category || ''
  const selectedGender = resolvedSearchParams.gender || ''

  const [products, seasons, categories] = await Promise.all([
    api.products.getAll(undefined, 1, 200),
    api.seasons.getAll(1, 200),
    api.categories.getAll(1, 200),
  ])

  const activeSeason = seasons.find((season) => season.is_active) || seasons[0]

  const filteredProducts = products.filter((product) => {
    const matchesSearch = searchQuery
      ? product.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true
    const matchesSeason = selectedSeason ? product.season?.slug === selectedSeason : true
    const matchesCategory = selectedCategory ? product.category?.slug === selectedCategory : true
    const matchesGender = selectedGender
      ? normalizeGender(product.gender) === normalizeGender(selectedGender)
      : true

    return matchesSearch && matchesSeason && matchesCategory && matchesGender
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

  const seasonOptions = [
    { label: 'All Seasons', value: '' },
    ...seasons.map((season) => ({ label: season.name, value: season.slug })),
  ]

  const categoryOptions = [
    { label: 'All Categories', value: '' },
    ...categories.map((category) => ({ label: category.name, value: category.slug })),
  ]

  const genderOptions = [
    { label: 'All Genders', value: '' },
    ...Array.from(new Set(products.map((product) => normalizeGender(product.gender)))).map((gender) => ({
      label: toTitleCase(gender),
      value: gender,
    })),
  ]

  return (
    <section className="bg-neutral-100 py-12 md:py-20 lg:py-28 flex flex-col items-center gap-6 md:gap-12">
      <div className="w-full max-w-full md:max-w-[1440px] px-4 sm:px-6 md:px-12 lg:px-20 mb-4">
        <ThemeHero
          theme={{
            title: activeSeason?.name || 'Current Season',
            subtitle: activeSeason?.subtitle || 'Theme of the season!',
            image: activeSeason?.cover_image?.url || '/CrossPlayer1.webp',
            href: activeSeason?.slug ? `?season=${activeSeason.slug}` : undefined,
          }}
        />
      </div>

      <ProductsFilter seasons={seasonOptions} categories={categoryOptions} genders={genderOptions} />

      {(searchQuery || selectedSeason || selectedCategory || selectedGender) && (
        <div className="w-full max-w-full md:max-w-[1440px] px-4 sm:px-6 md:px-12 lg:px-20 text-center flex flex-col items-center gap-3 bg-neutral-200/50 py-4 md:py-6 rounded-lg border border-neutral-300/30">
            <p className="text-base md:text-lg lg:text-xl text-primary-500 font-medium">
            Showing
            {searchQuery ? <span className="font-bold text-black"> &ldquo;{searchQuery}&rdquo;</span> : null}
            {selectedSeason ? <span className="font-bold text-black"> · {seasonOptions.find((option) => option.value === selectedSeason)?.label}</span> : null}
            {selectedCategory ? <span className="font-bold text-black"> · {categoryOptions.find((option) => option.value === selectedCategory)?.label}</span> : null}
            {selectedGender ? <span className="font-bold text-black"> · {toTitleCase(selectedGender)}</span> : null}
            <span className="text-neutral-500 text-sm ml-2">({mappedProducts.length} items found)</span>
          </p>
          <Link
            href="/products"
            className="text-sm font-bold text-primary-400 hover:text-black underline transition-colors duration-200 cursor-pointer"
          >
            Clear Search and View All Products
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
            <p className="text-xl md:text-2xl font-bold text-neutral-600">No products found matching</p>
            <p className="text-neutral-400 -mt-2">Try searching with other keywords, or browse all products.</p>
            <Link href="/products">
              <button className="px-4 md:px-6 lg:px-8 py-2 md:py-3 bg-primary-500 hover:bg-neutral-800 text-white font-bold rounded-none hover:scale-105 transition-all duration-300 cursor-pointer">
                Browse All Products
              </button>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
