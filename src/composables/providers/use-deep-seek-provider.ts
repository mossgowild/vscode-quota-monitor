/* eslint-disable @typescript-eslint/naming-convention */
import { defineService } from 'reactive-vscode'
import { useApiKeyProvider } from '../use-api-key-provider'
import type { BalanceUsage } from '../../types'

export const useDeepSeekProvider = defineService(() =>
  useApiKeyProvider({
    id: 'deepSeek',
    name: 'DeepSeek',
    keyPrefix: 'sk-',
    fetchUsage: async (apiKey): Promise<BalanceUsage[]> => {
      const response = await fetch('https://api.deepseek.com/user/balance', {
        headers: {
          'User-Agent': 'UnifyQuotaMonitor/1.0',
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch balance: ${response.statusText}`)
      }

      const data = (await response.json()) as {
        is_available?: boolean
        balance_infos?: Array<{
          currency?: string
          total_balance?: string
        }>
      }

      if (!data.is_available || !Array.isArray(data.balance_infos)) {
        return []
      }

      return data.balance_infos.map((info) => {
        const currency = info.currency ?? 'USD'
        const unit = currency === 'CNY' ? '¥' : '$'
        return {
          name: `Balance (${currency})`,
          amount: Number(info.total_balance) || 0,
          unit
        }
      })
    }
  })
)
