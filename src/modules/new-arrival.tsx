import ProductRow from "../components/product-row";
import { Button } from "../components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { api } from "../lib/api";

type Product = Awaited<ReturnType<typeof api.products.getAll>>[number];

interface NewArrivalProps {
  products: Product[];
}

function formatRupiah(price: number): string {
  return `Rp. ${price.toLocaleString('id-ID')}`;
}

export default function NewArrival({ products }: NewArrivalProps) {
  const displayProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: formatRupiah(p.base_price),
    image: p.cover_image?.url || '/blacktee.png',
    slug: p.slug,
    category: p.category?.name || 'Product',
  }));

  return (
    <section className="relative w-full flex flex-col items-center bg-white pb-8 sm:pb-16 md:pb-24 lg:pb-30">
      <Image src="/bg4.webp" alt='' height={40} width={1440} className="object-cover w-full h-auto scale-102 -left-5 absolute -top-10" />
      <div className="flex flex-col sm:flex-row justify-between w-full items-start sm:items-center gap-4 sm:gap-0 px-4 sm:px-6 md:px-12 lg:px-[80px] py-6 sm:py-10 md:py-15">
        <h2 className="text-black text-xl sm:text-[24px] md:text-[28px] font-bold leading-tight tracking-wide drop-shadow-md">New Arrival</h2>
        <Link href="/products">
          <Button className="border-black text-black" variant="outline">View All</Button>
        </Link>
      </div>
      <ProductRow products={displayProducts} />
    </section>
  );
}
