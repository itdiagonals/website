import Image from "next/image";
import ProductCard from "../../components/ProductCard";

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
  {
    id: 11,
    name: "Product Name",
    price: "Rp. 123,500",
    image: "/greentee.png",
  },
  {
    id: 12,
    name: "Product Name",
    price: "Rp. 123,500",
    image: "/blacktee.png",
  },
];

export default function NewArrival() {
  return (
    <main className="flex flex-col items-center w-full">
      <section className="relative w-full h-[715px] overflow-hidden text-neutral-100 font-[DorivalUITrial] flex items-end">
        <div className="absolute inset-0 z-0">
          <Image
            src="/Frame1.png"
            alt="New Arrival"
            fill
            className="object-contain object-center bg-black"
          />
        </div>
        <div className="absolute top-0 left-0 h-[200px] w-full bg-[linear-gradient(180deg,rgba(0,0,0,0.5)_0%,rgba(0,0,0,0)_100%)] z-10" />
        <div className="absolute bottom-0 left-0 h-[300px] w-full bg-[linear-gradient(0deg,rgba(0,0,0,0.5)_0%,rgba(0,0,0,0)_100%)] z-10" />
        <div className="w-full max-w-[1440px] mx-auto px-20 pb-16 relative z-20">
          <div className="flex flex-col items-start gap-6 max-w-[600px]">
            <h4 className="font-[Handi] font-normal text-2l leading-[7px] italic">
              Joining the Style
            </h4>
            <h2 className="text-6xl font-bold leading-tight">New Arrival</h2>
          </div>
        </div>
      </section>

      <section className="bg-neutral-100 py-16 w-full flex flex-col items-center gap-16">
        <div className="w-full max-w-[1440px] px-6 mx-auto">
          <div className="flex items-center justify-center gap-10 mb-16">
            {PRODUCT_CATEGORIES.map((category, index) => (
              <div key={index} className="flex items-center gap-10">
                <button className="flex items-center gap-3 cursor-pointer hover:opacity-70 transition duration-600">
                  <span className="text-primary-400 text-lg font-medium whitespace-nowrap">
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
          <div className="grid grid-cols-4 gap-6 w-full">
            {productData.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
