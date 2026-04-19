/* eslint-disable @typescript-eslint/naming-convention */
import { defineService } from 'reactive-vscode'
import { useBaseProvider } from '../use-base-provider'
import type { UsageItem } from '../../types'

interface GithubCopilotQuotaSnapshot {
  entitlement?: number
  overage_permitted?: boolean
  percent_remaining?: number
  remaining?: number
  unlimited?: boolean
}

interface GithubCopilotUsageData {
  limited_user_reset_date?: string
  limited_user_quotas?: {
    chat?: number
    completions?: number
  }
  monthly_quotas?: {
    chat?: number
    completions?: number
  }
  quota_reset_date?: string
  quota_reset_date_utc?: string
  quota_snapshots?: {
    chat?: GithubCopilotQuotaSnapshot
    completions?: GithubCopilotQuotaSnapshot
    premium_interactions?: GithubCopilotQuotaSnapshot
  }
}

interface GithubCopilotUsageResponse extends GithubCopilotUsageData {
  user_copilot?: GithubCopilotUsageData
}

function clampPercentage(percentage: number): number {
  return Math.min(100, Math.max(0, Math.round(percentage * 10) / 10))
}

function buildUsageDetail(total: number, remaining: number): { used: number, total: number } {
  return {
    used: Math.max(0, total - remaining),
    total,
  }
}

function hasQuotaData(data: GithubCopilotUsageData | undefined): data is GithubCopilotUsageData {
  return Boolean(
    data?.quota_snapshots
    || data?.monthly_quotas
    || data?.limited_user_quotas
  )
}

function getPremiumRequestsLabel(snapshot: GithubCopilotQuotaSnapshot): string {
  return snapshot.overage_permitted && !snapshot.unlimited
    ? 'Included premium requests'
    : 'Premium requests'
}

function toUsageItem(
  name: string,
  snapshot: GithubCopilotQuotaSnapshot | undefined,
  resetTime?: string
): UsageItem | undefined {
  if (!snapshot)
    return undefined

  if (snapshot.unlimited)
    return { name, included: true, resetTime }

  if (typeof snapshot.percent_remaining === 'number') {
    const entitlement = snapshot.entitlement ?? 0
    const remaining = snapshot.remaining ?? 0
    return {
      name,
      percentage: clampPercentage(100 - snapshot.percent_remaining),
      detail: entitlement > 0 ? buildUsageDetail(entitlement, remaining) : undefined,
      resetTime,
    }
  }

  const entitlement = snapshot.entitlement ?? 0
  if (entitlement <= 0)
    return undefined

  const remaining = snapshot.remaining ?? 0
  return {
    name,
    percentage: clampPercentage(((entitlement - remaining) / entitlement) * 100),
    detail: buildUsageDetail(entitlement, remaining),
    resetTime,
  }
}

function toLegacyUsageItem(
  name: string,
  total: number | undefined,
  remaining: number | undefined,
  resetTime?: string
): UsageItem | undefined {
  if (typeof total !== 'number' || total <= 0 || typeof remaining !== 'number')
    return undefined

  return {
    name,
    percentage: clampPercentage(((total - remaining) / total) * 100),
    detail: buildUsageDetail(total, remaining),
    resetTime,
  }
}

export function parseGithubCopilotUsage(data: GithubCopilotUsageResponse): UsageItem[] {
  const usageData = hasQuotaData(data.user_copilot) ? data.user_copilot : data
  const resetTime =
    usageData.quota_reset_date_utc
    ?? usageData.quota_reset_date
    ?? usageData.limited_user_reset_date
  const quotaSnapshots = usageData.quota_snapshots
  const usageByName = new Map<string, UsageItem>()

  const legacyCompletions = toLegacyUsageItem(
    'Inline Suggestions',
    usageData.monthly_quotas?.completions,
    usageData.limited_user_quotas?.completions,
    resetTime,
  )
  if (legacyCompletions)
    usageByName.set(legacyCompletions.name, legacyCompletions)

  const legacyChat = toLegacyUsageItem(
    'Chat messages',
    usageData.monthly_quotas?.chat,
    usageData.limited_user_quotas?.chat,
    resetTime,
  )
  if (legacyChat)
    usageByName.set(legacyChat.name, legacyChat)

  const modernCompletions = toUsageItem('Inline Suggestions', quotaSnapshots?.completions, resetTime)
  if (modernCompletions)
    usageByName.set(modernCompletions.name, modernCompletions)

  const modernChat = toUsageItem('Chat messages', quotaSnapshots?.chat, resetTime)
  if (modernChat)
    usageByName.set(modernChat.name, modernChat)

  const premiumRequests = toUsageItem(
    getPremiumRequestsLabel(quotaSnapshots?.premium_interactions ?? {}),
    quotaSnapshots?.premium_interactions,
    resetTime,
  )
  if (premiumRequests)
    usageByName.set(premiumRequests.name, premiumRequests)

  return [
    usageByName.get('Inline Suggestions'),
    usageByName.get('Chat messages'),
    usageByName.get('Premium requests'),
    usageByName.get('Included premium requests'),
  ].filter((item): item is UsageItem => Boolean(item))
}

export const useGithubCopilotProvider = defineService(() =>
  useBaseProvider({
    id: 'githubCopilot',
    name: 'GitHub Copilot',
    login: { type: 'oauth' },
    fetchUsage: async (credential: string): Promise<UsageItem[]> => {
      const { authentication } = await import('vscode')
      const session = await authentication.getSession('github', ['read:user'], {
        createIfNone: false,
      })
      const githubToken = session?.accessToken || credential

      if (!githubToken) {
        throw new Error('No GitHub token available')
      }

      const response = await fetch('https://api.github.com/copilot_internal/user', {
        headers: {
          Authorization: `token ${githubToken}`,
          'User-Agent': 'GitHubCopilotChat/0.24.0',
          'Editor-Version': 'vscode/1.97.0',
          'Editor-Plugin-Version': 'copilot-chat/0.24.0',
          'Copilot-Integration-Id': 'vscode-chat',
          'X-GitHub-Api-Version': '2023-07-07',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch usage: ${response.statusText}`)
      }

      const data = await response.json() as GithubCopilotUsageResponse
      const usage = parseGithubCopilotUsage(data)

      if (usage.length === 0) {
        throw new Error('No usage data available')
      }

      return usage
    },
    authenticate: async (): Promise<string> => {
      const { authentication, window } = await import('vscode')
      const accounts = await authentication.getAccounts('github')

      if (accounts.length > 1) {
        const ADD_NEW = 'Add new GitHub account'
        const items = [
          ...accounts.map(a => ({
            label: a.label,
            description: a.id,
            accountInfo: a as typeof accounts[number] | undefined,
          })),
          { label: ADD_NEW, description: '', accountInfo: undefined },
        ]

        const picked = await window.showQuickPick(items, {
          title: 'GitHub Copilot',
          placeHolder: 'Select a GitHub account to use',
        })
        if (!picked) throw new Error('Authentication cancelled')

        if (picked.accountInfo) {
          const session = await authentication.getSession('github', ['read:user'], {
            account: picked.accountInfo,
            createIfNone: true,
          })
          if (!session) throw new Error('GitHub authentication failed')
          return session.accessToken
        }

        const newSession = await authentication.getSession('github', ['read:user'], {
          forceNewSession: true,
        })
        if (!newSession) throw new Error('GitHub authentication failed')
        return newSession.accessToken
      }

      const session = await authentication.getSession('github', ['read:user'], {
        createIfNone: true,
      })
      if (!session) throw new Error('GitHub authentication failed')
      return session.accessToken
    },
  })
)
