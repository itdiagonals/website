import Image from "next/image";
import { Package, PackageOpen } from "lucide-react";
import { cn } from "@/lib/utils";

import { useRouter } from "next/navigation";

export interface OrderItem {
  id: string;
  orderId: string;
  name: string;
  gender: string;
  color: string;
  size: string;
  price: number;
  image: string;
  status: "Order Accepted" | "Order Packaged" | "Order Sent" | "Order Finished";
  timestamp: string;
}

interface OrderTrackingCardProps {
  item: OrderItem;
  variant?: "ongoing" | "finished";
  className?: string;
}

export function OrderTrackingCard({ item, variant = "ongoing", className }: OrderTrackingCardProps) {
  const router = useRouter();
  const isFinished = variant === "finished";

  return (
    <button
      onClick={() => router.push(`/orders/${item.orderId}`)}
      className={cn(
        "w-full text-left bg-white border border-primary-100 rounded-[10px] overflow-hidden p-4 sm:px-[34px] sm:py-[24px] cursor-pointer hover:border-primary-300 transition-colors duration-200",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-0">
        <div className="relative w-[100px] h-[125px] sm:w-[113.887px] sm:h-[142.358px] shrink-0 mx-auto sm:mx-0">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
            sizes="114px"
          />
        </div>

        <div className="flex flex-col gap-[0.886px] text-black sm:ml-[55px] min-w-0">
          <p className="text-b2 break-words">{item.name}</p>
          <div className="text-[10.638px] leading-[0]" style={{ fontFamily: "Poppins, sans-serif" }}>
            <p className="leading-[21.276px]">{item.gender}</p>
            <p className="leading-[21.276px] break-words">{item.color}</p>
            <p className="leading-[21.276px]">{item.size}</p>
            <p className="leading-[21.276px]">Rp {item.price.toLocaleString("id-ID")}</p>
          </div>
        </div>

        <div className="flex flex-col gap-[10px] items-end sm:ml-auto mt-2 sm:mt-0">
          {isFinished ? (
            <div className="bg-white border-[0.5px] border-primary-300 rounded-[3px] w-[41px] h-[37px] flex items-center justify-center">
              <PackageOpen className="w-[30px] h-[30px] text-neutral-1000" />
            </div>
          ) : (
            <div className="w-[41px] h-[37px] flex items-center justify-center">
              <Package className="w-[30px] h-[30px] text-neutral-1000" />
            </div>
          )}
          <div className="flex flex-col gap-[9px] items-end text-right">
            <p className="text-b3 font-bold text-secondary-500 whitespace-nowrap">{item.status}</p>
            <div className="text-b4 text-black whitespace-pre-wrap">
              {item.timestamp.split("\n").map((line, i) => (
                <p key={i} className="leading-[18px]">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
