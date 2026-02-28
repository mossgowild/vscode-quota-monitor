/* eslint-disable @typescript-eslint/naming-convention */

export const PROVIDER_IDS = [
  'zhipu',
  'zai',
  'antigravity',
  'copilot',
  'gemini',
  'kimi'
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

export interface UsageItem {
  name: string
  type: 'percentage' | 'quantity'
  used: number
  total?: number
  resetTime?: string
}

export interface ViewAccount {
  name: string
  usage: UsageItem[]
  error?: string
}

export interface ViewProvider {
  name: string
  accounts: ViewAccount[]
}
