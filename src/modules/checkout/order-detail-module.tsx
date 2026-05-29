import { Header } from "@/src/components/header-demo";
import { BillDetail, BillItem } from "@/components/checkout/bill-detail";
import { OrderTrackingStepper, TrackingStep } from "@/components/checkout/order-tracking-stepper";
import { PurchaseSidebar } from "@/components/checkout/purchase-sidebar";

interface OrderDetailModuleProps {
  orderId: string;
}

export function OrderDetailModule({ orderId }: OrderDetailModuleProps) {
  const steps: TrackingStep[] = [
    {
      id: "1",
      title: "Order Accepted",
      timestamp: "Pesanan diterima pukul 13.00\nDate",
      status: "completed",
      icon: "check",
    },
    {
      id: "2",
      title: "Order Packaged",
      timestamp: "Pesanan dikemas pukul 14.00\nDate",
      status: "active",
      icon: "package",
    },
    {
      id: "3",
      title: "Order Sent",
      timestamp: "Pesanan dikirim pukul 20.00\nDate",
      status: "pending",
      icon: "truck",
    },
    {
      id: "4",
      title: "Order Finished",
      timestamp: "Pesanan diterima oleh Hani\nDate",
      status: "pending",
      icon: "package-line",
    },
  ];

  const billItems: BillItem[] = [
    { label: "2 Item", value: 400000 },
    { label: "Packing", value: 0 },
    { label: "Pengiriman", value: 20000 },
    { label: "Promo", value: 30000, isDiscount: true },
  ];

  const purchaseItems = [
    {
      id: "p1",
      name: "Jersey Oversize Black System",
      gender: "Pria",
      color: "Biru Navy",
      size: "40 cm",
      price: 200000,
      image: "/blacktee.png",
    },
    {
      id: "p2",
      name: "Jersey Oversize Black System",
      gender: "Pria",
      color: "Biru Navy",
      size: "40 cm",
      price: 200000,
      image: "/bluetee.png",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f3f3f3]">
      <Header />
      <main className="flex-grow">
        <div className="px-4 sm:px-6 md:px-[24px] max-w-[1440px] mx-auto w-full">
          <h1 className="text-h6 font-bold text-black mt-[14px] mb-[14px]">On Going</h1>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2.2fr)_minmax(320px,0.8fr)] gap-6 items-start pb-8">
            <div className="w-full min-w-0 flex flex-col gap-[15px]">
              <h2 className="text-h7 font-bold text-black">Bill</h2>
              <BillDetail
                customerName="Reza"
                orderId={orderId}
                orderDate="11/11/2024"
                items={billItems}
                totalPrice={350000}
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
