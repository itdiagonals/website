import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedPrefixes = ['/cart', '/profile', '/checkout', '/orders']

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function hasAuthCookies(request: NextRequest) {
  return Boolean(request.cookies.get('access_token')?.value || request.cookies.get('refresh_token')?.value)
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (!isProtectedPath(pathname)) {
    return NextResponse.next()
  }

  if (hasAuthCookies(request)) {
    return NextResponse.next()
  }

  const signInUrl = new URL('/auth/sign-in', request.url)
  signInUrl.searchParams.set('redirect', `${pathname}${search}`)

  return NextResponse.redirect(signInUrl)
}

export const config = {
  matcher: ['/cart/:path*', '/profile/:path*', '/checkout/:path*', '/orders/:path*'],
}
