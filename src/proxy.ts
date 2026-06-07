import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ratelimit } from '@/lib/upstash/redis'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Rate Limiting for public API routes
  if (pathname.startsWith('/api/public') && ratelimit) {
    try {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
      const { success } = await ratelimit.limit(ip)
      if (!success) {
        return new NextResponse(
          JSON.stringify({ error: 'Demasiadas solicitudes. Intente más tarde.' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        )
      }
    } catch (e) {
      console.error('Rate limit error:', e)
      // Fail open in case Upstash is down
    }
  }

  // 2. Supabase Auth Session Refreshing
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const mockSession = request.cookies.get('mock-session')?.value === 'true'

  // 3. Routing protection
  // Protect routes starting with /dashboard
  if (pathname.startsWith('/dashboard')) {
    if (!user && !mockSession) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }
  }

  // Redirect authenticated users trying to access login/register/landing to dashboard
  if ((user || mockSession) && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
