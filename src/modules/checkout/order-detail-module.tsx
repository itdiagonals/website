"use client";

import { useEffect, useState } from "react";
import { BillDetail, BillItem } from "@/components/checkout/bill-detail";
import { OrderTrackingStepper, TrackingStep } from "@/components/checkout/order-tracking-stepper";
import { PurchaseSidebar } from "@/components/checkout/purchase-sidebar";
import { api, type TransactionHistoryDetail, type Product as BackendProduct } from "@/lib/api";

interface OrderDetailModuleProps {
  orderId: string;
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapShippingStatusToSteps(status: string, createdAt: string): TrackingStep[] {
  const created = formatDateTime(createdAt);
  const steps: TrackingStep[] = [
    {
      id: "1",
      title: "Order Accepted",
      timestamp: `Pesanan diterima\n${created}`,
      status: "completed",
      icon: "check",
    },
    {
      id: "2",
      title: "Order Packaged",
      timestamp: "Pesanan dikemas\nDate",
      status: "pending",
      icon: "package",
    },
    {
      id: "3",
      title: "Order Sent",
      timestamp: "Pesanan dikirim\nDate",
      status: "pending",
      icon: "truck",
    },
    {
      id: "4",
      title: "Order Finished",
      timestamp: "Pesanan diterima\nDate",
      status: "pending",
      icon: "package-line",
    },
  ];

  const s = status.toLowerCase();
  if (s === "delivered" || s === "completed") {
    steps[1].status = "completed";
    steps[2].status = "completed";
    steps[3].status = "completed";
  } else if (s === "shipped" || s === "in_transit") {
    steps[1].status = "completed";
    steps[2].status = "active";
    steps[3].status = "pending";
  } else if (s === "packaged" || s === "ready") {
    steps[1].status = "active";
    steps[2].status = "pending";
    steps[3].status = "pending";
  } else if (s === "accepted" || s === "processing") {
    steps[1].status = "active";
  } else {
    steps[0].status = "active";
  }

  return steps;
}

export function OrderDetailModule({ orderId }: OrderDetailModuleProps) {
  const [order, setOrder] = useState<TransactionHistoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [productNames, setProductNames] = useState<Map<number, { name: string; image: string }>>(new Map());

  useEffect(() => {
    api.transactions
      .getByOrderId(orderId)
      .then(async (data) => {
        setOrder(data);
        const productIds = [...new Set(data.items.map((item) => item.product_id))];
        const nameMap = new Map<number, { name: string; image: string }>();
        await Promise.all(
          productIds.map(async (pid) => {
            try {
              const product: BackendProduct = await api.products.getById(pid);
              nameMap.set(pid, { name: product.name, image: product.cover_image?.url ?? "" });
            } catch {
              nameMap.set(pid, { name: `Product #${pid}`, image: "" });
            }
          })
        );
        setProductNames(nameMap);
      })
      .catch((err) => {
        console.error("Failed to fetch order:", err);
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f3f3f3]">
        <main className="flex-grow flex items-center justify-center">
          <p className="text-b2 text-neutral-500">Loading order...</p>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f3f3f3]">
        <main className="flex-grow flex items-center justify-center">
          <p className="text-b2 text-neutral-500">Order not found.</p>
        </main>
      </div>
    );
  }

  const billItems: BillItem[] = [
    {
      label: `${order.items.reduce((sum, item) => sum + item.quantity, 0)} Item`,
      value: order.items.reduce((sum, item) => sum + item.subtotal, 0),
    },
    { label: "Packing", value: 0 },
    { label: "Pengiriman", value: order.shipping_cost },
    { label: "Promo", value: 0, isDiscount: true },
  ];

  const purchaseItems = order.items.map((item) => {
    const productInfo = productNames.get(item.product_id);
    return {
      id: String(item.id),
      name: productInfo?.name ?? `Product #${item.product_id}`,
      gender: "-",
      color: item.selected_color_name,
      size: item.selected_size,
      price: item.price,
      image: productInfo?.image || "/products/similar-1.png",
    };
  });

  const steps = mapShippingStatusToSteps(order.shipping_status, order.created_at);
  const totalPrice = order.total_amount;

  return (
    <div className="min-h-screen flex flex-col bg-[#f3f3f3]">
      <main className="flex-grow">
        <div className="px-4 sm:px-6 md:px-[24px] max-w-[1440px] mx-auto w-full">
          <h1 className="text-h6 font-bold text-black mt-[14px] mb-[14px]">On Going</h1>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2.2fr)_minmax(320px,0.8fr)] gap-6 items-start pb-8">
            <div className="w-full min-w-0 flex flex-col gap-[15px]">
              <h2 className="text-h7 font-bold text-black">Bill</h2>
              <BillDetail
                customerName={order.shipping_address.recipient_name}
                orderId={order.order_id}
                orderDate={new Date(order.created_at).toLocaleDateString("id-ID")}
                items={billItems}
                totalPrice={totalPrice}
              />

              <h2 className="text-h7 font-bold text-black">Order Tracking</h2>
              <OrderTrackingStepper steps={steps} />
            </div>

            <div className="w-full min-w-0 xl:max-w-[360px] xl:justify-self-end flex flex-col gap-[15px]">
              <h2 className="text-h7 font-bold text-black">Purchase</h2>
              <PurchaseSidebar items={purchaseItems} showTitle={false} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
