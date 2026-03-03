/* eslint-disable @typescript-eslint/naming-convention */
import { defineService } from 'reactive-vscode'
import { useApiKeyProvider } from '../use-api-key-provider'
import type { BalanceUsage } from '../../types'

export const useMoonshotProvider = defineService(() =>
  useApiKeyProvider({
    id: 'moonshot',
    name: 'Moonshot AI',
    keyPrefix: 'sk-',
    fetchUsage: async (apiKey): Promise<BalanceUsage[]> => {
      const response = await fetch(
        'https://api.moonshot.cn/v1/users/me/balance',
        {
          headers: {
            'User-Agent': 'QuotaMonitor/1.0',
            Authorization: `Bearer ${apiKey}`,
            Accept: 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch balance: ${response.statusText}`)
      }

      const data = (await response.json()) as {
        data?: {
          available_balance?: number
          cash_balance?: number
          voucher_balance?: number
        }
      }

      const available = data?.data?.available_balance
      if (available == null) {
        return []
      }

      const items: BalanceUsage[] = [
        {
          name: 'Available Balance',
          amount: available,
          unit: '¥'
        }
      ]

      const cash = data?.data?.cash_balance
      const voucher = data?.data?.voucher_balance
      if (cash != null) {
        items.push({
          name: 'Cash Balance',
          amount: cash,
          unit: '¥'
        })
      }
      if (voucher != null && voucher > 0) {
        items.push({
          name: 'Voucher Balance',
          amount: voucher,
          unit: '¥'
        })
      }

      return items
    }
  })
)
