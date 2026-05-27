import { cn } from "@/lib/utils";

export interface BillItem {
  label: string;
  value: number;
  isDiscount?: boolean;
}

interface BillDetailProps {
  customerName: string;
  orderId: string;
  orderDate: string;
  items: BillItem[];
  totalPrice: number;
  className?: string;
}

export function BillDetail({
  customerName,
  orderId,
  orderDate,
  items,
  totalPrice,
  className,
}: BillDetailProps) {
  return (
    <div className={cn("bg-white border border-black/20 rounded-[10px] p-4 sm:p-6", className)}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 text-black">
        <div className="text-b1 font-medium">{customerName}</div>
        <div className="text-left sm:text-right font-[Poppins,sans-serif] text-[14px] sm:text-[16px] leading-[21px] sm:leading-[24px]">
          <p>{orderId}</p>
          <p>{orderDate}</p>
        </div>
      </div>

      <div className="h-px bg-neutral-200 my-4 sm:my-6" />

      <div className="flex items-center justify-between text-b1 font-medium text-primary-400 mb-3 sm:mb-4">
        <span>Description</span>
        <span className="text-b2">Price</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-[5px] text-b2 text-primary-400">
          {items.map((item) => (
            <span key={item.label}>{item.label}</span>
          ))}
        </div>

        <div className="flex flex-col gap-[5px] text-b2 text-black text-right">
          {items.map((item) => (
            <span key={item.label}>
              {item.isDiscount && "- "}
              Rp. {item.value.toLocaleString("id-ID")}
            </span>
          ))}
        </div>
      </div>

      <div className="h-px bg-neutral-200 my-4 sm:my-6" />

      <div className="flex items-center justify-between gap-4">
        <div className="text-b2 text-primary-400">Price Total</div>
        <div className="text-[20px] sm:text-h7 leading-[30px] sm:leading-[33px] font-bold text-primary-500 text-right">
          Rp. {totalPrice.toLocaleString("id-ID")}
        </div>
      </div>
    </div>
  );
}
