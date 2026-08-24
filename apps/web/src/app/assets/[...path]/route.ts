import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const LXNS_ASSETS = 'https://assets.lxns.net/maimai'
const LXNS_MAIMAI = 'https://maimai.lxns.net/assets/maimai'

function getUpstreamUrl(segments: string[]): string | null {
  const [category, ...rest] = segments
  if (rest.length !== 1) return null
  const param = rest[0]
  const encodedParam = encodeURIComponent(param)

  switch (category) {
    case 'cover': {
      const id = Number.parseInt(param, 10)
      return Number.isFinite(id) ? `${LXNS_ASSETS}/jacket/${id % 10000}.png` : null
    }
    case 'plate':
      return `${LXNS_ASSETS}/plate/${encodedParam}.png`
    case 'avatar':
      return `${LXNS_ASSETS}/icon/${encodedParam}.png`
    case 'rank':
      return `${LXNS_MAIMAI}/music_rank/${encodedParam}.webp`
    case 'badge':
      return `${LXNS_MAIMAI}/music_icon/${encodedParam}.webp`
    case 'course_rank':
      return `${LXNS_MAIMAI}/course_rank/${encodedParam}.webp`
    case 'class_rank':
      return `${LXNS_MAIMAI}/class_rank/${encodedParam}.webp`
    case 'images':
      // The old fallback illustrations were third-party-hosted. Use a stable
      // LXNS icon for the remaining generic-image compatibility endpoint.
      return `${LXNS_ASSETS}/icon/1.png`
    default:
      return null
  }
}
const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
  'CDN-Cache-Control': 'public, max-age=604800',
  'Vercel-CDN-Cache-Control': 'public, max-age=604800',
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const upstreamUrl = getUpstreamUrl(path)
  if (!upstreamUrl) {
    return new NextResponse('Not Found', { status: 404 })
  }

  let upstreamRes: Response
  try {
    upstreamRes = await fetch(upstreamUrl, { signal: AbortSignal.timeout(8000) })
    if (!upstreamRes.ok) {
      return new NextResponse('Not Found', { status: 404 })
    }
  } catch {
    return new NextResponse('Upstream fetch failed', { status: 502 })
  }

  const contentType = upstreamRes.headers.get('content-type') ?? 'image/png'
  const data = await upstreamRes.arrayBuffer()

  return new Response(data, {
    headers: { 'Content-Type': contentType, ...CACHE_HEADERS },
  })
}
