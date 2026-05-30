"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CartItemCard, CartItem } from "@/components/checkout/cart-item-card";
import { OrderSummary } from "@/components/checkout/order-summary";
import { cn } from "@/lib/utils";
import { api, clearApiCache, type CartItem as ApiCartItem } from "@/lib/api";

function mapApiCartItems(backendItems: ApiCartItem[]): CartItem[] {
  return backendItems.map((item) => ({
    id: String(item.id),
    productId: item.product_id,
    name: item.product_name,
    gender: item.gender,
    color: item.selected_color_name,
    size: item.selected_size,
    price: item.base_price,
    quantity: item.quantity,
    image: item.image_url,
    checked: true,
  }));
}

export function CartModule() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshCart = async () => {
    try {
      const cart = await api.cart.get();
      setItems(mapApiCartItems(cart.items));
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshCart();
  }, []);

  const handleUpdateQuantity = async (id: string, quantity: number) => {
    const prevItem = items.find((i) => i.id === id);
    const prevQuantity = prevItem?.quantity ?? quantity;

    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );

    try {
      await api.cart.updateQuantity({
        cart_item_id: Number(id),
        quantity,
      });
      clearApiCache();
      await refreshCart();
    } catch (error) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, quantity: prevQuantity } : item
        )
      );
      console.error("Failed to update quantity:", error);
      alert("Gagal memperbarui jumlah. Silakan coba lagi.");
    }
  };

  const handleRemove = async (id: string) => {
    const prevItems = [...items];

    setItems((prev) => prev.filter((item) => item.id !== id));

    try {
      await api.cart.remove({ cart_item_id: Number(id) });
      clearApiCache();
      await refreshCart();
    } catch (error) {
      setItems(prevItems);
      console.error("Failed to remove item:", error);
      alert("Gagal menghapus item. Silakan coba lagi.");
    }
  };

  const handleToggleCheck = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleCheckout = () => {
    const checkedItems = items.filter((i) => i.checked);
    if (checkedItems.length === 0) {
      alert("Pilih minimal 1 item untuk checkout.");
      return;
    }
    router.push("/checkout");
  };

  const checkedItems = items.filter((item) => item.checked);
  const totalItems = checkedItems.reduce((acc, item) => acc + item.quantity, 0);
  const itemSubtotal = checkedItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const promoDiscount = totalItems > 0 ? 10000 : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f3f3f3]">
        <main className="flex-grow flex items-center justify-center">
          <p className="text-b2 text-neutral-500">Loading cart...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f3f3f3]">
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
