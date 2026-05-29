import { notFound } from "next/navigation";
import { products } from "@/src/lib/dummy-data";
import ProductDetailModule from "@/src/modules/products/product-detail";
import Navbar from "@/src/components/ui/navbar";

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
      <Navbar variant="light" />
      <ProductDetailModule product={product} />
    </>
  );
}
