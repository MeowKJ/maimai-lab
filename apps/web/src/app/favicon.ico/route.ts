import { NextResponse, type NextRequest } from 'next/server'

export const runtime = 'edge'

export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/assets/images/normal', request.url), 307)
}

