"use client";

import { useState } from "react";
import { CartItemCard, CartItem } from "@/components/checkout/cart-item-card";
import { OrderSummary } from "@/components/checkout/order-summary";
import { cn } from "@/lib/utils";

interface CartModuleProps {
  initialItems: CartItem[];
}

export function CartModule({ initialItems }: CartModuleProps) {
  const [items, setItems] = useState<CartItem[]>(initialItems);

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleCheck = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleCheckout = () => {
    console.log("Proceeding to checkout with items:", items.filter(i => i.checked));
  };

  const checkedItems = items.filter((item) => item.checked);
  const totalItems = checkedItems.reduce((acc, item) => acc + item.quantity, 0);
  const itemSubtotal = checkedItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const promoDiscount = totalItems > 0 ? 10000 : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#f3f3f3] pt-20">
      <main className="flex-grow pb-20">
        <div className="px-4 sm:px-6 md:px-[24px] max-w-[1440px] mx-auto w-full">
          <h1 className="text-h6 font-bold text-black mt-[14px] mb-[14px]">
            Cart
          </h1>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-8 items-start">
            <div className="w-full min-w-0">
              {items.length > 0 ? (
                <div className="bg-white border border-primary-100 rounded-[10px] overflow-hidden">
                  {items.map((item, idx) => (
                    <CartItemCard
                      key={item.id}
                      item={item}
                      onUpdateQuantity={handleUpdateQuantity}
                      onRemove={handleRemove}
                      onToggleCheck={handleToggleCheck}
                      className={cn(
                        idx === items.length - 1 && "border-b-0"
                      )}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-white border border-primary-100 rounded-[10px] text-center text-neutral-500">
                  Your cart is empty.
                </div>
              )}
            </div>

            <div className="w-full min-w-0 xl:max-w-[420px] xl:justify-self-end">
              <OrderSummary
                totalItems={totalItems}
                itemSubtotal={itemSubtotal}
                promoDiscount={promoDiscount}
                onCheckout={handleCheckout}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
