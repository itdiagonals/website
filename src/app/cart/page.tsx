import { CartModule } from "@/modules/checkout/cart-module";
import Navbar from "@/src/components/ui/navbar";

export default function CartPage() {
  const mockItems = [
    {
      id: "1",
      productId: 101,
      name: "Jersey Oversize Black System",
      gender: "Pria",
      color: "Biru Navy",
      size: "40 cm",
      price: 200000,
      quantity: 1,
      image: "/blacktee.png",
      checked: true,
    },
    {
      id: "2",
      productId: 102,
      name: "Jersey Oversize",
      gender: "Pria",
      color: "Blue",
      size: "40 cm",
      price: 200000,
      quantity: 1,
      image: "/bluetee.png",
      checked: true,
    }
  ];

  return (
    <>
      <Navbar variant="light" />
      <CartModule initialItems={mockItems} />
    </>
  );
}
