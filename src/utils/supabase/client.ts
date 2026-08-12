import { createBrowserClient } from '@supabase/ssr'

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

/** Cliente para componentes executados no navegador. */
export function createClient() {
  const { url, publishableKey } = getSupabaseConfig()

  return createBrowserClient(url, publishableKey)
}
