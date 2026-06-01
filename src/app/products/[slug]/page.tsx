import { notFound } from "next/navigation";
import ProductDetailModule from "@/src/modules/products/product-detail";
import type { Product as BackendProduct, Season as BackendSeason } from "@/src/lib/api";
import { mapBackendProduct, mapBackendSeason } from "@/src/lib/mappers";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

const API_BASE_URL = process.env.INTERNAL_API_URL || "http://localhost:8080/api/v1";

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

import type { Metadata } from 'next'
import { SITE_NAME } from '@/src/lib/seo'

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await fetchBackendProduct(slug)

  if (!product) {
    return {
      title: 'Product Not Found',
    }
  }

  const title = `${product.name} | ${SITE_NAME}`
  const description = product.description
    ? String(product.description).slice(0, 160)
    : `Shop ${product.name} at ${SITE_NAME}. Premium streetwear crafted for the modern urban lifestyle.`
  const imageUrl = product.cover_image?.url || '/logo/diagonals.webp'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [{ url: imageUrl, alt: product.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: `/products/${slug}`,
    },
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
      <ProductDetailModule product={product} similarProducts={similarProducts} activeSeason={activeSeason} />
    </>
  );
}
