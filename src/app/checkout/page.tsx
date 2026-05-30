import Navbar from "@/components/ui/navbar";
import { CheckoutModule } from "@/modules/checkout/checkout-module";

export default function CheckoutPage() {
  return (
    <>
      <Navbar variant="light" />
      <CheckoutModule />
    </>
  );
}
