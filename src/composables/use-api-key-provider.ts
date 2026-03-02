import { useBaseProvider } from './use-base-provider'
import type { ProviderId, UsageItem } from '../types'

export interface ApiKeyProviderOptions {
  id: ProviderId
  name: string
  keyPrefix?: string
  helpUrl?: string
  fetchUsage: (credential: string) => Promise<UsageItem[]>
}

export function useApiKeyProvider(options: ApiKeyProviderOptions) {
  const apiKeyPrefix = options.keyPrefix ?? 'sk'

  return useBaseProvider({
    id: options.id,
    name: options.name,
    login: { type: 'apiKey', apiKeyPrefix, helpUrl: options.helpUrl },
    fetchUsage: options.fetchUsage
  })
}
