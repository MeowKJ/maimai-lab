import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const LXNS_BASE_API = 'https://maimai.lxns.net/api/v0/maimai'
const CACHE_HEADER = 'no-store'

function getLxnsApiKey(): string {
  // Prefer a server-only key; keep NEXT_PUBLIC fallback for backward compatibility.
  return (
    process.env.MAIMAI_LXNS_API_KEY
    ?? process.env.LXNS_API_SECRET
    ?? process.env.NEXT_PUBLIC_MAIMAI_LXNS_API_KEY
    ?? ''
  ).trim()
}

function buildUpstreamUrl(pathSegments: string[], searchParams: URLSearchParams): string {
  const path = pathSegments.map(encodeURIComponent).join('/')
  const query = searchParams.toString()
  return query ? `${LXNS_BASE_API}/${path}?${query}` : `${LXNS_BASE_API}/${path}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const apiKey = getLxnsApiKey()
  if (!apiKey) {
    return NextResponse.json(
      { code: 500, success: false, message: 'LXNS API key is not configured' },
      { status: 500, headers: { 'Cache-Control': CACHE_HEADER } }
    )
  }

  const { path } = await params
  if (!path?.length) {
    return NextResponse.json(
      { code: 400, success: false, message: 'Missing LXNS API path' },
      { status: 400, headers: { 'Cache-Control': CACHE_HEADER } }
    )
  }

  const upstreamUrl = buildUpstreamUrl(path, request.nextUrl.searchParams)

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        Authorization: apiKey,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    })

    const body = await upstream.text()
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'application/json; charset=utf-8',
        'Cache-Control': CACHE_HEADER,
      },
    })
  } catch {
    return NextResponse.json(
      { code: 502, success: false, message: 'Failed to reach LXNS upstream API' },
      { status: 502, headers: { 'Cache-Control': CACHE_HEADER } }
    )
  }
}
