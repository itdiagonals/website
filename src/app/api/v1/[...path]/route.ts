import type { NextRequest } from 'next/server'

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
])

function getInternalApiUrl() {
  return process.env.INTERNAL_API_URL || 'http://localhost:8080/api/v1'
}

function buildTargetUrl(request: NextRequest, path: string[]) {
  const base = getInternalApiUrl().replace(/\/+$/, '')
  const pathname = path.map(encodeURIComponent).join('/')
  return `${base}/${pathname}${request.nextUrl.search}`
}

function forwardRequestHeaders(request: NextRequest) {
  const headers = new Headers()

  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value)
    }
  })

  return headers
}

function forwardResponseHeaders(source: Headers) {
  const headers = new Headers()

  source.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.append(key, value)
    }
  })

  return headers
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  const targetUrl = buildTargetUrl(request, path)
  const method = request.method.toUpperCase()
  const headers = forwardRequestHeaders(request)

  const init: RequestInit = {
    method,
    headers,
    redirect: 'manual',
    body: method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer(),
  }

  const upstreamResponse = await fetch(targetUrl, init)

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: forwardResponseHeaders(upstreamResponse.headers),
  })
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context)
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context)
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context)
}

export async function OPTIONS(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context)
}
