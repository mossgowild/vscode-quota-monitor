/* eslint-disable @typescript-eslint/naming-convention */

export const PROVIDER_IDS = [
  'zhipu',
  'zai',
  'googleAntigravity',
  'githubCopilot',
  'googleGemini',
  'kimiCode',
  'deepSeek',
  'moonshot',
  'siliconFlow',
  'openRouter',
  'claudeCode',
  'openaiCodex',
] as const

export type ProviderId = (typeof PROVIDER_IDS)[number]

export interface ConfigAccount {
  credential: string
  name?: string
}

export type ConfigProvider = Record<ProviderId, ConfigAccount[]>

// Flattened config type (required by reactive-vscode defineConfig)
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
  name: string
  usage: UsageItem[]
  error?: string
}

export interface ViewProvider {
  name: string
  accounts: ViewAccount[]
}
