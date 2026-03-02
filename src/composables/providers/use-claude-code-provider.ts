/* eslint-disable @typescript-eslint/naming-convention */
import { defineService } from 'reactive-vscode'
import { useOAuthProvider } from '../use-oauth-provider'
import type { PercentageUsage } from '../../types'
import type { PkceChallenge } from '../../utils/pkce'

const clientId = '9d1c250a-e61b-44d9-88ed-5944d1962f5e'
const authUrl = 'https://claude.ai/oauth/authorize'
const tokenUrl = 'https://console.anthropic.com/v1/oauth/token'
const redirectUri = 'http://localhost:54545/callback'
const scope = 'org:create_api_key user:profile user:inference'

export const useClaudeCodeProvider = defineService(() =>
  useOAuthProvider({
    id: 'claudeCode',
    name: 'Claude Code',
    port: 54545,
    path: '/callback',
    getAuthUrl: (state: string, pkce: PkceChallenge): string => {
      const url = new URL(authUrl)
      url.searchParams.set('response_type', 'code')
      url.searchParams.set('client_id', clientId)
      url.searchParams.set('redirect_uri', redirectUri)
      url.searchParams.set('scope', scope)
      url.searchParams.set('code_challenge', pkce.challenge)
      url.searchParams.set('code_challenge_method', pkce.method)
      url.searchParams.set('state', state)
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
      // Anthropic API: GET /v1/usage — verify exact endpoint against live API
      const response = await fetch('https://api.anthropic.com/v1/usage', {
        headers: {
          'User-Agent': 'UnifyQuotaMonitor/1.0',
          Authorization: `Bearer ${token}`,
          'anthropic-version': '2023-06-01',
          Accept: 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch usage: ${response.statusText}`)
      }

      const data = (await response.json()) as {
        usage?: Array<{
          name?: string
          used?: number
          limit?: number
          reset_at?: string
        }>
      }

      if (!Array.isArray(data.usage)) {
        return []
      }

      return data.usage.map((u) => ({
        name: u.name ?? 'Usage',
        percentage: Number(u.used) || 0,
        resetTime: u.reset_at
      }))
    }
  })
)
