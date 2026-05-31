import type { TransactionHistoryDetail, TransactionTrackingData } from "@/lib/api";
import type { TrackingStep } from "@/components/checkout/order-tracking-stepper";

export type OrderCardTone = "default" | "success" | "warning" | "danger";

export type OrderCardPresentation = {
  label: string;
  detail: string;
  bucket: "ongoing" | "closed";
  tone: OrderCardTone;
};

function normalize(value?: string) {
  return (value || "").trim().toLowerCase();
}

function formatDateTime(dateString?: string) {
  if (!dateString) {
    return "Date";
  }

  const value = new Date(dateString);
  if (Number.isNaN(value.getTime())) {
    return "Date";
  }

  return value.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function latestTrackingTimestamp(
  tracking: TransactionTrackingData | null,
  statuses: string[]
) {
  const normalizedStatuses = new Set(statuses.map(normalize));
  const matchingEvents = (tracking?.events || []).filter((event) =>
    normalizedStatuses.has(normalize(event.status))
  );

  if (matchingEvents.length === 0) {
    return "Date";
  }

  return formatDateTime(matchingEvents[matchingEvents.length - 1]?.updated_at);
}

export function getOrderCardPresentation(
  paymentStatus: string,
  shippingStatus: string
): OrderCardPresentation {
  const payment = normalize(paymentStatus);
  const shipping = normalize(shippingStatus);

  if (payment === "pending") {
    return {
      label: "Waiting for Payment",
      detail: "Menunggu pembayaran Anda",
      bucket: "ongoing",
      tone: "warning",
    };
  }

  if (payment === "failed") {
    return {
      label: "Order Cancelled",
      detail: "Pembayaran gagal atau kadaluarsa",
      bucket: "closed",
      tone: "danger",
    };
  }

  if (payment === "refunded") {
    return {
      label: "Refunded",
      detail: "Pesanan telah direfund",
      bucket: "closed",
      tone: "danger",
    };
  }

  switch (shipping) {
    case "delivered":
      return {
        label: "Order Finished",
        detail: "Pesanan telah diterima",
        bucket: "closed",
        tone: "success",
      };
    case "in_transit":
    case "picked":
      return {
        label: "Order Sent",
        detail: "Pesanan sedang dalam perjalanan",
        bucket: "ongoing",
        tone: "default",
      };
    case "booked":
    case "picking_up":
      return {
        label: "Courier Assigned",
        detail: "Kurir sedang menuju pickup",
        bucket: "ongoing",
        tone: "default",
      };
    case "packed":
      return {
        label: "Order Packed",
        detail: "Pesanan selesai dikemas",
        bucket: "ongoing",
        tone: "default",
      };
    case "failed":
      return {
        label: "Delivery Failed",
        detail: "Pengiriman gagal diproses",
        bucket: "closed",
        tone: "danger",
      };
    default:
      return {
        label: "Payment Confirmed",
        detail: "Menunggu pesanan disiapkan",
        bucket: "ongoing",
        tone: "success",
      };
  }
}

export function buildOrderTrackingSteps(
  order: TransactionHistoryDetail,
  tracking: TransactionTrackingData | null
): TrackingStep[] {
  const payment = normalize(order.status);
  const shipping = normalize(order.shipping_status);
  const createdAt = formatDateTime(order.created_at);
  const packedAt = shipping === "packed" ? formatDateTime(order.updated_at) : latestTrackingTimestamp(tracking, ["packed"]);
  const bookedAt = latestTrackingTimestamp(tracking, ["booked", "picking_up"]);
  const sentAt = latestTrackingTimestamp(tracking, ["picked", "in_transit"]);
  const deliveredAt = latestTrackingTimestamp(tracking, ["delivered"]);

  const steps: TrackingStep[] = [
    {
      id: "payment",
      title: payment === "pending" ? "Waiting for Payment" : payment === "failed" ? "Payment Failed" : "Payment Confirmed",
      timestamp:
        payment === "pending"
          ? `Selesaikan pembayaran Anda\n${createdAt}`
          : payment === "failed"
            ? `Pembayaran gagal atau expired\n${formatDateTime(order.updated_at)}`
            : `Pembayaran berhasil diterima\n${createdAt}`,
      status: payment === "failed" ? "failed" : payment === "pending" ? "active" : "completed",
      icon: payment === "failed" ? "x-circle" : "check",
    },
    {
      id: "packed",
      title: "Order Packed",
      timestamp:
        shipping === "packed" || shipping === "booked" || shipping === "picking_up" || shipping === "picked" || shipping === "in_transit" || shipping === "delivered"
          ? `Pesanan selesai dikemas\n${packedAt === "Date" ? formatDateTime(order.updated_at) : packedAt}`
          : "Menunggu tim menyiapkan pesanan\n-",
      status: payment !== "paid" ? "pending" : shipping === "pending" ? "active" : shipping === "failed" ? "failed" : "completed",
      icon: "package",
    },
    {
      id: "shipping",
      title:
        shipping === "booked" || shipping === "picking_up"
          ? "Courier Assigned"
          : "Order Sent",
      timestamp:
        shipping === "booked" || shipping === "picking_up"
          ? `Kurir sedang dijadwalkan pickup\n${bookedAt}`
          : shipping === "picked" || shipping === "in_transit" || shipping === "delivered"
            ? `Pesanan dalam perjalanan\n${sentAt}`
            : payment === "paid"
              ? "Menunggu pengiriman ke kurir\n-"
              : "Belum masuk tahap pengiriman\n-",
      status:
        payment !== "paid"
          ? "pending"
          : shipping === "booked" || shipping === "picking_up" || shipping === "picked" || shipping === "in_transit"
            ? "active"
            : shipping === "delivered"
              ? "completed"
              : shipping === "failed"
                ? "failed"
                : "pending",
      icon: "truck",
    },
    {
      id: "delivered",
      title: shipping === "failed" ? "Delivery Failed" : "Order Finished",
      timestamp:
        shipping === "delivered"
          ? `Pesanan telah diterima\n${deliveredAt}`
          : shipping === "failed"
            ? `Pengiriman gagal diselesaikan\n${formatDateTime(order.updated_at)}`
            : "Pesanan belum diterima\n-",
      status: shipping === "delivered" ? "completed" : shipping === "failed" ? "failed" : "pending",
      icon: shipping === "failed" ? "x-circle" : "package-open",
    },
  ];

  return steps;
}
