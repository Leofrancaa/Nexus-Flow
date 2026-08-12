import { createClient as createSupabaseClient } from '@/utils/supabase/client'

const API_URL = '/api'

export class LoginError extends Error {}

export const hasActiveSession = async (): Promise<boolean> => {
  try {
    const { data, error } = await createSupabaseClient().auth.getClaims()
    return !error && typeof data?.claims?.sub === 'string'
  } catch {
    return false
  }
}

export const login = async (data: { email: string; senha: string }) => {
  const { error } = await createSupabaseClient().auth.signInWithPassword({
    email: data.email.trim(),
    password: data.senha,
  })
  if (error) throw new LoginError('E-mail ou senha incorretos.')
  return { success: true, message: 'Login realizado com sucesso.' }
}

export const register = async (data: {
  nome: string
  email: string
  senha: string
  inviteCode: string
  aceitouTermos: boolean
}) => {
  const response = await fetch(`${API_URL}/auth/supabase-register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || 'Não foi possível criar a conta.')
  return body
}

export const logout = async (): Promise<void> => {
  await createSupabaseClient().auth.signOut()
}

export const getUserData = async () => {
  const response = await fetch(`${API_URL}/auth/me`)
  if (!response.ok) return null
  const json = await response.json()
  return json.data?.user ?? null
}

export const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  const headers: HeadersInit = isFormData
    ? { ...options.headers }
    : { 'Content-Type': 'application/json', ...options.headers }
  const response = await fetch(endpoint, { ...options, headers })

  if (response.status === 401 && typeof window !== 'undefined') {
    if (!window.location.pathname.startsWith('/login')) window.location.href = '/login'
    return new Promise<Response>(() => {})
  }

  return response
}
