import { Suspense } from 'react'

import VerifyEmailForm from '@/modules/auth/verify-email/verify-email-form'

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  )
}
