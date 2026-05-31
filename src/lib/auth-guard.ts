import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function requireAuth(redirectTarget: string) {
  const cookieStore = await cookies()
  const hasSession = Boolean(
    cookieStore.get('access_token')?.value ||
      cookieStore.get('refresh_token')?.value,
  )

  if (hasSession) {
    return
  }

  redirect(`/auth/sign-in?redirect=${encodeURIComponent(redirectTarget)}`)
}
