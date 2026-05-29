import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OrderSummaryProps {
  totalItems: number;
  itemSubtotal: number;
  promoDiscount: number;
  onCheckout: () => void;
  className?: string;
}

export function OrderSummary({
  totalItems,
  itemSubtotal,
  promoDiscount,
  onCheckout,
  className,
}: OrderSummaryProps) {
  const totalPrice = itemSubtotal - promoDiscount;

  return (
    <div className={cn("flex flex-col gap-[20px] items-start w-full", className)}>
      <div className="flex flex-col gap-[8px] items-start w-full">
        <h3 className="font-bold text-[20px] sm:text-[22px] leading-[30px] sm:leading-[33px] text-black w-full">
          Add Notes
        </h3>
        <textarea
          placeholder="Write Notes"
          className="w-full h-[61px] rounded-[10px] border border-black/20 bg-white px-4 sm:px-[21px] py-3 sm:py-[18px] text-b1 text-black outline-none transition-colors placeholder:text-black/40 placeholder:opacity-40 resize-none"
        />
      </div>

      <div className="bg-white border border-black/20 rounded-[10px] w-full overflow-hidden shrink-0">
        <div className="flex flex-col gap-[16px] sm:gap-[20px] items-start px-4 sm:px-[19px] py-4 sm:py-[19px]">
          <div className="flex flex-col gap-[16px] sm:gap-[20px] items-start w-full">
            <div className="flex items-center justify-between w-full gap-2">
              <span className="font-bold text-[20px] sm:text-[22px] leading-[30px] sm:leading-[33px] text-black">
                Order Total
              </span>
              <span className="font-bold text-[20px] sm:text-[22px] leading-[30px] sm:leading-[33px] text-black">
                {totalItems} Item
              </span>
            </div>
            <div className="flex flex-col gap-[7px] items-start text-b1 w-full">
              <div className="flex items-center justify-between w-full gap-4">
                <span>Item Subtotal</span>
                <span className="text-right">Rp {itemSubtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex items-center justify-between w-full gap-4">
                <span>Promo</span>
                <span className="text-right">- Rp {promoDiscount.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-neutral-200" />

          <div className="flex items-center justify-between text-b1 font-medium text-primary-400 w-full gap-4">
            <span>Total Price</span>
            <span className="text-right">Rp {totalPrice.toLocaleString("id-ID")}</span>
          </div>
        </div>
      </div>

      <Button
        onClick={onCheckout}
        className="w-full h-[52px] sm:h-[58px] rounded-[10px] bg-primary-400 text-white text-[18px] sm:text-[20px] font-semibold uppercase tracking-wide hover:bg-primary-500"
      >
        CHECKOUT
      </Button>
    </div>
  );
}
