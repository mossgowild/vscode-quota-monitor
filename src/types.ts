import { PROVIDER_IDS } from './common'

export type ProviderId = (typeof PROVIDER_IDS)[number]

export interface ConfigAccount {
  credential: string
  name?: string
}

export type ConfigProvider = Record<ProviderId, ConfigAccount[]>

export interface Config {
  providers: ConfigProvider
  autoRefreshEnabled: boolean
  autoRefreshIntervalMs: number
}

export interface PercentageUsage {
  name: string
  percentage: number
  resetTime?: string
}

export interface AmountUsage {
  name: string
  used: number
  total: number
  resetTime?: string
}

export interface BalanceUsage {
  name: string
  amount: number
  unit?: string
}

export type UsageItem = PercentageUsage | AmountUsage | BalanceUsage

export interface ViewAccount {
  name?: string
  fallbackName: string
  usage: UsageItem[]
  error?: string
}

export interface ViewProvider {
  name: string
  accounts: ViewAccount[]
}
