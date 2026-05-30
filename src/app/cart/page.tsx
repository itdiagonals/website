import { CartModule } from "@/modules/checkout/cart-module";
import Navbar from "@/src/components/ui/navbar";

export default function CartPage() {
  return (
    <>
      <Navbar variant="light" />
      <CartModule />
    </>
  );
}
