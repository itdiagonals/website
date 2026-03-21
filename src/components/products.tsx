import Image from "next/image";
import Link from "next/link";
import S3Theme from "./s3theme";
const PRODUCT_CATEGORIES = [
  "Product Type",
  "Product Type",
  "Product Type",
  "Product Type",
  "Product Type",
];
const productData = [
  { id: 1, name: "Product Name", price: "Rp. 123,500", image: "/blacktee.png" },
  { id: 2, name: "Product Name", price: "Rp. 123,500", image: "/bluetee.png" },
  { id: 3, name: "Product Name", price: "Rp. 123,500", image: "/greentee.png" },
  { id: 4, name: "Product Name", price: "Rp. 123,500", image: "/blacktee.png" },
  { id: 5, name: "Product Name", price: "Rp. 123,500", image: "/blacktee.png" },
  { id: 6, name: "Product Name", price: "Rp. 123,500", image: "/bluetee.png" },
  { id: 7, name: "Product Name", price: "Rp. 123,500", image: "/greentee.png" },
  { id: 8, name: "Product Name", price: "Rp. 123,500", image: "/blacktee.png" },
  { id: 9, name: "Product Name", price: "Rp. 123,500", image: "/blacktee.png" },
  { id: 10, name: "Product Name", price: "Rp. 123,500", image: "/bluetee.png" },
  { id: 11, name: "Product Name", price: "Rp. 123,500", image: "/greentee.png" },
  { id: 12, name: "Product Name", price: "Rp. 123,500", image: "/blacktee.png" },
];

const firstHalf = productData.slice(0, 4);
const secondHalf = productData.slice(4);
export default function Products() {
  return (
    <section className="bg-neutral-100 py-17 flex flex-col items-center gap-17">
      <div className="container flex items-center justify-center gap-10">
        {PRODUCT_CATEGORIES.map((category, index) => (
          <div key={index} className="flex items-center gap-10">
            <button className="flex items-center gap-3 cursor-pointer hover:opacity-70 transition duration-600">
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
              <div className="w-px h-6 bg-primary-400 shrink-0"></div>
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-[80px] w-full">

        {/* INI ROW 1 */}
        <div className="grid grid-cols-4 gap-6 px-6">
          {firstHalf.map((product) => (
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
                <div className="w-[27px] h-[27px] border border-neutral-900 flex justify-center hover:bg-neutral-200 transition duration-600">
                  <Image
                    src="/chevron-right.svg"
                    alt="Detail"
                    width={16}
                    height={16}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/*INI THEME ANTARA PRODUK*/}
        <S3Theme />

        {/* ROW 2 DAN 3 ya */}
        <div className="grid grid-cols-4 gap-6 px-6">
          {secondHalf.map((product) => (
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
                <div className="w-[27px] h-[27px] border border-neutral-900 flex justify-center hover:bg-neutral-200 transition duration-600">
                  <Image
                    src="/chevron-right.svg"
                    alt="Detail"
                    width={16}
                    height={16}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section >
  );
}