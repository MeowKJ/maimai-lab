import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  try {
    const res = await fetch('https://www.yuzuchan.moe/api/maimaidx/maimaidxalias', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; maimai-lab)',
        Accept: 'application/json',
        Referer: 'https://yuzuchan.moe/',
      },
    })
    if (!res.ok) {
      // Yuzu is blocking — return empty so search still works via title/artist/ID
      return NextResponse.json({ content: [] }, {
        headers: { 'Cache-Control': 'public, max-age=300' },
      })
    }
    const data = await res.json()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=21600, stale-while-revalidate=3600' },
    })
  } catch {
    return NextResponse.json({ content: [] }, {
      headers: { 'Cache-Control': 'public, max-age=300' },
    })
  }
}
