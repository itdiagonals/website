import { OrderDetailModule } from "@/modules/checkout/order-detail-module";

interface OrderPageProps {
  params: {
    id: string;
  };
}

export default function OrderPage({ params }: OrderPageProps) {
  return <OrderDetailModule orderId={params.id} />;
}
