"use client";

interface ProductActionBarProps {
  onAddToCart?: () => void;
  onBuyNow?: () => void;
}

export default function ProductActionBar({
  onAddToCart,
  onBuyNow,
}: ProductActionBarProps) {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-white h-[84px] z-50 border-t border-neutral-200">
      <div className="max-w-[1440px] mx-auto relative h-full flex items-center justify-end px-4 md:px-10">
        <div className="flex gap-[8.5px] items-center w-full md:w-auto justify-between md:justify-end">
          <button
            onClick={onAddToCart}
            className="h-[41.8px] flex-1 md:w-[162.5px] rounded-[5px] bg-white border border-primary-500 text-primary-500 text-sm md:text-[15.5px] font-normal hover:bg-neutral-100 transition duration-200 cursor-pointer flex items-center justify-center"
          >
            Keranjang
          </button>
          <button
            onClick={onBuyNow}
            className="h-[41.8px] flex-1 md:w-[162.5px] rounded-[5px] bg-primary-500 text-[#fcfffc] text-sm md:text-[15.5px] font-normal hover:bg-primary-400 transition duration-200 cursor-pointer flex items-center justify-center"
          >
            Beli Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
