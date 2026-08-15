import { createServerClient } from '@supabase/ssr'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import db from '@/server/db/drizzle'
import { profiles } from '@/server/db/schema'

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'nexusfintool1962@gmail.com'

export interface AuthUser {
  id: string
  nome: string
  email: string
  avatar: string
}

export function isAdmin(user: Pick<AuthUser, 'email'> | null): boolean {
  return Boolean(user && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase())
}

/** Obtém a identidade autenticada exclusivamente a partir da sessão Supabase. */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !publishableKey) return null

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      // A atualização da sessão é responsabilidade do middleware, que também
      // devolve os cookies renovados na resposta.
      setAll: () => undefined,
    },
  })
  const { data, error } = await supabase.auth.getClaims()
  const userId = typeof data?.claims?.sub === 'string' ? data.claims.sub : null
  if (error || !userId) return null

  const [profile] = await db
    .select({
      id: profiles.id,
      nome: profiles.nome,
      email: profiles.email,
      avatar: profiles.avatar,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)

  return profile ?? null
}

export function unauthorizedResponse(message = 'Não autorizado'): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: 401 })
}
