import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

const PROTECTED_ROUTES = [
  '/dashboard', '/atividades', '/cartoes', '/assistente', '/perfil',
  '/categorias', '/limites', '/planos', '/configuracoes', '/manual',
  '/receitas', '/despesas',
]
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
  const hasSessionCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token'))

  // As telas de autenticação também funcionam como troca e recuperação de
  // acesso. Elas precisam continuar acessíveis mesmo quando já existe uma
  // sessão válida; apenas as rotas privadas exigem autenticação.
  if (isPublic) return NextResponse.next()
  if (!isProtected && pathname !== '/' && !hasSessionCookie) return NextResponse.next()
  if ((isProtected || pathname === '/') && !hasSessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { response, claims } = await updateSession(request)
  const isAuthenticated = typeof claims?.sub === 'string'

  const redirect = (path: string) => {
    const redirectResponse = NextResponse.redirect(new URL(path, request.url))
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie))
    return redirectResponse
  }

  if (isProtected && !isAuthenticated) return redirect('/login')
  if (pathname === '/') return redirect(isAuthenticated ? '/dashboard' : '/login')

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|offline.html|public).*)'],
}
