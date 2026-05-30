"use client";

interface ProductActionBarProps {
  onAddToCart?: () => void;
  onBuyNow?: () => void;
  disabled?: boolean;
}

export default function ProductActionBar({
  onAddToCart,
  onBuyNow,
  disabled = false,
}: ProductActionBarProps) {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-white h-[84px] z-50 border-t border-neutral-200">
      <div className="max-w-[1440px] mx-auto relative h-full flex items-center justify-end px-4 md:px-10">
        <div className="flex gap-[8.5px] items-center w-full md:w-auto justify-between md:justify-end">
          <button
            onClick={onAddToCart}
            disabled={disabled}
            className={`h-[41.8px] flex-1 md:w-[162.5px] rounded-[5px] border text-sm md:text-[15.5px] font-normal transition duration-200 flex items-center justify-center ${
              disabled
                ? "border-neutral-300 text-neutral-300 bg-neutral-100 cursor-not-allowed"
                : "border-primary-500 text-primary-500 bg-white hover:bg-neutral-100 cursor-pointer"
            }`}
          >
            Keranjang
          </button>
          <button
            onClick={onBuyNow}
            disabled={disabled}
            className={`h-[41.8px] flex-1 md:w-[162.5px] rounded-[5px] text-[#fcfffc] text-sm md:text-[15.5px] font-normal transition duration-200 flex items-center justify-center ${
              disabled
                ? "bg-neutral-300 cursor-not-allowed"
                : "bg-primary-500 hover:bg-primary-400 cursor-pointer"
            }`}
          >
            Beli Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
