import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

/** Cliente para Server Components, Server Actions e Route Handlers. */
export async function createClient() {
  const cookieStore = await cookies()
  const { url, publishableKey } = getSupabaseConfig()

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server Components não podem gravar cookies. O middleware renova a
          // sessão e propaga o novo cookie antes que a página seja renderizada.
        }
      },
    },
  })
}
