import Link from 'next/link';
import ProductsFilter from '@/src/components/products-filter';
import { api } from '@/src/lib/api';
import ProductRow from '../../components/product-row';
import ThemeHero from '@/src/modules/theme-hero';

function formatRupiah(price: number): string {
  return `Rp ${price.toLocaleString('id-ID')}`;
}

function normalizeGender(gender: string): string {
  return gender.trim().toLowerCase();
}

function toTitleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

interface PageProps {
  searchParams: Promise<{
    search?: string;
    season?: string;
    category?: string;
    gender?: string;
  }>;
}

export default async function Products({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const searchQuery = resolvedSearchParams.search || '';
  const selectedSeason = resolvedSearchParams.season || '';
  const selectedCategory = resolvedSearchParams.category || '';
  const selectedGender = resolvedSearchParams.gender || '';

  const [products, seasons, categories] = await Promise.all([
    api.products.getAll(undefined, 1, 200),
    api.seasons.getAll(1, 200),
    api.categories.getAll(1, 200),
  ]);

  const activeSeason = seasons.find((season) => season.is_active) || seasons[0];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = searchQuery
      ? product.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesSeason = selectedSeason ? product.season?.slug === selectedSeason : true;
    const matchesCategory = selectedCategory ? product.category?.slug === selectedCategory : true;
    const matchesGender = selectedGender
      ? normalizeGender(product.gender) === normalizeGender(selectedGender)
      : true;

    return matchesSearch && matchesSeason && matchesCategory && matchesGender;
  });

  const mappedProducts = filteredProducts.map((product) => ({
    id: product.id,
    name: product.name,
    price: formatRupiah(product.base_price),
    image: product.cover_image?.url || '/lookbook-placeholder.webp',
    slug: product.slug,
  }));

  const firstHalf = mappedProducts.slice(0, 4);
  const secondHalf = mappedProducts.slice(4);

  const seasonOptions = [
    { label: 'All Seasons', value: '' },
    ...seasons.map((season) => ({ label: season.name, value: season.slug })),
  ];

  const categoryOptions = [
    { label: 'All Categories', value: '' },
    ...categories.map((category) => ({ label: category.name, value: category.slug })),
  ];

  const genderOptions = [
    { label: 'All Genders', value: '' },
    ...Array.from(new Set(products.map((product) => normalizeGender(product.gender)))).map((gender) => ({
      label: toTitleCase(gender),
      value: gender,
    })),
  ];

  return (
    <section className="bg-neutral-100 py-28 flex flex-col items-center gap-12">
      {/* Decorative Theme Banner at the Top */}
      <div className="w-full max-w-[1440px] px-6 md:px-12 lg:px-20 mb-4">
        <ThemeHero theme={{ title: 'Cross Player',  image: '/CrossPlayer1.png', href: 'cross-player' }} />
      </div>

      {/* Category Selection Filter Pills */}
      <div className="container flex items-center justify-center flex-wrap gap-y-4 gap-x-10">
        {PRODUCT_CATEGORIES.map((category, index) => (
          <div key={index} className="flex items-center gap-10">
            <button className="flex items-center gap-3 cursor-pointer hover:opacity-70 transition duration-300">
              <span className="text-primary-400 text-lg font-medium">
                {category}
              </span>
              <Image
                src="/chevron-down.svg"
                alt="Arrow"
                width={20}
                height={20}
                className="text-primary-400"
              />
            </button>
            {index < PRODUCT_CATEGORIES.length - 1 && (
              <div className="w-px h-6 bg-primary-400/40 shrink-0 hidden md:block"></div>
            )}
          </div>
        ))}
      </div>

      {/* Dynamic Search Results Status Bar */}
      {searchQuery && (
        <div className="w-full max-w-[1440px] px-6 md:px-12 lg:px-20 text-center flex flex-col items-center gap-3 bg-neutral-200/50 py-6 rounded-lg border border-neutral-300/30">
          <p className="text-lg md:text-xl text-primary-500 font-medium">
            Search results for: <span className="font-bold text-black">"{searchQuery}"</span>
            <span className="text-neutral-500 text-sm ml-2">({filteredProducts.length} items found)</span>
          </p>
          <Link
            href="/products"
            className="text-sm font-bold text-primary-400 hover:text-black underline transition-colors duration-200 cursor-pointer"
          >
            Clear Search and View All Products
          </Link>
        </div>
      )}

      {/* Products Row Grid Layout */}
      <div className="flex flex-col gap-16 w-full">
        {filteredProducts.length > 0 ? (
          <>
            {/* FIRST ROW GRID */}
            <ProductRow products={firstHalf} />

            {/* SECOND GRID (ONLY RENDER IF WE HAVE REMAINING ITEMS) */}
            {secondHalf.length > 0 && <ProductRow products={secondHalf} />}
          </>
        ) : (
          <div className="w-full text-center py-20 flex flex-col items-center gap-6">
            <span className="text-5xl">🔍</span>
            <p className="text-2xl font-bold text-neutral-600">No products found matching "{searchQuery}"</p>
            <p className="text-neutral-400 -mt-2">Try searching with other keywords, or browse all products.</p>
            <Link href="/products">
              <button className="px-8 py-3 bg-primary-500 hover:bg-neutral-800 text-white font-bold rounded-none hover:scale-105 transition-all duration-300 cursor-pointer">
                Browse All Products
              </button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
