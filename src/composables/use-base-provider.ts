import { computed, DeepReadonly, ref, type ComputedRef } from 'reactive-vscode'
import { ConfigurationTarget } from 'vscode'
import { useConfig } from './use-config'
import type {
  ProviderId,
  UsageItem,
  ViewAccount,
  ConfigAccount
} from '../types'

export interface ProviderMeta {
  id: ProviderId
  name: string
  login: {
    type: 'oauth' | 'apiKey'
    helpUrl?: string
    apiKeyPrefix?: string
  }
}

export interface BaseProviderOptions extends ProviderMeta {
  authenticate?: () => Promise<string>
  fetchUsage: (credential: string) => Promise<UsageItem[]>
}

export interface UseBaseProviderReturn {
  meta: ProviderMeta
  accounts: ComputedRef<ViewAccount[]>
  login: (credential?: string) => Promise<void>
  logout: (accountIndex: number) => void
  refresh: (accountIndex?: number) => Promise<void>
  rename: (accountIndex: number, name: string) => void
}

export function useBaseProvider(
  options: BaseProviderOptions
): UseBaseProviderReturn {
  const config = useConfig()
  const accountsConfig = computed({
    get() {
      return (
        config.has(`providers.${options.id}`)
          ? config.providers[options.id]
          : []
      ) as DeepReadonly<ConfigAccount[]>
    },
    set(value: ConfigAccount[]) {
      const current = (config.get('providers') as Record<string, unknown>) ?? {}
      const updated = { ...current }
      if (value.length > 0) {
        updated[options.id] = [...value]
      } else {
        delete updated[options.id]
      }
      config.update(
        'providers',
        Object.keys(updated).length > 0 ? updated : undefined,
        ConfigurationTarget.Global
      )
    }
  })
  const accountsData = ref<{ usage?: UsageItem[]; error?: string }[]>([])
  const accounts = computed((): ViewAccount[] => {
    return accountsConfig.value.map((account, index) => ({
      name: account.name ?? `${options.name} #${index + 1}`,
      usage: accountsData.value[index]?.usage ?? [],
      error: accountsData.value[index]?.error
    }))
  })

  const login = async (credential?: string) => {
    const resolved = credential ?? (await options.authenticate?.())
    if (!resolved) throw new Error('Authentication cancelled')
    accountsConfig.value = [...accountsConfig.value, { credential: resolved }]
    refresh(accountsConfig.value.length - 1)
  }

  const logout = (accountIndex: number) => {
    accountsConfig.value = accountsConfig.value.filter(
      (_, i) => i !== accountIndex
    )
    accountsData.value.splice(accountIndex, 1)
  }

  const refresh = async (accountIndex?: number) => {
    const indices =
      accountIndex !== undefined
        ? [accountIndex]
        : accountsConfig.value.map((_, i) => i)
    await Promise.allSettled(
      indices.map(async (idx) => {
        const account = accountsConfig.value[idx]
        if (!account) return
        try {
          const usage = await options.fetchUsage(account.credential)
          accountsData.value[idx] = { usage }
        } catch (e: any) {
          accountsData.value[idx] = { error: e.message || 'Unknown error' }
        }
      })
    )
  }

  const rename = (accountIndex: number, name: string) => {
    accountsConfig.value = accountsConfig.value.map((acc, i) =>
      i === accountIndex ? { ...acc, name } : acc
    )
  }

  const meta: ProviderMeta = {
    id: options.id,
    name: options.name,
    login: options.login
  }

  return { meta, accounts, login, logout, refresh, rename }
}
