import { Suspense } from 'react'

import OtpForm from '@/modules/auth/forgot-password/otp-form'

export default function OtpPage() {
  return (
    <Suspense>
      <OtpForm />
    </Suspense>
  )
}
