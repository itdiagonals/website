import { redirect } from "next/navigation";
import { OrderDetailModule } from "@/modules/checkout/order-detail-module";
import { requireAuth } from '@/src/lib/auth-guard';

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { id: orderId } = await params;

  await requireAuth(orderId ? `/orders/${orderId}` : '/orders');

  if (!orderId || orderId === "undefined") {
    redirect("/profile");
  }

  return (
    <>
      <OrderDetailModule orderId={orderId} />
    </>
  );
}
