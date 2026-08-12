import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PROTECTED_ROUTES = [
  '/dashboard', '/atividades', '/cartoes', '/assistente', '/perfil',
  '/categorias', '/limites', '/planos', '/configuracoes', '/manual',
  // Endereços antigos que hoje só redirecionam — continuam protegidos para o
  // redirect não vazar a existência da rota a quem não está logado.
  '/receitas', '/despesas'
]
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password']
const COOKIE_NAME = 'nexus_token'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(COOKIE_NAME)?.value

  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r))
  const isPublic = PUBLIC_ROUTES.some(r => pathname.startsWith(r))

  let isValidToken = false
  if (token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET))
      isValidToken = true
    } catch {
      isValidToken = false
    }
  }

  if (isProtected && !isValidToken) {
    const response = NextResponse.redirect(new URL('/login', request.url))
    if (token) response.cookies.delete(COOKIE_NAME)
    return response
  }

  if (isPublic && isValidToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Não existe página em `/`: a landing foi removida e quem responde pela raiz
  // é este redirect. Logado cai no dashboard, deslogado cai no login.
  if (pathname === '/') {
    return NextResponse.redirect(new URL(isValidToken ? '/dashboard' : '/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|offline.html|public).*)',
  ],
}
