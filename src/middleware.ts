import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE_NAME = 'slack_peek3_session';
 
export async function middleware(request: NextRequest) {
  console.log('middleware', request.url)
  if (request.nextUrl.searchParams.get('code') || request.url !== "/") {
    return NextResponse.next();
  }
  const cookie = request.cookies.get(SESSION_COOKIE_NAME);
  if (cookie === undefined) {
    return NextResponse.redirect(new URL(`https://slack.com/oauth/v2/authorize?scope=channels:read&client_id=${process.env.CLIENT_ID}`, request.url))
  }
}

export const config = {
  matcher: ['/', '/:path*'],
}