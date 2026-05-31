"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CartItemCard, CartItem } from "@/components/checkout/cart-item-card";
import { OrderSummary } from "@/components/checkout/order-summary";
import { cn } from "@/lib/utils";
import { ApiError, api, clearApiCache, type CartItem as ApiCartItem } from "@/lib/api";

function getFriendlyCartErrorMessage(error: unknown, itemName?: string) {
  if (error instanceof ApiError) {
    const stockMatch = error.message.match(/only\s+(\d+)\s+item/i);
    if (stockMatch) {
      const available = Number(stockMatch[1]);
      return `${itemName || "Produk ini"} hanya tersisa ${available} item untuk varian yang dipilih.`;
    }
    return error.message;
  }

  return "Gagal memperbarui jumlah item. Silakan coba lagi.";
}

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
    availableStock: item.available_stock,
    stockSufficient: item.stock_sufficient,
    stockMessage: item.stock_message,
    isUpdating: false,
    errorMessage: "",
  }));
}

export function CartModule() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

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
    if (!prevItem) {
      return;
    }

    const prevQuantity = prevItem?.quantity ?? quantity;
    const maxAllowed = Math.max(prevItem.availableStock ?? prevItem.quantity, 1);

    if (quantity > maxAllowed) {
      const message = `${prevItem.name} hanya tersisa ${maxAllowed} item untuk varian ${prevItem.color}, ${prevItem.size}.`;
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, errorMessage: message } : item
        )
      );
      setPageMessage(message);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity, isUpdating: true, errorMessage: "" }
          : item
      )
    );
    setPageMessage(null);

    try {
      await api.cart.updateQuantity({
        cart_item_id: Number(id),
        quantity,
      });
      clearApiCache();
      await refreshCart();
    } catch (error) {
      const message = getFriendlyCartErrorMessage(error, prevItem.name);
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, quantity: prevQuantity, isUpdating: false, errorMessage: message }
            : item
        )
      );
      console.error("Failed to update quantity:", error);
      setPageMessage(message);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isUpdating: false, errorMessage: "" } : item
      )
    );
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
      setPageMessage("Gagal menghapus item dari keranjang. Silakan coba lagi.");
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
      setPageMessage("Pilih minimal 1 item untuk checkout.");
      return;
    }

    const insufficientItem = checkedItems.find(
      (item) => !item.stockSufficient || item.quantity > Math.max(item.availableStock ?? item.quantity, 0)
    );
    if (insufficientItem) {
      setPageMessage(
        insufficientItem.stockMessage || `${insufficientItem.name} melebihi stok tersedia. Sesuaikan jumlah dulu sebelum checkout.`
      );
      return;
    }

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('checkout_notes', notes.trim());
    }

    router.push("/checkout");
  };

  const checkedItems = items.filter((item) => item.checked);
  const totalItems = checkedItems.reduce((acc, item) => acc + item.quantity, 0);
  const itemSubtotal = checkedItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const promoDiscount = totalItems > 0 ? 0 : 0;

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

          {pageMessage && (
            <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-b2 text-red-700">
              {pageMessage}
            </div>
          )}

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
                notes={notes}
                onNotesChange={setNotes}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
