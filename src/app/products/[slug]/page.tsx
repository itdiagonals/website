import { notFound } from "next/navigation";
import ProductDetailModule from "@/src/modules/products/product-detail";
import Navbar from "@/src/components/ui/navbar";
import type { Product as BackendProduct, Season as BackendSeason } from "@/src/lib/api";
import { mapBackendProduct, mapBackendSeason } from "@/src/lib/mappers";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.startsWith("/")
  ? process.env.NEXT_PUBLIC_API_URL
  : "http://localhost:8080/api/v1";

async function fetchBackendProduct(slug: string): Promise<BackendProduct | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/slug/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    const payload = await res.json();
    return payload?.data ?? null;
  } catch {
    return null;
  }
}

async function fetchBackendSeasons(): Promise<BackendSeason[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/seasons`, { cache: "no-store" });
    if (!res.ok) return [];
    const payload = await res.json();
    return payload?.data ?? [];
  } catch {
    return [];
  }
}

async function fetchSimilarProducts(productId: number): Promise<BackendProduct[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${productId}/similar?limit=20`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const payload = await res.json();
    return payload?.data ?? [];
  } catch {
    return [];
  }
}

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const backendProduct = await fetchBackendProduct(slug);

  if (!backendProduct) {
    notFound();
  }

  const product = mapBackendProduct(backendProduct);

  const [backendSeasons, similarBackendProducts] = await Promise.all([
    fetchBackendSeasons(),
    fetchSimilarProducts(backendProduct.id),
  ]);

  const activeBackendSeason = backendSeasons.find((s) => s.is_active);
  const activeSeason = activeBackendSeason ? mapBackendSeason(activeBackendSeason) : null;
  const similarProducts = similarBackendProducts.map(mapBackendProduct);

  return (
    <>
      <Navbar variant="light" />
      <ProductDetailModule product={product} similarProducts={similarProducts} activeSeason={activeSeason} />
    </>
  );
}
