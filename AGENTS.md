# Unify Quota Monitor

VS Code extension using `reactive-vscode` to display real-time AI provider usage quotas in a sidebar panel.

## Quick Start

```bash
npm install          # Install dependencies
npm run build        # Build extension
npm run typecheck    # Type check
npm run test         # Run tests in Docker
F5                   # Start debugging
```

## Commands

| ID | Title | Description |
|---|---|---|
| `unifyQuotaMonitor.refresh` | Refresh all quota data |
| `unifyQuotaMonitor.settings` | Open account menu |

## Documentation

| Topic | File | Audience |
|---|---|---|
| User-facing description | [README.md](./README.md) | End users / Marketplace |
| Architecture | [docs/architecture.md](./docs/architecture.md) | Developers |
| Composables | [docs/composables.md](./docs/composables.md) | Developers |
| Providers | [docs/providers.md](./docs/providers.md) | Developers |
| Authentication | [docs/authentication.md](./docs/authentication.md) | Developers |
| UI/UX | [docs/ui-ux.md](./docs/ui-ux.md) | Developers |
| Testing | [docs/docker-testing.md](./docs/docker-testing.md) | Developers |

> **README.md** is the VS Code Marketplace listing. Keep it user-focused: features, supported providers, how to add accounts. No internal implementation details (commands IDs, config keys schema, build steps).

