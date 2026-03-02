/* eslint-disable @typescript-eslint/naming-convention */
import { defineService } from 'reactive-vscode'
import { useOAuthProvider } from '../use-oauth-provider'
import type { PercentageUsage } from '../../types'
import type { PkceChallenge } from '../../utils/pkce'

const clientId = 'app_EMoamEEZ73f0CkXaXp7hrann'
const authUrl = 'https://auth.openai.com/oauth/authorize'
const tokenUrl = 'https://auth.openai.com/oauth/token'
const redirectUri = 'http://localhost:1455/auth/callback'
const scope = 'openid profile email offline_access'

const usageEndpoints = [
  'https://chatgpt.com/backend-api/wham/usage',
  'https://chatgpt.com/api/codex/usage'
] as const

export const useOpenaiCodexProvider = defineService(() =>
  useOAuthProvider({
    id: 'openaiCodex',
    name: 'OpenAI Codex',
    port: 1455,
    path: '/auth/callback',
    getAuthUrl: (state: string, pkce: PkceChallenge): string => {
      const url = new URL(authUrl)
      url.searchParams.set('response_type', 'code')
      url.searchParams.set('client_id', clientId)
      url.searchParams.set('redirect_uri', redirectUri)
      url.searchParams.set('scope', scope)
      url.searchParams.set('code_challenge', pkce.challenge)
      url.searchParams.set('code_challenge_method', pkce.method)
      url.searchParams.set('state', state)
      url.searchParams.set('originator', 'opencode')
      return url.toString()
    },
    exchangeCode: async (code: string, verifier: string): Promise<string> => {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: clientId,
          code,
          redirect_uri: redirectUri,
          code_verifier: verifier
        })
      })

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`)
      }

      const data = (await response.json()) as { access_token?: string }
      if (!data.access_token) {
        throw new Error('No access_token in response')
      }
      return data.access_token
    },
    fetchUsage: async (token: string): Promise<PercentageUsage[]> => {
      for (const endpoint of usageEndpoints) {
        try {
          const response = await fetch(endpoint, {
            headers: {
              'User-Agent': 'UnifyQuotaMonitor/1.0',
              Authorization: `Bearer ${token}`,
              Accept: 'application/json'
            }
          })

          if (!response.ok) {
            continue
          }

          const data = (await response.json()) as {
            rate_limit?: {
              primary_window?: { used_percent?: number; reset_at?: unknown }
              secondary_window?: { used_percent?: number; reset_at?: unknown }
            }
          }

          const rateLimit = data?.rate_limit
          if (!rateLimit) {
            continue
          }

          const items: PercentageUsage[] = []
          const parseWindow = (
            window: { used_percent?: number; reset_at?: unknown } | undefined,
            label: string
          ) => {
            if (!window) return
            const used = Number(window.used_percent)
            if (!Number.isFinite(used)) return
            items.push({
              name: label,
              percentage: Math.max(0, Math.min(100, Math.round(used))),
              resetTime:
                typeof window.reset_at === 'string'
                  ? window.reset_at
                  : undefined
            })
          }

          parseWindow(rateLimit.primary_window, 'Primary Limit')
          parseWindow(rateLimit.secondary_window, 'Secondary Limit')

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
