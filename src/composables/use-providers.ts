/* eslint-disable @typescript-eslint/naming-convention */
import { defineService, watch } from 'reactive-vscode'
import { window } from 'vscode'
import { useZhipuProvider } from './providers/use-zhipu-provider'
import { useZaiProvider } from './providers/use-zai-provider'
import { useKimiCodeProvider } from './providers/use-kimi-code-provider'
import { useAntigravityProvider } from './providers/use-google-antigravity-provider'
import { useGeminiProvider } from './providers/use-google-gemini-provider'
import { useCopilotProvider } from './providers/use-github-copilot-provider'
import { useDeepSeekProvider } from './providers/use-deep-seek-provider'
import { useMoonshotProvider } from './providers/use-moonshot-provider'
import { useSiliconFlowProvider } from './providers/use-silicon-flow-provider'
import { useOpenRouterProvider } from './providers/use-open-router-provider'
import { useClaudeCodeProvider } from './providers/use-claude-code-provider'
import { useCodexProvider } from './providers/use-openai-codex-provider'
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
  const kimiCode = useKimiCodeProvider()
  const antigravity = useAntigravityProvider()
  const gemini = useGeminiProvider()
  const copilot = useCopilotProvider()
  const deepseek = useDeepSeekProvider()
  const moonshot = useMoonshotProvider()
  const siliconflow = useSiliconFlowProvider()
  const openrouter = useOpenRouterProvider()
  const claudeCode = useClaudeCodeProvider()
  const codex = useCodexProvider()

  const providersMap: Record<ProviderId, UseBaseProviderReturn> = {
    zhipu,
    zai,
    kimiCode,
    googleAntigravity: antigravity,
    googleGemini: gemini,
    githubCopilot: copilot,
    deepSeek: deepseek,
    moonshot,
    siliconFlow: siliconflow,
    openRouter: openrouter,
    claudeCode,
    openaiCodex: codex,
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
