import { CartModule } from "@/modules/checkout/cart-module";
import { requireAuth } from '@/src/lib/auth-guard';

export default async function CartPage() {
  await requireAuth('/cart');

  return (
    <>
      <CartModule />
    </>
  );
}
