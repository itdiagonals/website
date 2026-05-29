import Image from "next/image";
import { cn } from "@/lib/utils";

interface PurchaseItem {
  id: string;
  name: string;
  gender: string;
  color: string;
  size: string;
  price: number;
  image: string;
}

interface PurchaseSidebarProps {
  items: PurchaseItem[];
  showTitle?: boolean;
  className?: string;
}

export function PurchaseSidebar({ items, showTitle = true, className }: PurchaseSidebarProps) {
  return (
    <div className={cn("w-full", className)}>
      {showTitle && (
        <h2
          className="font-semibold text-[20px] leading-[32px] text-black ml-[2px]"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          Purchase
        </h2>
      )}

      <div className="flex flex-col">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className={cn(
              "bg-white border border-primary-100 min-h-[192px] p-3 sm:p-4",
              idx === 0 && "rounded-t-[10px]",
              idx === items.length - 1 && "rounded-b-[10px]"
            )}
          >
            <div className="flex gap-3 sm:gap-4">
              <div className="relative w-[96px] h-[120px] sm:w-[113.887px] sm:h-[142.358px] shrink-0">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="114px"
                />
              </div>

              <div className="flex flex-col gap-[0.886px] text-black min-w-0">
                <p
                  className="font-medium text-[12.411px] leading-[21.276px] break-words"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  {item.name}
                </p>
                <div
                  className="text-[10.638px] leading-[0]"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  <p className="leading-[21.276px]">{item.gender}</p>
                  <p className="leading-[21.276px] break-words">{item.color}</p>
                  <p className="leading-[21.276px]">{item.size}</p>
                  <p className="leading-[21.276px]">
                    Rp {item.price.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
