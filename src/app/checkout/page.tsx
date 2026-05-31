import { CheckoutModule } from "@/modules/checkout/checkout-module";
import { requireAuth } from '@/src/lib/auth-guard';

export default async function CheckoutPage() {
  await requireAuth('/checkout');

  return (
    <>
      <CheckoutModule />
    </>
  );
}
