# Quota Monitor

VS Code extension using `reactive-vscode` to display real-time AI provider usage quotas in a sidebar panel.

## Quick Start

```bash
npm install          # Install dependencies
npm run build        # Build extension
npm exec -- tsc --noEmit # Type check
npm run test         # Run tests in Docker
F5                   # Start debugging
```

## Commands

| ID | Title | Description |
|---|---|---|
| `quotaMonitor.refresh` | Refresh all quota data |
| `quotaMonitor.settings` | Open account menu |

## Documentation

| Topic | File | Audience |
|---|---|---|
| User-facing description | [README.md](./README.md) | End users / Marketplace |
| Coding Guidelines | [docs/coding-guidelines.md](./docs/coding-guidelines.md) | Developers |
| Architecture | [docs/architecture.md](./docs/architecture.md) | Developers |
| Composables | [docs/composables.md](./docs/composables.md) | Developers |
| Providers | [docs/providers.md](./docs/providers.md) | Developers |
| Authentication | [docs/authentication.md](./docs/authentication.md) | Developers |
| UI/UX | [docs/ui-ux.md](./docs/ui-ux.md) | Developers |
| Testing | [docs/docker-testing.md](./docs/docker-testing.md) | Developers |

> UI should follow native VS Code / Copilot patterns when a matching workbench component exists. Quota rows should mirror the VS Code 1.119 chat status structure (`quota-indicator` / `quota-title` / `quota-details` / `quota-bar` / `quota-bit` / `quota-reset`), keep the single-column sidebar stack, use `13px` titles, `20px` values, `12px` reset text, use `editorWidget-border` for the 4px track and `focusBorder` for the fill, keep resets inline on each quota row instead of collapsing them into a shared footer, avoid per-quota card borders or inner card padding, and separate provider sections with a tooltip-like divider instead of a bottom border on every block.

> For UI testing in development, `npm run dev` builds in Vite `development` mode and enables the built-in multi-provider, multi-account mock preview by default. Set `VITE_QUOTA_MONITOR_MOCK_VIEW=false` to inspect real account data in dev.

> **README.md** is the VS Code Marketplace listing. Keep it user-focused: features, supported providers, how to add accounts. No internal implementation details (commands IDs, config keys schema, build steps).

