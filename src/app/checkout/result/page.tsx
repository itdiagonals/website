"use client";

import { Suspense } from "react";
import CheckoutResultPage from "./checkout-result-page";

export default function CheckoutResultWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f3f3f3]">
        <p className="text-b2 text-neutral-500">Loading...</p>
      </div>
    }>
      <CheckoutResultPage />
    </Suspense>
  );
}
