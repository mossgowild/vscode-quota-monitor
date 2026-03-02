# Architecture

## Overview

Unify Quota Monitor uses **Reactive MVC** with **Unidirectional Data Flow**, built on the `reactive-vscode` framework.

## Supported Providers

| ID | Name | Auth | Stored |
|---|---|---|---|
| `zhipu` | Zhipu AI | API Key | API Key |
| `zai` | Z.AI | API Key | API Key |
| `kimiCode` | Kimi Code | API Key | API Key |
| `googleAntigravity` | Google Antigravity | OAuth (PKCE) | refresh_token |
| `googleGemini` | Gemini CLI | OAuth (PKCE) | accessToken + refresh_token |
| `githubCopilot` | GitHub Copilot | VS Code Auth | Session reference |
| `deepSeek` | DeepSeek | API Key | API Key |
| `moonshot` | Moonshot AI | API Key | API Key |
| `siliconFlow` | SiliconFlow | API Key | API Key |
| `openRouter` | OpenRouter | API Key | API Key |
| `claudeCode` | Claude Code | OAuth (PKCE) | access_token |
| `openaiCodex` | OpenAI Codex | OAuth (PKCE) | access_token |

## Project Structure

```
src/
├── extension.ts          # Entry: composables init order
├── types.ts              # Type exports
├── common.ts             # PROVIDER_IDS, type guards (isPercentageUsage, etc.)
├── composables/          # Reactive-vscode composables
│   ├── use-*.ts          # Core composables (config, providers, view, menu)
│   ├── use-base-provider.ts      # Base provider with ProviderMeta interface
│   ├── use-api-key-provider.ts   # API Key auth base
│   ├── use-oauth-provider.ts     # OAuth + PKCE auth base
│   ├── use-big-model-provider.ts # Shared BigModel API format
│   ├── use-google-provider.ts    # Shared Google OAuth with token refresh
│   └── providers/        # Individual provider implementations
│       ├── use-zhipu-provider.ts
│       ├── use-zai-provider.ts
│       ├── use-kimi-code-provider.ts
│       ├── use-google-antigravity-provider.ts
│       ├── use-google-gemini-provider.ts
│       ├── use-github-copilot-provider.ts
│       ├── use-deep-seek-provider.ts
│       ├── use-moonshot-provider.ts
│       ├── use-silicon-flow-provider.ts
│       ├── use-open-router-provider.ts
│       ├── use-claude-code-provider.ts
│       └── use-openai-codex-provider.ts
└── utils/                # Stateless helpers
    ├── pkce.ts           # PKCE challenge generation
    ├── show-input-box-with-back.ts  # Input box with back button
    └── format-model-name.ts
```

## Layer Architecture

```
┌─────────────────────────────────────────┐
│  View Layer                             │
│  ├── useMenu (QuickPick menus)          │
│  └── useView (Webview HTML)             │
│       ↓ only reads providerById          │
├─────────────────────────────────────────┤
│  Controller Layer                       │
│  └── useProviders                       │
│       ├── manages provider instances    │
│       └── provides global refresh       │
│       ↓ only calls useConfig             │
├─────────────────────────────────────────┤
│  Model Layer                            │
│  └── useConfig (reactive-vscode)        │
│       └── configuration persistence     │
├─────────────────────────────────────────┤
│  Domain Layer                           │
│  └── providers/*                        │
│       └── auth + usage fetch logic      │
└─────────────────────────────────────────┘
```

## Data Flow

```
User Action → useMenu → providerById[id].login()
                ↓
          config.providers updated
                ↓
    providerById[id].accounts reacts
                ↓
        useView html recomputes
                ↓
           Webview re-renders
```

## Key Principles

1. **No upward calls**: Lower layers cannot call upper layers
2. **providerById is the interface**: View layers read from `providerById`, never call `useProviders` methods
3. **Direct method access**: `providerById[id].login()`, `.logout()`, `.rename()`, `.refresh()`
4. **ProviderMeta struct**: Auth type and display info live in `provider.meta`, not flat props
5. **Reactive by default**: All state changes flow through Vue reactivity

## Framework APIs

| API | Purpose | Used In |
|-----|---------|---------|
| `defineConfig` | Reactive configuration | `useConfig` |
| `useWebviewView` | Webview panel | `useView` |
| `ref/computed/watch` | Vue reactivity | All composables |

## Initialization Order

```typescript
// extension.ts
const { refresh } = useProviders()    // 1. Sets up providers + auto-refresh
const { show } = useMenu()            // 2. Menu uses providerById internally
useView()                             // 3. Registers webview, reads providerById

useCommand('unifyQuotaMonitor.settings', () => show())
useCommand('unifyQuotaMonitor.refresh', () => refresh())
refresh()                             // 4. Initial data load
```

#### Provider Registration
```typescript
// use-providers.ts
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
  openaiCodex: useOpenaiCodexProvider(),
}
```

#### Config-Driven Provider Example (Zhipu)
```typescript
// use-zhipu-provider.ts
export const useZhipuProvider = defineService(() =>
  useBigModelProvider({
    id: 'zhipu',
    name: 'Zhipu AI',
    keyPrefix: 'sk.',
    apiUrl: 'https://bigmodel.cn/api/monitor/usage/quota/limit',
  })
)
```

### Code Rules

- **Unidirectional Data Flow**: Lower layers never call upper layers (e.g., domain layer cannot call view layer)
- **Provider Encapsulation**: Provider auth/usage logic in composables (`use-*-provider.ts`)
- **Watch**: Use Vue `watch` for reactive dependencies, avoid deep Proxy traversal

### Related Documentation

- [Composables](./composables.md) - Core building blocks
- [Providers](./providers.md) - Provider implementations
- [Authentication](./authentication.md) - OAuth and Token management
- [UI/UX](./ui-ux.md) - Design guidelines