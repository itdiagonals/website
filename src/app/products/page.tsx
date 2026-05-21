import Image from "next/image";
import ProductRow from "../../components/product-row";
import ThemeDesc from "../../components/theme-desc";
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
      <div className="flex flex-col gap-20 w-full">

        {/* INI ROW 1 */}
        <ProductRow products={firstHalf} />

        {/*INI THEME ANTARA PRODUK*/}
        {/* <ThemeDesc
          type="current-season"
          title="CROSS PLAYER MULTINANCE"
          desc="Lorem ipsum dolor sit amet consectetur. Amet id et massa sem feugiat nec. Elementum pellentesque id lacus massa quis. Metus proin dignissim tincidunt gravida. Magnis quis faucibus viverra tempor cursus et eget velit non. Id volutpat diam convallis suspendisse in adipiscing at. Posuere nam felis mauris amet."
          href="/current-season"
        /> */}

        {/* ROW 2 DAN 3 ya */}
        <ProductRow products={secondHalf} />

      </div>
    </section >
  );
}