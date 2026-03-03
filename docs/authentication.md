# Authentication

## Overview

| Provider | Auth Type | Credential Stored |
|----------|-----------|-------------------|
| Zhipu AI | API Key | API Key (`sk.`) |
| Z.AI | API Key | API Key (`zai_`) |
| Kimi Code | API Key | API Key (`sk-kimi`) |
| Google Antigravity | OAuth (PKCE) | refresh_token |
| Gemini CLI | OAuth (PKCE) | refresh_token |
| GitHub Copilot | VS Code Auth | Session reference |
| DeepSeek | API Key | API Key (`sk-`) |
| Moonshot AI | API Key | API Key (`sk-`) |
| SiliconFlow | API Key | API Key (any format) |
| OpenRouter | API Key | API Key (`sk-or-v1-`) |
| Claude Code | OAuth (PKCE) | access_token |
| OpenAI Codex | OAuth (PKCE) | access_token |

## API Key Authentication

**Composables**: `useApiKeyProvider` → individual providers

### Flow

1. `useMenu` shows `showInputBoxWithBack` with prefix validation (supports Back button)
2. Validate API key format via `validate` callback
3. Call `provider.login(apiKey)` to store in config

```typescript
// useMenu - showAddAccount
await showInputBoxWithBack({
  title: `Enter ${provider.meta.name} API Key`,
  prompt: `Format: ${prefix}...`,
  password: true,
  validate: (v) => {
    if (!v?.trim()) return 'API Key is required'
    if (!v.startsWith(prefix)) return `Key must start with ${prefix}`
    return null
  },
  onBack: () => showAddAccount(),
  onAccept: async (apiKey) => {
    await provider.login(apiKey)
  }
})
```

### Prefixes

| Provider | Prefix |
|----------|--------|
| Zhipu AI | `sk.` |
| Z.AI | `zai_` |
| Kimi Code | `sk-kimi` |
| DeepSeek | `sk-` |
| Moonshot AI | `sk-` |
| SiliconFlow | (none) |
| OpenRouter | `sk-or-v1-` |

## OAuth Authentication

**Composables**: `useOAuthProvider` → individual providers (Claude Code, OpenAI Codex)

All OAuth providers use **PKCE** (Proof Key for Code Exchange).

### PKCE OAuth Flow

```typescript
// useOAuthProvider.authenticate()
const state = crypto.randomUUID()
const pkce = generatePkce()        // src/utils/pkce.ts — S256 challenge

// 1. Open browser to provider auth URL
const authUrl = options.getAuthUrl(state, pkce)
await env.openExternal(Uri.parse(authUrl))

// 2. Local HTTP server waits for callback
const code = await waitForCallback(port, path, state)

// 3. Exchange code + verifier for credential
const credential = await options.exchangeCode(code, pkce.verifier)

// 4. Store credential via provider.login(credential)
```

### OAuth Ports

| Provider | Port | Callback Path |
|----------|------|---------------|
| Claude Code | 54545 | `/callback` |
| OpenAI Codex | 1455 | `/auth/callback` |

## Google OAuth Authentication

**Composables**: `useGoogleProvider` → Antigravity, Gemini CLI

Google providers use PKCE flow via `useGoogleProvider` (not `useOAuthProvider`).

### Flow

1. Opens browser to Google OAuth consent screen
2. Local HTTP server on port 51121 receives code
3. Exchange code for `refresh_token` (stored as credential)
4. On each `fetchUsage` call: fetch fresh `access_token` from refresh_token

### Token Refresh (401 handling)

Automatic refresh on 401 response — token updated in config via reactive credential update.

## VS Code Native Auth (GitHub Copilot)

Uses VS Code's built-in `authentication` API:

```typescript
// login: triggers VS Code GitHub sign-in if not signed in
await authentication.getSession('github', ['read:user'], {
  createIfNone: true
})

// fetchUsage: prefers VS Code session, falls back to stored credential
const session = await authentication.getSession('github', ['read:user'], {
  createIfNone: false,
})
const token = session?.accessToken || storedCredential
```

## Storage

All credentials stored in VS Code global settings:

```json
{
  "quotaMonitor.providers": {
    "zhipu": [{ "credential": "sk.xxx", "name": "Work" }],
    "googleAntigravity": [{ "credential": "1//..." }],
    "claudeCode": [{ "credential": "sk-ant-oat01-..." }],
    "githubCopilot": [{ "credential": "vscode-github-session" }]
  }
}
```

**Important**: Config writes must update the entire `providers` object (not sub-keys). VS Code rejects writes to unregistered sub-key paths like `providers.zhipu`.

### Credential Update (Token Refresh)

When Google tokens are refreshed:

```
Provider → config.providers updated → accountsConfig reacts → UI refreshes
```


- [Architecture Design](./architecture.md) - Authentication's role in data flow
- [UI/UX Design](./ui-ux.md) - UI design for authentication error messages
