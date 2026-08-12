import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next')
  const destination = next?.startsWith('/') ? next : '/dashboard'
  const response = NextResponse.redirect(new URL(destination, url.origin))
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!code || !supabaseUrl || !publishableKey) {
    return NextResponse.redirect(new URL('/login?error=auth_callback', url.origin))
  }

  const supabase = createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return NextResponse.redirect(new URL('/login?error=auth_callback', url.origin))

  return response
}
