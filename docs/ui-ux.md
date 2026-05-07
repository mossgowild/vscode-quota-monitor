# UI/UX

## Design Principles

- **Clean**: No unnecessary decorations
- **Theme-aware**: VS Code theme variables
- **Responsive**: Relative units (`em`, `%`)
- **Consistent with VS Code Chat**: Match the native quota gauge used by chat status / usage widgets
- **Single-column in Sidebar**: Keep quota items stacked in one column, but allow the sidebar spacing to stay more open than hover / tooltip UI

## Progress Bar

```css
.provider-section {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.provider-divider {
	padding: 12px 0;
}

.provider-divider::before {
	content: '';
	display: block;
	border-top: 1px solid var(--vscode-editorWidget-border);
}

.provider-accounts {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.account-block {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.account-header {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.usage-grid {
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding-left: 12px;
	font-size: 12px;
	line-height: 16px;
}

.quota-indicator {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.quota-indicator.balance,
.quota-indicator.included {
	gap: 4px;
}

.quota-title {
	font-size: 13px;
	line-height: 18px;
	font-weight: 600;
}

.quota-details {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 12px;
}

.quota-percentage {
	display: flex;
	align-items: baseline;
	gap: 4px;
}


.quota-value {
	font-size: 20px;
	line-height: 24px;
	font-weight: 700;
	color: var(--vscode-foreground);
}

.quota-value-suffix,
.quota-reset {
	font-size: 12px;
	line-height: 16px;
	color: var(--vscode-descriptionForeground);
}

.quota-bar {
	width: 100%;
	height: 4px;
	border-radius: 4px;
	background: var(--vscode-editorWidget-border);
}

.provider-accounts > .account-block:last-child .usage-grid > .quota-indicator:last-child .quota-bar {
	margin-bottom: 4px;
}

.quota-bit {
	height: 100%;
	border-radius: 4px;
	background: var(--vscode-focusBorder);
	transition: width 0.3s ease;
}
```

Use the same DOM naming and inner selector structure as VS Code 1.119 chat status quota rows: `quota-indicator > quota-title + quota-details + quota-bar > quota-bit`. The details row uses `quota-value-group`, `quota-value`, optional `quota-value-suffix`, and optional inline `quota-reset`.

Provider sections have no vertical padding and no inter-section gap. A dedicated divider owns the full section separation with equal padding above and below the line. Providers, account blocks, usage stacks, and empty states all use flex-column gap for vertical spacing instead of layout margins. Provider names are the primary section titles. Account names render as secondary headings when the provider has multiple accounts, and the fallback label is shown when no custom account name exists.

## Layout

| Element | Spacing |
|---------|---------|
| Content padding | `8px 16px 16px` |
| Provider section internal gap | `8px` |
| Provider divider | `12px` top padding + `12px` bottom padding around a 1px line |
| Provider vertical padding | `0` |
| Provider accounts gap | `12px` |
| Account block gap | `8px` |
| Account header gap | `2px` |
| Usage items | single-column stack |
| Usage grid gap | `14px` |
| Usage grid left padding | `12px` |
| Standard quota indicator internal gap | `6px` |
| Included / balance indicator internal gap | `4px` |
| Final trailing quota bar bottom margin | `4px` on the last quota bar in the last account of a provider |
| Empty state gap | `8px` |
| Empty state copy gap | `4px` |

## Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Provider title | `13px` | 600 | `foreground` |
| Quota title | `13px` | 600 | `foreground` |
| Usage value | `20px` | 700 | `foreground` |
| Detail / suffix | `12px` | normal | `descriptionForeground` |
| Account label | `12px` | 500 | `foreground` |
| Reset time | `12px` | normal | `descriptionForeground` |

Use the current VS Code 1.119 quota bar tokens directly: `editorWidget-border` for the track and `focusBorder` for the fill. The row itself has no per-quota outline or inner card padding, and the reset label stays inline in the details row.

## Sorting

- **Provider order**: Config order (`Object.keys` order, matches `PROVIDER_IDS` in `common.ts`)
- **Usage items**: Determined by each provider's `fetchUsage` implementation

## Reset Time Display

Reset labels use `Resets in {time}` while time remains and `Resetting...` after expiry.

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
| `PercentageUsage` | `23.9% used` | Yes |
| `AmountUsage` | `74% used` | Yes |
| `BalanceUsage` | `$12.50` or `¥12.50` | No |
| `IncludedUsage` | `Included` | No |

`BalanceUsage` renders as: `${unit}${amount.toFixed(2)}` — unit prefix (e.g. `$`, `¥`) is optional.

## Empty State

When no accounts are configured, the webview shows a centered empty state:

- Custom SVG icon (`images/icon.svg` inlined via Vite `?raw` import)
- `empty-state` uses flex-column gap `8px`
- `empty-state-copy` wraps title + description with flex-column gap `4px`
- Title: "No Active Accounts"
- Description: "Add an account to monitor your quota usage"

## Scroll Preservation

Scroll position is saved to `sessionStorage` on each scroll event and restored on HTML re-render. Tracks `top` position and `atBottom` flag to handle dynamic content height changes.

## Mock Preview

For UI review in development:

- `npm run dev` builds in Vite `development` mode, which enables the built-in multi-provider, multi-account mock preview by default.
- Set `VITE_QUOTA_MONITOR_MOCK_VIEW=false` when running the dev build to inspect real account data instead.
