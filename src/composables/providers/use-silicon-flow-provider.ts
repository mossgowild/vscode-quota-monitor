/* eslint-disable @typescript-eslint/naming-convention */
import { defineService } from 'reactive-vscode'
import { useApiKeyProvider } from '../use-api-key-provider'
import type { BalanceUsage } from '../../types'

export const useSiliconFlowProvider = defineService(() =>
  useApiKeyProvider({
    id: 'siliconFlow',
    name: 'SiliconFlow',
    fetchUsage: async (apiKey): Promise<BalanceUsage[]> => {
      const response = await fetch('https://api.siliconflow.cn/v1/user/info', {
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
          balance?: string | number
          totalRechargeAmount?: string | number
          totalUsageAmount?: string | number
        }
      }

      const balance = Number(data?.data?.balance)
      if (!Number.isFinite(balance)) {
        return []
      }

      return [
        {
          name: 'Balance',
          amount: balance,
          unit: '¥',
        },
      ]
    },
  })
)
