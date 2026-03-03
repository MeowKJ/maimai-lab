import { type NextRequest, NextResponse } from 'next/server'

// Edge Runtime: runs at Vercel Edge Network globally, ultra-low latency
export const runtime = 'edge'

// ============================================================
// Upstream URL mapper (port of image-cache/mapper.js)
// ============================================================
const LXNS_ASSETS = 'https://assets.lxns.net/maimai'
const LXNS_MAIMAI = 'https://maimai.lxns.net/assets/maimai'

const IMAGE_RATING_LINKS = [
  'https://pic.imgdb.cn/item/66a7a673d9c307b7e941bbd8.png',
  'https://pic.imgdb.cn/item/66a7a673d9c307b7e941bbe5.png',
  'https://pic.imgdb.cn/item/66a7a673d9c307b7e941bbef.png',
  'https://pic.imgdb.cn/item/66a7a673d9c307b7e941bc03.png',
  'https://pic.imgdb.cn/item/66a7a673d9c307b7e941bc11.png',
  'https://pic.imgdb.cn/item/66a7a697d9c307b7e941daa9.png',
  'https://pic.imgdb.cn/item/66a7a697d9c307b7e941dab9.png',
  'https://pic.imgdb.cn/item/66a7a697d9c307b7e941dac5.png',
  'https://pic.imgdb.cn/item/66a7a697d9c307b7e941dad0.png',
  'https://pic.imgdb.cn/item/66a7a697d9c307b7e941dadc.png',
  'https://pic.imgdb.cn/item/66a7a6b3d9c307b7e941fc1d.png',
]

const TROPHY_URLS: Record<string, string> = {
  normal:  'https://i0.imgs.ovh/2024/01/16/h0zYT.png',
  bronze:  'https://i0.imgs.ovh/2024/01/16/h0JSp.png',
  silver:  'https://i0.imgs.ovh/2024/01/16/h0jhl.png',
  gold:    'https://i0.imgs.ovh/2024/01/16/h01HR.png',
  rainbow: 'https://i0.imgs.ovh/2024/01/16/h0i2u.png',
}

const SPECIAL_IMAGES: Record<string, string> = {
  fish:   'https://www.diving-fish.com/favicon.ico',
  lxns:   'https://maimai.lxns.net/favicon.ico',
  error:  'https://pic.imgdb.cn/item/66a7a5e0d9c307b7e9413d8e.png',
  normal: 'https://pic.imgdb.cn/item/66a7a58cd9c307b7e940eec6.png',
  avatar: 'https://pic.imgdb.cn/item/66a79930d9c307b7e935f364.png',
  dila:   'https://pic.imgdb.cn/item/66a7a54ad9c307b7e940b82e.png',
}

function getUpstreamUrl(segments: string[]): string | null {
  const [category, ...rest] = segments
  const param = rest.join('/')
  const legacyOrigin = process.env.MAIMAI_LEGACY_ASSET_ORIGIN

  switch (category) {
    case 'cover':
      return `${LXNS_ASSETS}/jacket/${parseInt(param) % 10000}.png`
    case 'plate':
      return `${LXNS_ASSETS}/plate/${param}.png`
    case 'avatar':
      return `${LXNS_ASSETS}/icon/${param}.png`
    case 'rank':
      return `${LXNS_MAIMAI}/music_rank/${param}.webp`
    case 'badge':
      return `${LXNS_MAIMAI}/music_icon/${param}.webp`
    case 'course_rank':
      return `${LXNS_MAIMAI}/course_rank/${param}.webp`
    case 'class_rank':
      return `${LXNS_MAIMAI}/class_rank/${param}.webp`
    case 'rating': {
      const idx = parseInt(param) - 1
      return IMAGE_RATING_LINKS[idx] ?? null
    }
    case 'trophy':
      return TROPHY_URLS[param] ?? TROPHY_URLS.normal
    case 'bg':
      return `https://maimai.sega.com/assets/img/festival/bg/${param}.png`
    case 'images':
      return SPECIAL_IMAGES[param] ?? (legacyOrigin ? `${legacyOrigin}/assets/images/${param}` : null)
    case 'prism':
      return legacyOrigin ? `${legacyOrigin}/assets/prism/${param}` : null
    case 'ongeki':
      return legacyOrigin ? `${legacyOrigin}/assets/ongeki/${param}` : null
    default:
      return null
  }
}

// ============================================================
// ImageKit helpers (Edge-compatible, no Node.js SDK)
// ============================================================
function getImageKitUrl(imagePath: string): string {
  const endpoint = process.env.MAIMAI_IMAGEKIT_URL_ENDPOINT!
  const basePath = '/app/maimai'
  return `${endpoint}${basePath}${imagePath}`
}

async function uploadToImageKit(imagePath: string, data: ArrayBuffer, contentType: string) {
  const privateKey = process.env.MAIMAI_IMAGEKIT_PRIVATE_KEY
  if (!privateKey) return

  const fileName = imagePath.split('/').pop()!
  const folder = `/app/maimai${imagePath.substring(0, imagePath.lastIndexOf('/'))}`

  // Convert ArrayBuffer to base64 (Edge Runtime has btoa)
  const bytes = new Uint8Array(data)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const base64 = btoa(binary)

  const formData = new FormData()
  formData.append('file', `data:${contentType};base64,${base64}`)
  formData.append('fileName', fileName)
  formData.append('folder', folder)
  formData.append('useUniqueFileName', 'false')

  const authString = btoa(`${privateKey}:`)
  await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    headers: { Authorization: `Basic ${authString}` },
    body: formData,
  })
}

// ============================================================
// Route Handler
// ============================================================
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
  const imagePath = '/' + path.join('/')

  // Step 1: Try ImageKit CDN cache
  if (process.env.MAIMAI_IMAGEKIT_URL_ENDPOINT) {
    try {
      const ikUrl = getImageKitUrl(imagePath)
      const cached = await fetch(ikUrl, { signal: AbortSignal.timeout(4000) })
      if (cached.ok) {
        const data = await cached.arrayBuffer()
        return new Response(data, {
          headers: {
            'Content-Type': cached.headers.get('content-type') ?? 'image/webp',
            ...CACHE_HEADERS,
          },
        })
      }
    } catch {
      // ImageKit miss or timeout — fall through to upstream
    }
  }

  // Step 2: Fetch from upstream source
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

  // Step 3: Upload to ImageKit (fire-and-forget, don't block response)
  if (process.env.MAIMAI_IMAGEKIT_PRIVATE_KEY) {
    uploadToImageKit(imagePath, data, contentType).catch(() => {})
  }

  return new Response(data, {
    headers: { 'Content-Type': contentType, ...CACHE_HEADERS },
  })
}
