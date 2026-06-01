import ThemeDesc from '../components/theme-desc';
import RowGallery from '../components/row-gallery';
import WelcomeAnimation from '../components/welcome-animation';
import Hero from '../modules/hero';
import LookbookCarousel from '../components/lookbook-carousel';
import NewArrival from '../modules/new-arrival';
import { api } from '../lib/api';

function formatRupiah(price: number): string {
  return `Rp. ${price.toLocaleString('id-ID')}`;
}

export default async function HomePage() {
  const [seasons, allProducts, categories] = await Promise.all([
    api.seasons.getAll(),
    api.products.getAll(undefined, 1, 50),
    api.categories.getAll(),
  ]);

  const activeSeason = seasons.find((s) => s.is_active) || seasons[0];
  const otherSeasons = seasons
    .filter((s) => s.id !== activeSeason?.id)
    .slice(0, 3);

  const seasonItems = otherSeasons.map((s) => ({
    image: s.cover_image?.url || '/image-1.png',
    title: s.name,
    href: `/season/${s.slug}`,
  }));

  const newArrivalProducts = allProducts.slice(0, 12);

  let lookbookProducts: typeof allProducts = [];
  try {
    lookbookProducts = await api.products.getLookbooks(3);
  } catch {
    lookbookProducts = allProducts.slice(0, 3);
  }

  const lookbookItems = lookbookProducts.map((p) => ({
    id: p.id,
    productName: p.name,
    price: formatRupiah(p.base_price),
    image: p.cover_image?.url || '/lookbook-placeholder.webp',
    href: `/products/${p.slug}`,
  }));

  const categoryItems = categories.slice(0, 3).map((c) => ({
    image: c.cover_image?.url || '/image-1.png',
    title: c.name,
    href: `/products?category=${c.slug}`,
  }));

  return (
    <>
      <WelcomeAnimation currentSeason={activeSeason?.name || 'Current Season'} />
        <Hero seasons={seasons} />
      <ThemeDesc
        type="current-season"
        title={activeSeason?.name?.toUpperCase() || 'CURRENT SEASON'}
        subtitle={activeSeason?.subtitle || ''}
        desc={activeSeason?.description || ''}
        href={`/season/${activeSeason?.slug}`}
      />
      <RowGallery
        type="image-only"
        items={activeSeason?.lookbook_images?.slice(0, 3).map((img) => ({
          image: img.url,
        })) || []}
      />
      <NewArrival products={newArrivalProducts} />
      <ThemeDesc
        type="all-season"
        title="Explore all Season"
        desc="Discover our timeless collection that never fades. Crafted with premium materials designed for daily comfort and durability, making sure you always wear your passion with pride."
        href="/season"
      />
      <RowGallery type="interactive" items={seasonItems} />
      <LookbookCarousel items={lookbookItems} />
      <RowGallery type="interactive" items={categoryItems} />
    </>
  );
}
