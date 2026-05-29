import { notFound } from "next/navigation";
import { products } from "@/src/lib/dummy-data";
import ProductDetailModule from "@/src/modules/products/product-detail";
import { Header } from "@/src/components/header-demo";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);

  if (!product) {
    notFound();
  }

  return (
    <>
      <Header />
      <ProductDetailModule product={product} />
    </>
  );
}
