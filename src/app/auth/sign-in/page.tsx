import { Suspense } from 'react'

import SignInForm from '@/modules/auth/sign-in/sign-in-form'

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  )
}
