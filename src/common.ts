import { AmountUsage, BalanceUsage, PercentageUsage, UsageItem } from './types'

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
  'openaiCodex'
] as const

export function isPercentageUsage(u: UsageItem): u is PercentageUsage {
  return 'percentage' in u
}

export function isAmountUsage(u: UsageItem): u is AmountUsage {
  return 'used' in u
}

export function isBalanceUsage(u: UsageItem): u is BalanceUsage {
  return 'amount' in u
}
