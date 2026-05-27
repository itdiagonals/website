import { Suspense } from 'react'
import SignUpForm from '@/modules/auth/sign-up/sign-up-form'

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  )
}
