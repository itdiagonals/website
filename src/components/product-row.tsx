import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: string;
  image: string;
}

interface ProductRowProps {
  products: Product[];
}

export default function ProductRow({ products }: ProductRowProps) {
  return (
    <div className="grid grid-cols-4 gap-6 px-6">
      {products.map((product) => (
        <Link
          href={`/product/${product.id}`}
          key={product.id}
          className="flex flex-col gap-8 cursor-pointer"
        >
          <div className="aspect-square flex items-center justify-center hover:scale-110 transition duration-600">
            <Image
              src={product.image}
              alt={product.name}
              width={200}
              height={200}
              className="object-contain"
            />
          </div>
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-2">
              <span className="text-primary-1000 text-lg font-bold leading-tight font-sans hover:opacity-60 transition duration-600">
                {product.name}
              </span>
              <span className="text-primary-1000 text-xs font-normal font-sans">
                {product.price}
              </span>
            </div>
            <div className="w-[27px] h-[27px] border border-neutral-900 flex items-center justify-center hover:bg-neutral-200 transition duration-600">
              <ChevronRight size={16} strokeWidth={2} className="text-black" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
