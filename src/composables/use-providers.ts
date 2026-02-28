/* eslint-disable @typescript-eslint/naming-convention */
import { defineService, watch } from 'reactive-vscode'
import { window } from 'vscode'
import { useZhipuProvider } from './use-zhipu-provider'
import { useZaiProvider } from './use-zai-provider'
import { useKimiProvider } from './use-kimi-provider'
import { useAntigravityProvider } from './use-antigravity-provider'
import { useGeminiProvider } from './use-gemini-provider'
import { useCopilotProvider } from './use-copilot-provider'
import { useConfig } from './use-config'
import type { ProviderId } from '../types'
import type { UseBaseProviderReturn } from './use-base-provider'

export interface UseProvidersReturn {
  providersMap: Record<ProviderId, UseBaseProviderReturn>
  refresh: (providerId?: ProviderId, accountIndex?: number) => Promise<void>
}

export const useProviders = defineService((): UseProvidersReturn => {
  const zhipu = useZhipuProvider()
  const zai = useZaiProvider()
  const kimi = useKimiProvider()
  const antigravity = useAntigravityProvider()
  const gemini = useGeminiProvider()
  const copilot = useCopilotProvider()

  const providersMap: Record<ProviderId, UseBaseProviderReturn> = {
    zhipu: zhipu,
    zai: zai,
    kimi: kimi,
    antigravity: antigravity,
    gemini: gemini,
    copilot: copilot
  }

  const config = useConfig()
  let timer: ReturnType<typeof setInterval> | null = null

  watch(
    [() => config.autoRefreshEnabled, () => config.autoRefreshIntervalMs],
    ([enabled, intervalMs]) => {
      if (timer) clearInterval(timer)
      if (enabled) {
        timer = setInterval(() => refresh(), intervalMs)
      }
    },
    { immediate: true }
  )

  const refresh = async (providerId?: ProviderId, accountIndex?: number) => {
    await window.withProgress(
      {
        location: { viewId: 'unifyQuotaMonitor.usageView' }
      },
      async () => {
        if (providerId === undefined) {
          // Refresh all accounts for all providers
          await Promise.allSettled(
            Object.values(providersMap).map((p) => p.refresh())
          )
        } else {
          // Refresh specific provider, optionally specific account
          await providersMap[providerId].refresh(accountIndex)
        }
      }
    )
  }

  return { providersMap, refresh }
})
