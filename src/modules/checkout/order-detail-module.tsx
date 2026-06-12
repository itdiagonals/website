"use client";

import { useEffect, useState } from "react";
import { BillDetail, BillItem } from "@/components/checkout/bill-detail";
import { OrderTrackingStepper } from "@/components/checkout/order-tracking-stepper";
import { PurchaseSidebar } from "@/components/checkout/purchase-sidebar";
import { api, clearApiCache, type TransactionHistoryDetail, type TransactionTrackingData, type Product as BackendProduct } from "@/lib/api";
import { buildOrderTrackingSteps, getOrderCardPresentation } from "./order-status";

interface OrderDetailModuleProps {
  orderId: string;
}

function formatTrackingDate(dateString?: string): string {
  if (!dateString) {
    return "Date";
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderDetailModule({ orderId }: OrderDetailModuleProps) {
  const [order, setOrder] = useState<TransactionHistoryDetail | null>(null);
  const [tracking, setTracking] = useState<TransactionTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [productNames, setProductNames] = useState<Map<number, { name: string; image: string }>>(new Map());

  useEffect(() => {
    api.transactions
      .getByOrderId(orderId)
      .then(async (data) => {
        setOrder(data);

        if (data.status === "paid" && data.tracking_number) {
          try {
            const trackingData = await api.transactions.getTracking(orderId, true);
            setTracking(trackingData);
            setOrder((current) =>
              current
                ? {
                    ...current,
                    shipping_status: trackingData.shipping_status || current.shipping_status,
                    tracking_number: trackingData.tracking_number || current.tracking_number,
                  }
                : current
            );
            clearApiCache();
          } catch (trackingError) {
            console.error("Failed to fetch tracking:", trackingError);
          }
        } else {
          setTracking(null);
        }

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
      image: productInfo?.image || "/products/similar-1.webp",
    };
  });

  const steps = buildOrderTrackingSteps(order, tracking);
  const totalPrice = order.total_amount;
  const presentation = getOrderCardPresentation(order.status, order.shipping_status);
  const trackingEvents = tracking?.events || [];

  return (
    <div className="min-h-screen flex flex-col bg-[#f3f3f3]">
      <main className="flex-grow">
        <div className="px-4 sm:px-6 md:px-[24px] max-w-[1440px] mx-auto w-full">
          <h1 className="text-h6 font-bold text-black mt-[14px] mb-[14px]">Order Detail</h1>

          <div className="mb-6 rounded-[10px] border border-primary-100 bg-white p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-b3 uppercase tracking-[0.08em] text-neutral-500">Current status</p>
                <h2 className="mt-1 text-h7 font-bold text-black">{presentation.label}</h2>
                <p className="mt-1 text-b2 text-neutral-600">{presentation.detail}</p>
              </div>
              <div className="space-y-2 text-b2 text-neutral-600 sm:text-right">
                <p>Payment: <span className="font-semibold text-black">{order.status}</span></p>
                <p>Fulfillment: <span className="font-semibold text-black">{tracking?.shipping_status || order.shipping_status}</span></p>
                {tracking?.tracking_number && (
                  <p>Waybill: <span className="font-semibold text-black">{tracking.tracking_number}</span></p>
                )}
              </div>
            </div>
            {tracking?.tracking_link && (
              <div className="mt-4">
                <a
                  href={tracking.tracking_link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-[8px] border border-primary-200 px-4 py-2 text-b2 font-semibold text-primary-500 hover:bg-primary-100/20"
                >
                  Track via Biteship
                </a>
              </div>
            )}
          </div>

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

              {order.notes && (
                <div className="rounded-[10px] border border-primary-100 bg-white p-4 sm:p-5">
                  <p className="text-b3 uppercase tracking-[0.08em] text-neutral-500">Catatan Pesanan</p>
                  <p className="mt-1 text-b2 text-neutral-800 whitespace-pre-wrap">{order.notes}</p>
                </div>
              )}

              <h2 className="text-h7 font-bold text-black">Order Tracking</h2>
              <OrderTrackingStepper steps={steps} />

              {trackingEvents.length > 0 && (
                <div className="rounded-[10px] border border-primary-100 bg-white p-4 sm:p-6">
                  <h3 className="text-b1 font-semibold text-black mb-4">Tracking Updates</h3>
                  <div className="space-y-4">
                    {trackingEvents.map((event, index) => (
                      <div key={`${event.status || "event"}-${event.updated_at || index}`} className="border-l-2 border-primary-100 pl-4">
                        <p className="text-b2 font-semibold text-black">{event.status || "Update"}</p>
                        <p className="text-b2 text-neutral-600">{event.description || event.note || "Status updated"}</p>
                        <p className="text-b3 text-neutral-500 mt-1">{formatTrackingDate(event.updated_at)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
