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
      <div className="w-full max-w-[1440px] px-6 md:px-12 lg:px-20 mb-4">
        <ThemeHero
          theme={{
            title: activeSeason?.name || 'Current Season',
            subtitle: activeSeason?.subtitle || 'Theme of the season!',
            image: activeSeason?.cover_image?.url || '/CrossPlayer1.png',
            href: activeSeason?.slug ? `?season=${activeSeason.slug}` : undefined,
          }}
        />
      </div>

      <ProductsFilter seasons={seasonOptions} categories={categoryOptions} genders={genderOptions} />


      <div className="flex flex-col gap-16 w-full">
        {mappedProducts.length > 0 ? (
          <>
            <ProductRow products={firstHalf} />
            {secondHalf.length > 0 && <ProductRow products={secondHalf} />}
          </>
        ) : (
          <div className="w-full text-center py-20 flex flex-col items-center gap-6">
            <p className="text-2xl font-bold text-neutral-600">No products match the current filters</p>
            <p className="text-neutral-400 -mt-2">Try another season, category, gender, or search keyword.</p>
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
