# Composables

Composables are the core building blocks of this VS Code extension, following the `reactive-vscode` framework patterns.

## Overview

| Composable | Layer | Purpose |
|------------|-------|---------|
| `useConfig` | Model | Configuration management |
| `useProviders` | Controller | Provider aggregation & global refresh |
| `useMenu` | View | QuickPick menu interactions |
| `useView` | View | Webview panel & HTML generation |

## useConfig

**File**: `src/composables/use-config.ts`

Configuration management using `defineConfig` from reactive-vscode.

```typescript
export function useConfig() {
  return defineConfig<Config>('unifyQuotaMonitor')
}
```

### Config Structure

```typescript
interface Config {
  providers: Record<ProviderId, ConfigAccount[]>
  autoRefreshEnabled: boolean
  autoRefreshIntervalMs: number
}
```

### Usage

```typescript
const config = useConfig()

// Read
const accounts = config.providers['zhipu']

// Write
config.providers['zhipu'] = [...accounts, newAccount]
```

## useProviders

**File**: `src/composables/use-providers.ts`

Aggregates all provider instances and manages global refresh.

```typescript
export interface UseProvidersReturn {
  providerById: Record<ProviderId, UseBaseProviderReturn>
  refresh: (providerId?: ProviderId, accountIndex?: number) => Promise<void>
}
```

### providerById

Direct access to all provider instances:

```typescript
const { providerById } = useProviders()

// Access specific provider
providerById['zhipu'].login()
providerById['kimiCode'].logout(0)
providerById['zhipu'].rename(0, 'Work')
providerById['zhipu'].accounts.value  // reactive accounts
```

### refresh

Global refresh with optional targeting:

```typescript
const { refresh } = useProviders()

await refresh()                    // Refresh all
await refresh('zhipu')            // Refresh specific provider
await refresh('zhipu', 0)         // Refresh specific account
```

### Auto Refresh

Automatically sets up interval based on config:

```typescript
watch(
  [() => config.autoRefreshEnabled, () => config.autoRefreshIntervalMs],
  ([enabled, intervalMs]) => {
    if (enabled) {
      timer = setInterval(() => refresh(), intervalMs)
    }
  }
)
```

## useMenu

**File**: `src/composables/use-menu.ts`

QuickPick menu interactions for account management.

```typescript
export const useMenu = defineService(() => {
  const { providerById } = useProviders()
  // ...
  return { show }
})
```

### show

Opens the main settings menu (wraps internal `showSettingsMenu`):

```typescript
const { show } = useMenu()
show()  // opens QuickPick with all accounts + Add/Refresh actions
```

**Internal Flow**:
1. `showSettingsMenu` — lists all provider accounts with refresh/add buttons
2. On account selection → `showAccountActions`
3. On Add → `showAddAccount` → provider selection → API key input or OAuth flow
4. On Help button → opens provider documentation URL

### showAddAccount

Internal function for adding a new account:

- API Key providers: shows `showInputBoxWithBack` with prefix validation
- OAuth providers: calls `provider.login()` directly (opens browser)

### showAccountActions

Internal function for managing a specific account:

- **Set Name**: Rename via `showInputBoxWithBack`
- **Logout**: Confirm dialog → `provider.logout(index)`
- **← Back**: Returns to `showSettingsMenu`

## useView

**File**: `src/composables/use-view.ts`

Webview panel registration and HTML generation.

```typescript
export function useView() {
  const { providerById } = useProviders()
  
  const html = computed(() => {
    // Generate HTML from providerById
  })
  
  useWebviewView('unifyQuotaMonitor.usageView', html, {
    webviewOptions: { enableScripts: true }
  })
}
```

### HTML Generation

- Reactive: `html` computed updates when `providerById` changes
- No return value: Composable only registers the webview
- Scroll preservation: Maintains scroll position across updates

### Data Access

```typescript
const providers = computed(() =>
  (Object.keys(providerById) as ProviderId[]).map((id) => ({
    id,
    name: providerById[id].meta.name,
    accounts: providerById[id].accounts.value
  }))
)
```

## Layer Constraints

```
┌─────────────────────────────────────────┐
│  View Layer                             │
│  ├── useMenu (QuickPick)                │
│  └── useView (Webview)                  │
│       ↓ can only call providerById       │
├─────────────────────────────────────────┤
│  Controller Layer                       │
│  └── useProviders                       │
│       ↓ can only call useConfig          │
├─────────────────────────────────────────┤
│  Model Layer                            │
│  └── useConfig (defineConfig)           │
│       (no upward calls)                  │
├─────────────────────────────────────────┤
│  Domain Layer                           │
│  └── providers/*                        │
│       (no upward calls)                  │
└─────────────────────────────────────────┘
```
