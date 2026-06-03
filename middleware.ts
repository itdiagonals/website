import { NextResponse, type NextRequest } from 'next/server'

const protectedPrefixes = ['/cart', '/profile', '/checkout', '/orders']
const USERS_ME_PATH = '/api/v1/users/me'
const REFRESH_PATH = '/api/v1/auth/refresh'

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

function buildSignInUrl(request: NextRequest) {
  const signInUrl = new URL('/auth/sign-in', request.url)
  signInUrl.searchParams.set(
    'redirect',
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  )
  return signInUrl
}

function buildUpstreamHeaders(request: NextRequest) {
  const headers = new Headers()
  const cookie = request.headers.get('cookie')
  if (cookie) {
    headers.set('cookie', cookie)
  }
  const csrfCookie = request.cookies.get('csrf_token')?.value
  if (csrfCookie) {
    headers.set('X-CSRF-Token', csrfCookie)
  }
  return headers
}

function copyUpstreamCookies(upstream: Response, response: NextResponse) {
  const headerBag = upstream.headers as Headers & { getSetCookie?: () => string[] }
  if (typeof headerBag.getSetCookie === 'function') {
    for (const cookie of headerBag.getSetCookie()) {
      response.headers.append('set-cookie', cookie)
    }
    return
  }
  const raw = upstream.headers.get('set-cookie')
  if (raw) {
    response.headers.append('set-cookie', raw)
  }
}

interface UpstreamAttempt {
  status: number
  ok: boolean
  response?: Response
}

async function callUpstream(
  request: NextRequest,
  path: string,
  init: RequestInit = {},
): Promise<UpstreamAttempt> {
  try {
    const res = await fetch(new URL(path, request.url), {
      ...init,
      headers: buildUpstreamHeaders(request),
      cache: 'no-store',
    })
    return { status: res.status, ok: res.ok, response: res }
  } catch {
    return { status: 0, ok: false }
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!isProtectedPath(pathname)) {
    return NextResponse.next()
  }

  const hasAccess = Boolean(request.cookies.get('access_token')?.value)
  const hasRefresh = Boolean(request.cookies.get('refresh_token')?.value)

  if (!hasAccess && !hasRefresh) {
    return NextResponse.redirect(buildSignInUrl(request))
  }

  const meResult = await callUpstream(request, USERS_ME_PATH, { method: 'GET' })

  if (meResult.ok) {
    return NextResponse.next()
  }

  if (meResult.status === 0 || meResult.status >= 500) {
    return NextResponse.next()
  }

  if (meResult.status === 401 && hasRefresh) {
    const refreshResult = await callUpstream(request, REFRESH_PATH, { method: 'POST' })

    if (refreshResult.ok && refreshResult.response) {
      const response = NextResponse.next()
      copyUpstreamCookies(refreshResult.response, response)
      return response
    }

    if (refreshResult.status === 401) {
      return NextResponse.redirect(buildSignInUrl(request))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/cart/:path*', '/profile/:path*', '/checkout/:path*', '/orders/:path*'],
}
