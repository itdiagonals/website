import { OrderDetailModule } from "@/modules/checkout/order-detail-module";
import Navbar from "@/src/components/ui/navbar";

interface OrderPageProps {
  params: {
    id: string;
  };
}

export default function OrderPage({ params }: OrderPageProps) {
  return (
    <>
      <Navbar variant="light" />
      <OrderDetailModule orderId={params.id} />
    </>
  );
}
