# Quota Monitor

> Monitor all your AI provider quotas in one VS Code sidebar panel

![Preview](images/image.png)

Tired of switching between browser tabs to check how much quota you have left? Quota Monitor brings every provider into a single panel that lives right inside your editor — no extra windows, no interruptions.

## Feels right at home in VS Code

The panel uses VS Code's own fonts, spacing, and color tokens, so it blends naturally with any theme — dark, light, or high contrast. Progress bars and text automatically adapt to your active color theme.

## Quick Start

1. Install from the VS Code Extension Marketplace
2. Click the **Quota** icon in the Activity Bar
3. Click the gear icon → **Add Account** → choose a provider and sign in

Your quota usage appears immediately and refreshes every minute in the background.

## Supported Providers

| Provider | What's shown |
|----------|--------------|
| Zhipu AI | Token usage per model |
| Z.AI | Token usage per model |
| Kimi Code | Rate limit usage |
| Google Antigravity | Usage % by model, reset countdown |
| Gemini CLI | Usage % by model, reset countdown |
| GitHub Copilot | Premium request usage, reset countdown |
| DeepSeek | Account balance |
| Moonshot AI | Account balance |
| SiliconFlow | Account balance |
| OpenRouter | Account balance |
| Claude Code | Usage % by model |
| OpenAI Codex | Usage % by resource |

## Features

- **All in one place** — every provider and account in a single sidebar panel
- **Native look & feel** — uses VS Code's theme colors and fonts, matches dark/light/high-contrast themes automatically
- **Color-coded progress bars** — green for normal, yellow at ≥ 75%, red at ≥ 90% used
- **Live reset timers** — countdown updates every second right in the panel
- **Multi-account support** — add multiple accounts per provider, each with a custom alias
- **Background auto-refresh** — runs quietly every 60 seconds without interrupting your work

## Adding an Account

1. Click the gear icon in the Quota panel header
2. Select **Add Account** and pick a provider
3. Sign in:
   - **API key providers** (Zhipu, Z.AI, Kimi, DeepSeek, Moonshot, SiliconFlow, OpenRouter) — paste your API key when prompted
   - **Google providers** (Antigravity, Gemini CLI) — a browser window opens for Google sign-in
   - **Claude Code / OpenAI Codex** — a browser window opens; no manual token copying needed
   - **GitHub Copilot** — uses your existing VS Code GitHub sign-in automatically, nothing extra required
4. Optionally give the account an alias like "Work" or "Personal"

## Managing Accounts

Click the gear icon, select any account, then choose:
- **Set Name** — rename the account alias
- **Logout** — remove the account

## Reading the Display

- **Progress bars** follow your active VS Code color theme automatically
- **Reset timer** counts down live: `4h 25m`, `59m 30s`, `2d 4h`
- **Balance** (DeepSeek, Moonshot, SiliconFlow, OpenRouter) shows a currency amount instead of a bar
- **Single account** — usage shown directly without a header label
- **Multiple accounts** — each account shows its alias above its usage

## Configuration

Search `Quota Monitor` in VS Code Settings to adjust:

| Setting | Description | Default |
|---------|-------------|---------|
| Auto Refresh | Enable background refresh | On |
| Refresh Interval | How often to refresh | 60 seconds |

## FAQ

**Q: How are my credentials stored?**  
A: Credentials are saved in VS Code's own settings storage — the same place other extensions store sensitive data. Nothing is sent to any external server by this extension.

**Q: Why isn't GitHub Copilot showing quota?**  
A: Make sure you're signed into GitHub in VS Code. The extension reuses your existing session — no separate login needed.

**Q: Does auto-refresh affect performance?**  
A: No. Requests are lightweight and run silently in the background.

---

## Contributing

Issues and Pull Requests are welcome!

## License

[MIT](LICENSE)
