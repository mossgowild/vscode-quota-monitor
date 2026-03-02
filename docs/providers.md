# Providers

Provider implementations for different AI services.

## Overview

| Provider | ID | Auth Type | Extends | Usage Type |
|----------|----|-----------|---------|------------|
| Zhipu AI | `zhipu` | API Key | `useBigModelProvider` | Amount / Percentage |
| Z.AI | `zai` | API Key | `useBigModelProvider` | Amount / Percentage |
| Kimi Code | `kimiCode` | API Key | `useApiKeyProvider` | Percentage |
| Google Antigravity | `googleAntigravity` | OAuth (PKCE) | `useGoogleProvider` | Percentage |
| Gemini CLI | `googleGemini` | OAuth (PKCE) | `useGoogleProvider` | Percentage |
| GitHub Copilot | `githubCopilot` | VS Code Auth | `useBaseProvider` | Amount |
| DeepSeek | `deepSeek` | API Key | `useApiKeyProvider` | Balance |
| Moonshot AI | `moonshot` | API Key | `useApiKeyProvider` | Balance |
| SiliconFlow | `siliconFlow` | API Key | `useApiKeyProvider` | Balance |
| OpenRouter | `openRouter` | API Key | `useApiKeyProvider` | Balance |
| Claude Code | `claudeCode` | OAuth (PKCE) | `useOAuthProvider` | Percentage |
| OpenAI Codex | `openaiCodex` | OAuth (PKCE) | `useOAuthProvider` | Percentage |

## Base Provider

**File**: `src/composables/use-base-provider.ts`

Core provider logic managing accounts and reactive refresh.

```typescript
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
```

### Features

- **Write-through cache**: `pending` ref ensures synchronous reads just after config writes
- **Array-based accounts**: Manages accounts as `ConfigAccount[]` in VS Code global settings
- **Reactive state**: `accountsData` ref updates trigger UI refresh
- **Centralized error handling**: Errors caught in `refresh()` stored per account
- **Auto-refresh on config change**: Watches `accountsConfig` and refreshes new accounts

## API Key Provider

**File**: `src/composables/use-api-key-provider.ts`

Base for API key authentication providers.

```typescript
export interface ApiKeyProviderOptions {
  id: ProviderId
  name: string
  keyPrefix?: string
  helpUrl?: string
  fetchUsage: (credential: string) => Promise<UsageItem[]>
}

export function useApiKeyProvider(options: ApiKeyProviderOptions): UseBaseProviderReturn
```

Sets `meta.login.type = 'apiKey'`. The actual input box and validation is handled by `useMenu` via `showInputBoxWithBack`.

## OAuth Provider

**File**: `src/composables/use-oauth-provider.ts`

Base for OAuth + PKCE authentication providers.

```typescript
export interface OAuthProviderOptions {
  id: ProviderId
  name: string
  port?: number
  path?: string
  helpUrl?: string
  fetchUsage: (credential: string) => Promise<UsageItem[]>
  getAuthUrl: (state: string, pkce: PkceChallenge) => string
  exchangeCode: (code: string, verifier: string) => Promise<string>
}
```

Sets `meta.login.type = 'oauth'`. Opens a local HTTP server on `port` to receive the OAuth callback, then calls `exchangeCode` to trade the code for a credential.

## Google Provider

**File**: `src/composables/use-google-provider.ts`

Shared Google OAuth implementation for Antigravity and Gemini.

### Features

- **Token refresh**: Automatic access token refresh on 401
- **Retry logic**: `requestWithRetry` handles expired tokens
- **Credential update**: Persists new tokens via `onCredentialChange`

Credential stored as `refresh_token` string. Fetches a fresh `access_token` on each `fetchUsage` call.

## Big Model Provider

**File**: `src/composables/use-big-model-provider.ts`

Shared fetch logic for Zhipu AI and Z.AI (both use the BigModel API format).

```typescript
export interface BigModelProviderOptions {
  id: ProviderId
  name: string
  keyPrefix: string
  apiUrl: string
}
```

### API Response Format

```typescript
{
  success: boolean
  data: {
    limits: Array<{
      type?: string
      percentage?: number
      usage?: number
      currentValue?: number
      nextResetTime?: string  // also: next_reset_time | resetTime | reset_time
    }>
  }
}
```

Returns `PercentageUsage` when `percentage` field is present, otherwise `AmountUsage`.

## Individual Providers

### Zhipu AI

**File**: `src/composables/providers/use-zhipu-provider.ts`

```typescript
export const useZhipuProvider = defineService(() =>
  useBigModelProvider({
    id: 'zhipu',
    name: 'Zhipu AI',
    keyPrefix: 'sk.',
    apiUrl: 'https://bigmodel.cn/api/monitor/usage/quota/limit',
  })
)
```

### Z.AI

**File**: `src/composables/providers/use-zai-provider.ts`

```typescript
export const useZaiProvider = defineService(() =>
  useBigModelProvider({
    id: 'zai',
    name: 'Z.AI',
    keyPrefix: 'zai_',
    apiUrl: '...',
  })
)
```

### Kimi Code

**File**: `src/composables/providers/use-kimi-code-provider.ts`

```typescript
export const useKimiCodeProvider = defineService(() =>
  useApiKeyProvider({
    id: 'kimiCode',
    name: 'Kimi Code',
    keyPrefix: 'sk-kimi',
    fetchUsage: async (apiKey) => { /* GET /coding/v1/usages → PercentageUsage[] */ }
  })
)
```

### Google Antigravity

