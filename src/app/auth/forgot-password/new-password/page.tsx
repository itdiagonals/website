import { Suspense } from 'react'

import NewPasswordForm from '@/modules/auth/forgot-password/new-password-form'

export default function NewPasswordPage() {
  return (
    <Suspense>
      <NewPasswordForm />
    </Suspense>
  )
}
