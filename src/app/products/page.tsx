import Image from 'next/image';
import Link from 'next/link';
import ProductRow from '../../components/product-row';
import ThemeHero from '@/src/modules/theme-hero';

const PRODUCT_CATEGORIES = [
  'Product Type',
  'Product Type',
  'Product Type',
  'Product Type',
  'Product Type',
];

const productData = [
  { id: 1, name: "Product Name", price: "Rp 123,500", image: "/blacktee.png" },
  { id: 2, name: "Product Name", price: "Rp 123,500", image: "/bluetee.png" },
  { id: 3, name: "Product Name", price: "Rp 123,500", image: "/greentee.png" },
  { id: 4, name: "Product Name", price: "Rp 123,500", image: "/blacktee.png" },
  { id: 5, name: "Product Name", price: "Rp 123,500", image: "/blacktee.png" },
  { id: 6, name: "Product Name", price: "Rp 123,500", image: "/bluetee.png" },
  { id: 7, name: "Product Name", price: "Rp 123,500", image: "/greentee.png" },
  { id: 8, name: "Product Name", price: "Rp 123,500", image: "/blacktee.png" },
  { id: 9, name: "Product Name", price: "Rp 123,500", image: "/blacktee.png" },
  { id: 10, name: "Product Name", price: "Rp 123,500", image: "/bluetee.png" },
  { id: 11, name: "Product Name", price: "Rp 123,500", image: "/greentee.png" },
  { id: 12, name: "Product Name", price: "Rp 123,500", image: "/blacktee.png" },
];

interface PageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function Products({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const searchQuery = resolvedSearchParams.search || '';

  // Filter products by search query
  const filteredProducts = searchQuery
    ? productData.filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : productData;

  const firstHalf = filteredProducts.slice(0, 4);
  const secondHalf = filteredProducts.slice(4);

  return (
    <>
      <ThemeHero theme={{ title: 'New Arrival', subtitle: 'Joining the Style', image: '/Frame1.png' }} />
      <section className="relative bg-neutral-100 flex flex-col items-center gap-12 overflow-hidden">
        <Image src="/bg4.webp" alt='' height={40} width={1440} className="object-cover w-full h-auto scale-102 left-5 absolute -top-10" />
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

        <div className="flex flex-col gap-16 w-full pb-20">
          {filteredProducts.length > 0 ? (
            <>
              <ProductRow products={firstHalf} isCarousel={false} />
              {secondHalf.length > 0 && <ProductRow products={secondHalf} isCarousel={false} />}
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
    </>
  );
}