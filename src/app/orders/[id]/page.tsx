import { redirect } from "next/navigation";
import { OrderDetailModule } from "@/modules/checkout/order-detail-module";
import Navbar from "@/src/components/ui/navbar";

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { id: orderId } = await params;

  if (!orderId || orderId === "undefined") {
    redirect("/profile");
  }

  return (
    <>
      <Navbar variant="light" />
      <OrderDetailModule orderId={orderId} />
    </>
  );
}
