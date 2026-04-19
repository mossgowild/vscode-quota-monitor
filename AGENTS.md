# Quota Monitor

VS Code extension using `reactive-vscode` to display real-time AI provider usage quotas in a sidebar panel.

## Quick Start

```bash
npm install          # Install dependencies
npm run build        # Build extension
npm exec tsc --noEmit # Type check
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

> UI should follow native VS Code / Copilot patterns when a matching workbench component exists. Quota bars should mirror the VS Code chat usage gauge (`quota-item` / `quota-bar` / `quota-bit`), use the full `gauge-*` token set including warning and error track backgrounds, keep a single-column quota stack in the sidebar, use a tooltip-like 12px rhythm for quota rows with 11px reset text, override the webview's global `border-box` on `.quota-bar` so the sidebar gauge uses the same 4px content-box model as Copilot's popup gauge, prefer a section-level footer note when multiple quota rows share the same reset time, and separate provider sections with a tooltip-like section divider rather than a bottom border on every block.

> For UI testing in development, `npm run dev` builds in Vite `development` mode and enables the built-in multi-provider, multi-account mock preview by default. Set `VITE_QUOTA_MONITOR_MOCK_VIEW=false` to inspect real account data in dev.

> **README.md** is the VS Code Marketplace listing. Keep it user-focused: features, supported providers, how to add accounts. No internal implementation details (commands IDs, config keys schema, build steps).

