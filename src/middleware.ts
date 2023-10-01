import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME, seal } from './app/session';

export const runtime = 'nodejs'
 
export async function middleware(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  if (code) {
    const form = new FormData()
    form.append("code", code)
    form.append("client_id", process.env.CLIENT_ID!)
    form.append("client_secret", process.env.CLIENT_SECRET!)
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: "POST",
      body: form,
    })
    const json = await response.json() as {
      authed_user: {
        access_token: string
      },
    }
    if (! response.ok) {
      throw Error('oauth access api failed')
    }
    if (response.status !== 200) {
      throw Error('oauth access api failed')
    }
    const nextResponse = NextResponse.redirect(new URL("/", request.url))
    const sealed = await seal({token: json.authed_user.access_token})
    nextResponse.cookies.set(SESSION_COOKIE_NAME, sealed)
    return nextResponse

  }
  const cookie = request.cookies.get(SESSION_COOKIE_NAME);
  if (cookie === undefined) {
    const scopes = [
      'channels:read',
      'channels:history',
      'users:read',
      'search:read',
    ]
    const redirectUrl = `https://${request.nextUrl.hostname}/`
    return NextResponse.redirect(new URL(`https://slack.com/oauth/v2/authorize?user_scope=${scopes.join(',')}&client_id=${process.env.CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUrl)}`))
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/:path*'],
}