**File**: `src/composables/providers/use-google-antigravity-provider.ts`

```typescript
export const useGoogleAntigravityProvider = defineService(() =>
  useGoogleProvider({
    id: 'googleAntigravity',
    name: 'Google Antigravity',
    clientId: '1071006060591-...',
    scopes: ['openid', 'email', 'profile', 'cloud-platform', 'cclog', ...],
    fetchUsage: async (credential) => { /* credential is refresh_token → PercentageUsage[] */ }
  })
)
```

### Gemini CLI

**File**: `src/composables/providers/use-google-gemini-provider.ts`

```typescript
export const useGoogleGeminiProvider = defineService(() =>
  useGoogleProvider({
    id: 'googleGemini',
    name: 'Gemini CLI',
    clientId: '681255809395-...',
    scopes: ['openid', 'email', 'cloud-platform'],
    fetchUsage: async (credential) => { /* credential is refresh_token → PercentageUsage[] */ }
  })
)
```

### GitHub Copilot

**File**: `src/composables/providers/use-github-copilot-provider.ts`

Uses `useBaseProvider` directly with VS Code native authentication:

```typescript
export const useGithubCopilotProvider = defineService(() =>
  useBaseProvider({
    id: 'githubCopilot',
    name: 'GitHub Copilot',
    login: { type: 'oauth' },
    fetchUsage: async (credential) => {
      // Tries VS Code authentication.getSession('github') first,
      // falls back to stored credential.
      // Returns AmountUsage for premium_interactions limit.
    },
  })
)
```

### DeepSeek

**File**: `src/composables/providers/use-deep-seek-provider.ts`

```typescript
export const useDeepSeekProvider = defineService(() =>
  useApiKeyProvider({
    id: 'deepSeek',
    name: 'DeepSeek',
    keyPrefix: 'sk-',
    fetchUsage: async (apiKey) => { /* GET /user/balance → BalanceUsage[] */ }
  })
)
```

### Moonshot AI

**File**: `src/composables/providers/use-moonshot-provider.ts`

```typescript
export const useMoonshotProvider = defineService(() =>
  useApiKeyProvider({
    id: 'moonshot',
    name: 'Moonshot AI',
    keyPrefix: 'sk-',
    fetchUsage: async (apiKey) => { /* GET /v1/users/me/balance → BalanceUsage[] */ }
  })
)
```

### SiliconFlow

**File**: `src/composables/providers/use-silicon-flow-provider.ts`

```typescript
export const useSiliconFlowProvider = defineService(() =>
  useApiKeyProvider({
    id: 'siliconFlow',
    name: 'SiliconFlow',
    fetchUsage: async (apiKey) => { /* GET /v1/user/info → BalanceUsage[] */ }
  })
)
```

No `keyPrefix` restriction.

### OpenRouter

**File**: `src/composables/providers/use-open-router-provider.ts`

```typescript
export const useOpenRouterProvider = defineService(() =>
  useApiKeyProvider({
    id: 'openRouter',
    name: 'OpenRouter',
    keyPrefix: 'sk-or-v1-',
    fetchUsage: async (apiKey) => { /* GET /api/v1/auth/key → BalanceUsage[] */ }
  })
)
```

### Claude Code

**File**: `src/composables/providers/use-claude-code-provider.ts`

OAuth + PKCE flow against Anthropic:

```typescript
export const useClaudeCodeProvider = defineService(() =>
  useOAuthProvider({
    id: 'claudeCode',
    name: 'Claude Code',
    port: 54545,
    path: '/callback',
    getAuthUrl: (state, pkce) => { /* https://claude.ai/oauth/authorize */ },
    exchangeCode: async (code, verifier) => {
      /* POST https://console.anthropic.com/v1/oauth/token → access_token */
    },
    fetchUsage: async (accessToken) => { /* PercentageUsage[] per model */ }
  })
)
```

### OpenAI Codex

**File**: `src/composables/providers/use-openai-codex-provider.ts`

OAuth + PKCE flow against OpenAI:

```typescript
export const useOpenaiCodexProvider = defineService(() =>
  useOAuthProvider({
    id: 'openaiCodex',
    name: 'OpenAI Codex',
    port: 1455,
    path: '/auth/callback',
    getAuthUrl: (state, pkce) => { /* https://auth.openai.com/oauth/authorize */ },
    exchangeCode: async (code, verifier) => {
      /* POST https://auth.openai.com/oauth/token → access_token */
    },
    fetchUsage: async (accessToken) => {
      /* chatgpt.com/backend-api/wham/usage + /api/codex/usage → PercentageUsage[] */
    }
  })
)
```

## Usage Types

`UsageItem` is a structural union — narrow by checking property existence:

```typescript
export type UsageItem = PercentageUsage | AmountUsage | BalanceUsage

// Type guards (src/common.ts)
isPercentageUsage(u)  // 'percentage' in u
isAmountUsage(u)      // 'used' in u
isBalanceUsage(u)     // 'amount' in u
```

| Provider | Usage Type | Notes |
|----------|-----------|-------|
| Zhipu / Z.AI | Amount / Percentage | Token limits per model |
| Kimi Code | Percentage | Rate-limit window % |
| Google Antigravity / Gemini | Percentage | By model |
| GitHub Copilot | Amount | Premium request limits |
| DeepSeek / Moonshot / SiliconFlow / OpenRouter | Balance | Currency balance |
| Claude Code / OpenAI Codex | Percentage | By model / resource |

## Sorting

All providers sort usage items by:
1. Percentage ascending (most remaining first)
2. Balance items by `amount` descending

