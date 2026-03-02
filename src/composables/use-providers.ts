/* eslint-disable @typescript-eslint/naming-convention */
import { defineService, watch } from 'reactive-vscode'
import { window } from 'vscode'
import { useZhipuProvider } from './providers/use-zhipu-provider'
import { useZaiProvider } from './providers/use-zai-provider'
import { useKimiCodeProvider } from './providers/use-kimi-code-provider'
import { useGoogleAntigravityProvider } from './providers/use-google-antigravity-provider'
import { useGoogleGeminiProvider } from './providers/use-google-gemini-provider'
import { useGithubCopilotProvider } from './providers/use-github-copilot-provider'
import { useDeepSeekProvider } from './providers/use-deep-seek-provider'
import { useMoonshotProvider } from './providers/use-moonshot-provider'
import { useSiliconFlowProvider } from './providers/use-silicon-flow-provider'
import { useOpenRouterProvider } from './providers/use-open-router-provider'
import { useClaudeCodeProvider } from './providers/use-claude-code-provider'
import { useOpenaiCodexProvider } from './providers/use-openai-codex-provider'
import { useConfig } from './use-config'
import type { ProviderId } from '../types'
import type { UseBaseProviderReturn } from './use-base-provider'

export interface UseProvidersReturn {
  providerById: Record<ProviderId, UseBaseProviderReturn>
  refresh: (providerId?: ProviderId, accountIndex?: number) => Promise<void>
}

export const useProviders = defineService((): UseProvidersReturn => {
  const providerById: Record<ProviderId, UseBaseProviderReturn> = {
    zhipu: useZhipuProvider(),
    zai: useZaiProvider(),
    kimiCode: useKimiCodeProvider(),
    googleAntigravity: useGoogleAntigravityProvider(),
    googleGemini: useGoogleGeminiProvider(),
    githubCopilot: useGithubCopilotProvider(),
    deepSeek: useDeepSeekProvider(),
    moonshot: useMoonshotProvider(),
    siliconFlow: useSiliconFlowProvider(),
    openRouter: useOpenRouterProvider(),
    claudeCode: useClaudeCodeProvider(),
    openaiCodex: useOpenaiCodexProvider()
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
            Object.values(providerById).map((p) => p.refresh())
          )
        } else {
          // Refresh specific provider, optionally specific account
          await providerById[providerId].refresh(accountIndex)
        }
      }
    )
  }

  return { providerById, refresh }
})
