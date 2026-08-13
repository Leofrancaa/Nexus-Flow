const PLUGGY_API_URL = 'https://api.pluggy.ai'

let cachedApiKey: { value: string; expiresAt: number } | null = null

export class PluggyApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'PluggyApiError'
  }
}

function credentials() {
  const clientId = process.env.PLUGGY_CLIENT_ID
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new PluggyApiError('Integração bancária não configurada.', 503)
  }
  return { clientId, clientSecret }
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function getApiKey(force = false): Promise<string> {
  if (!force && cachedApiKey && cachedApiKey.expiresAt > Date.now() + 60_000) {
    return cachedApiKey.value
  }

  const response = await fetch(`${PLUGGY_API_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials()),
    cache: 'no-store',
  })
  const body = (await readJson(response)) as { apiKey?: string; message?: string } | null
  if (!response.ok || !body?.apiKey) {
    throw new PluggyApiError(body?.message || 'Falha ao autenticar na Pluggy.', response.status, body)
  }

  cachedApiKey = { value: body.apiKey, expiresAt: Date.now() + 115 * 60_000 }
  return body.apiKey
}

export async function pluggyRequest<T>(
  path: string,
  init: RequestInit = {},
  retryAuth = true
): Promise<T> {
  const apiKey = await getApiKey()
  const response = await fetch(`${PLUGGY_API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
      ...init.headers,
    },
    cache: 'no-store',
  })

  if (response.status === 401 && retryAuth) {
    cachedApiKey = null
    await getApiKey(true)
    return pluggyRequest<T>(path, init, false)
  }

  const body = await readJson(response)
  if (!response.ok) {
    const message =
      typeof body === 'object' && body && 'message' in body
        ? String((body as { message: unknown }).message)
        : 'A Pluggy não conseguiu concluir a operação.'
    throw new PluggyApiError(message, response.status, body)
  }
  return body as T
}

export function isPluggyConfigured(): boolean {
  return Boolean(process.env.PLUGGY_CLIENT_ID && process.env.PLUGGY_CLIENT_SECRET)
}

export function pluggySandboxEnabled(): boolean {
  return process.env.PLUGGY_INCLUDE_SANDBOX === 'true'
}
