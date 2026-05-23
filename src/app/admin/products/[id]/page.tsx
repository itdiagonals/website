"use client";

import ProductDetailModule from "@/modules/admin/product-detail";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  return <ProductDetailModule params={params} />;
}
