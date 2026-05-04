/* eslint-disable @typescript-eslint/naming-convention */
import { defineService } from 'reactive-vscode'
import { useOAuthProvider } from '../use-oauth-provider'
import type { PercentageUsage } from '../../types'
import type { PkceChallenge } from '../../utils/pkce'

const clientId = 'app_EMoamEEZ73f0CkXaXp7hrann'
const authUrl = 'https://auth.openai.com/oauth/authorize'
const tokenUrl = 'https://auth.openai.com/oauth/token'
const redirectUri = 'http://localhost:1455/auth/callback'
const scope =
  'openid profile email offline_access api.connectors.read api.connectors.invoke'
const originator = 'codex_cli_rs'

const usageEndpoints = [
  'https://chatgpt.com/backend-api/wham/usage',
  'https://chatgpt.com/api/codex/usage'
] as const

interface OpenaiCodexUsageResponse {
  rate_limit?: {
    primary_window?: OpenaiCodexRateLimitWindow
    secondary_window?: OpenaiCodexRateLimitWindow
  }
}

interface OpenaiCodexRateLimitWindow {
  used_percent?: number
  limit_window_seconds?: number
  reset_at?: unknown
}

export function buildOpenaiCodexAuthUrl(
  state: string,
  pkce: PkceChallenge
): string {
  const url = new URL(authUrl)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', scope)
  url.searchParams.set('code_challenge', pkce.challenge)
  url.searchParams.set('code_challenge_method', pkce.method)
  url.searchParams.set('id_token_add_organizations', 'true')
  url.searchParams.set('codex_cli_simplified_flow', 'true')
  url.searchParams.set('state', state)
  url.searchParams.set('originator', originator)
  return url.toString()
}

export async function exchangeOpenaiCodexCode(
  code: string,
  verifier: string
): Promise<string> {
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier
    })
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(
      `Token exchange failed: ${response.status} ${body || response.statusText}`
    )
  }

  const data = (await response.json()) as { access_token?: string }
  if (!data.access_token) {
    throw new Error('No access_token in response')
  }
  return data.access_token
}

function formatLimitWindowName(
  window: OpenaiCodexRateLimitWindow,
  fallback: string
): string {
  if (window.limit_window_seconds === 604800) return 'Weekly Limit'
  if (window.limit_window_seconds === 86400) return 'Daily Limit'
  if (window.limit_window_seconds === 3600) return 'Hourly Limit'
  if (
    typeof window.limit_window_seconds === 'number' &&
    window.limit_window_seconds > 0 &&
    window.limit_window_seconds % 3600 === 0
  ) {
    return `${window.limit_window_seconds / 3600} Hour Limit`
  }
  return fallback
}

function parseResetTime(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value * 1000).toISOString()
  }

  if (typeof value === 'string' && value.trim()) {
    const date = new Date(value)
    if (Number.isFinite(date.getTime())) return date.toISOString()
  }

  return undefined
}

export function parseOpenaiCodexUsage(
  data: OpenaiCodexUsageResponse
): PercentageUsage[] {
  const rateLimit = data.rate_limit
  if (!rateLimit) return []

  const items: PercentageUsage[] = []
  const parseWindow = (
    window: OpenaiCodexRateLimitWindow | undefined,
    fallbackName: string
  ) => {
    if (!window) return
    const used = Number(window.used_percent)
    if (!Number.isFinite(used)) return
    items.push({
      name: formatLimitWindowName(window, fallbackName),
      percentage: Math.max(0, Math.min(100, Math.round(used))),
      resetTime: parseResetTime(window.reset_at)
    })
  }

  parseWindow(rateLimit.primary_window, 'Primary Limit')
  parseWindow(rateLimit.secondary_window, 'Secondary Limit')
  return items
}

export const useOpenaiCodexProvider = defineService(() =>
  useOAuthProvider({
    id: 'openaiCodex',
    name: 'OpenAI Codex',
    port: 1455,
    path: '/auth/callback',
    getAuthUrl: buildOpenaiCodexAuthUrl,
    exchangeCode: exchangeOpenaiCodexCode,
    fetchUsage: async (token: string): Promise<PercentageUsage[]> => {
      for (const endpoint of usageEndpoints) {
        try {
          const response = await fetch(endpoint, {
            headers: {
              'User-Agent': 'QuotaMonitor/1.0',
              Authorization: `Bearer ${token}`,
              Accept: 'application/json'
            }
          })

          if (!response.ok) {
            continue
          }

          const data = (await response.json()) as OpenaiCodexUsageResponse
          const items = parseOpenaiCodexUsage(data)

          if (items.length > 0) {
            return items
          }
        } catch {
          continue
        }
      }

      throw new Error('Failed to fetch Codex usage from all endpoints')
    }
  })
)
