/* eslint-disable @typescript-eslint/naming-convention */
import { defineService } from 'reactive-vscode'
import { useApiKeyProvider } from '../use-api-key-provider'
import type { BalanceUsage } from '../../types'

export const useOpenRouterProvider = defineService(() =>
  useApiKeyProvider({
    id: 'openRouter',
    name: 'OpenRouter',
    keyPrefix: 'sk-or-v1-',
    fetchUsage: async (apiKey): Promise<BalanceUsage[]> => {
      const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: {
          'User-Agent': 'UnifyQuotaMonitor/1.0',
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch balance: ${response.statusText}`)
      }

      const data = (await response.json()) as {
        data?: {
          usage?: number
          limit?: number | null
          limit_remaining?: number | null
        }
      }

      const info = data?.data
      if (!info) {
        return []
      }

      const limitRemaining = info.limit_remaining

      return [
        {
          name: 'Credits Remaining',
          amount: Number(limitRemaining) || 0,
          unit: '$',
        },
      ]
    },
  })
)
