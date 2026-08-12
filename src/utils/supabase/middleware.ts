import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !publishableKey) {
    throw new Error(
      'As variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY são obrigatórias.'
    )
  }

  return { url, publishableKey }
}

/**
 * Renova a sessão autenticada e envia os cookies atualizados de volta ao
 * navegador. A proteção de rotas será conectada a esta função na migração do
 * login legado para evitar dois sistemas de sessão em paralelo.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const { url, publishableKey } = getSupabaseConfig()

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  return { response, claims }
}
