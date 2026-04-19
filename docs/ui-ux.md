# UI/UX

## Design Principles

- **Clean**: No unnecessary decorations
- **Theme-aware**: VS Code theme variables
- **Responsive**: Relative units (`em`, `%`)
- **Consistent with VS Code Chat**: Match the native quota gauge used by chat status / usage widgets
- **Single-column in Sidebar**: Keep quota items stacked in one column, but allow the sidebar spacing to stay more open than hover / tooltip UI

## Progress Bar

```css
.usage-grid {
	display: flex;
	flex-direction: column;
	gap: 0;
	font-size: 12px;
	line-height: 1.4;
}

.quota-item {
	margin-bottom: 6px;
}

.quota-item-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20px;
	margin-bottom: 3px;
}

.quota-item-label {
	color: var(--vscode-foreground);
}

.quota-item-value {
	color: var(--vscode-descriptionForeground);
}

.quota-bar {
	box-sizing: content-box;
	width: 100%;
	height: 4px;
	border-radius: 4px;
	border: 1px solid var(--vscode-gauge-border);
	background: var(--vscode-gauge-background);
	margin: 4px 0;
}

.quota-bit {
	height: 100%;
	border-radius: 4px;
	background: var(--vscode-gauge-foreground);
	transition: width 0.3s ease;
}

.quota-item.warning .quota-bar {
	background: var(--vscode-gauge-warningBackground);
}

.quota-item.warning .quota-bar .quota-bit {
	background: var(--vscode-gauge-warningForeground);
}

.quota-item.error .quota-bar {
	background: var(--vscode-gauge-errorBackground);
}

.quota-item.error .quota-bar .quota-bit {
	background: var(--vscode-gauge-errorForeground);
}
```

Use the same DOM naming and inner selector structure as VS Code chat usage widgets: `quota-item > quota-item-header > quota-bar > quota-bit`.

## Layout

| Element | Spacing |
|---------|---------|
| Content padding | `0.5em 1em` |
| Provider section separator | `10px` top gap + `10px` top padding |
| Provider header bottom margin | `6px` |
| Account block margin | `8px 0 0` |
| Usage items | single-column stack |
| Quota item spacing | `6px` bottom gap |

## Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Provider title | `12px` | 600 | `descriptionForeground` |
| Quota labels | `12px` | inherit | `foreground` |
| Usage values | `12px` | inherit | `descriptionForeground` |
| Account label | `11px` | 500 | `descriptionForeground` |
| Reset time | `11px` | normal | `descriptionForeground` |

In the sidebar panel, override the webview's global `border-box` for `.quota-bar` and use a `4px` content height so the gauge matches Copilot's popup box model instead of rendering thinner inside the webview.

When all quota rows in the same account share a reset time, render that reset once as a section footer instead of repeating it under every bar. This keeps the usage block closer to Copilot's `header + quota stack + footer note` structure.

## Sorting

- **Provider order**: Config order (`Object.keys` order, matches `PROVIDER_IDS` in `common.ts`)
- **Usage items**: Determined by each provider's `fetchUsage` implementation

## Reset Time Display

| Time Remaining | Format |
|----------------|--------|
| > 1 day | `2d 4h` |
| > 1 hour | `2h 30m` |
| < 1 hour | `59m 30s` |
| Elapsed | `Resetting...` |

Updated every second via `setInterval` in webview. Uses `data-reset-time` attribute for client-side countdown.

## Error Display

Account errors shown inline in red:

```html
<div class="account-error">${account.error}</div>
```

## Usage Item Rendering

Three display modes based on `UsageItem` type:

| Type | Display | Progress Bar |
|------|---------|--------------|
| `PercentageUsage` | `75%` | Yes (warns at ≥75%, danger at ≥90%) |
| `AmountUsage` | `750 / 1000` | Yes (calculated from `used/total`) |
| `BalanceUsage` | `$12.50` or `¥12.50` | No |

`BalanceUsage` renders as: `${unit}${amount.toFixed(2)}` — unit prefix (e.g. `$`, `¥`) is optional.

## Empty State

When no accounts are configured, the webview shows a centered empty state:

- Custom SVG icon (`images/icon.svg` inlined via Vite `?raw` import)
- Title: "No Active Accounts"
- Description: "Add an account to monitor your quota usage"

## Scroll Preservation

Scroll position is saved to `sessionStorage` on each scroll event and restored on HTML re-render. Tracks `top` position and `atBottom` flag to handle dynamic content height changes.

## Mock Preview

For UI review in development:

- `npm run dev` builds in Vite `development` mode, which enables the built-in multi-provider, multi-account mock preview by default.
- Set `VITE_QUOTA_MONITOR_MOCK_VIEW=false` when running the dev build to inspect real account data instead.
