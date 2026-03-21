import Image from "next/image";
import Link from "next/link";

export default function ProductCard({ product }) {
  return (
    <Link
      href={`/product/${product.id}`}
      className="flex flex-col gap-8 cursor-pointer group"
    >
      <div
        className={
          "aspect-square flex items-center justify-center group-hover:scale-110 transition duration-600"
        }
      >
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
          <span className="text-primary-1000 text-lg font-bold leading-tight font-sans group-hover:opacity-60 transition duration-600">
            {product.name}
          </span>
          <span className="text-primary-1000 text-xs font-normal font-sans">
            {product.price}
          </span>
        </div>
        <div className="w-[27px] h-[27px] border border-neutral-900 flex justify-center group-hover:bg-neutral-500 transition duration-600">
          <Image src="/chevron-right.svg" alt="Detail" width={16} height={16} />
        </div>
      </div>
    </Link>
  );
}
