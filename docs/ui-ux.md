# UI/UX

## Design Principles

- **Clean**: No unnecessary decorations
- **Theme-aware**: VS Code theme variables
- **Responsive**: Relative units (`em`, `%`)
- **Consistent with Copilot**: GitHub Copilot Status Bar style

## Progress Bar

```css
height: 4px;
border-radius: 4px;
border: 1px solid var(--vscode-gauge-border);
background: var(--vscode-gauge-background);

/* Fill colors */
--vscode-gauge-foreground          /* Normal */
--vscode-gauge-warningForeground   /* ≥75% */
--vscode-gauge-errorForeground     /* ≥90% */
```

## Layout

| Element | Spacing |
|---------|---------|
| Content padding | `0.5em 1em` |
| Provider section margin | `0.6em 0` |
| Provider section padding | `0 0 0.8em 0` |
| Account block margin | `1.2em 0 0.6em` |
| Usage grid gap | `0.2em 1em` |

## Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Provider title | inherit | 600 | `descriptionForeground` |
| Usage values | 0.85em | normal | `descriptionForeground` @ 0.8 opacity |
| Reset time | 0.85em | normal | `descriptionForeground` @ 0.8 opacity |

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
