import { computed, useWebviewView } from 'reactive-vscode'
import { env } from 'vscode'
import type { ProviderId, UsageItem, ViewAccount, ViewProvider } from '../types'
import { useProviders } from './use-providers'
import {
  isAmountUsage,
  isBalanceUsage,
  isIncludedUsage,
  isPercentageUsage
} from '../common'
import iconSvg from '../../images/icon.svg?raw'

export function useView() {
  const { providerById } = useProviders()

  const providers = computed(() =>
    (Object.keys(providerById) as ProviderId[]).map((id) => ({
      id,
      name: providerById[id].meta.name,
      accounts: providerById[id].accounts.value
    }))
  )

  const viewProviders = computed(() => {
    if (import.meta.env.VITE_QUOTA_MONITOR_MOCK_VIEW === 'true')
      return createMockProviders()

    return providers.value
  })

  const html = computed(() => {
    const hasAccounts = viewProviders.value.some((p) => p.accounts?.length > 0)
    const htmlLocale = env.language || 'en'

    return `<!DOCTYPE html>
    <html lang="${htmlLocale}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quota</title>
        <style>
            * { box-sizing: border-box; }
            body {
                padding: 0;
                margin: 0;
                color: var(--vscode-foreground);
                font-family: var(--vscode-font-family);
                font-size: var(--vscode-font-size);
              line-height: 1.6;
                background-color: transparent;
            }
            .container {
                display: flex;
                flex-direction: column;
                height: 100vh;
            }
            .content {
                flex: 1;
                overflow-y: auto;
              padding: 8px 16px 16px;
                display: flex;
                flex-direction: column;
            }
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
            .provider-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 13px;
                line-height: 18px;
                font-weight: 600;
                color: var(--vscode-foreground);
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
            .account-label {
              font-size: 12px;
              line-height: 18px;
              color: var(--vscode-foreground);
              font-weight: 500;
            }
            .account-error {
                color: var(--vscode-errorForeground);
                font-size: 12px;
                line-height: 16px;
                word-break: break-all;
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
              color: var(--vscode-foreground);
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
              min-width: 0;
            }
            .quota-value-group {
              display: inline-flex;
              align-items: baseline;
              gap: 4px;
              white-space: nowrap;
              font-variant-numeric: tabular-nums;
            }
            .quota-value {
              font-size: 20px;
              line-height: 24px;
              font-weight: 700;
              color: var(--vscode-foreground);
            }
            .quota-value-suffix {
              font-size: 12px;
              line-height: 16px;
              color: var(--vscode-descriptionForeground);
            }
            .quota-bar {
                width: 100%;
                height: 4px;
                background-color: var(--vscode-editorWidget-border);
                border-radius: 4px;
            }
            .provider-accounts > .account-block:last-child .usage-grid > .quota-indicator:last-child .quota-bar {
              margin-bottom: 4px;
            }
            .quota-bit {
                height: 100%;
                background-color: var(--vscode-focusBorder);
                border-radius: 4px;
                transition: width 0.3s ease;
            }
            .quota-reset {
              font-size: 12px;
              line-height: 16px;
                color: var(--vscode-descriptionForeground);
              white-space: nowrap;
            }
            .empty-state {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
              gap: 8px;
                text-align: center;
                padding: 2em 1.5em;
                color: var(--vscode-descriptionForeground);
                user-select: none;
                -webkit-user-select: none;
                cursor: default;
            }
            .empty-state-icon {
                color: var(--vscode-editor-foreground);
                display: flex;
                justify-content: center;
            }
            .empty-state-copy {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 4px;
            }
            .empty-state-icon svg {
                width: 60px;
                height: 60px;
            }
            .empty-state-title {
                font-size: 1.6em;
                font-weight: 500;
                color: var(--vscode-editor-foreground);
            }
            .empty-state-description {
                font-size: 1em;
                color: var(--vscode-descriptionForeground);
                line-height: 1.5;
                max-width: 320px;
                margin: 0 auto;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="content">
            ${!hasAccounts ? renderEmptyState() : renderProviders(viewProviders.value, htmlLocale)}
            </div>
        </div>
        <script>
          (function() {
            const content = document.querySelector('.content');
            const scrollInfo = sessionStorage.getItem('quotaMonitorScroll');
            if (content && scrollInfo) {
              try {
                const { top, atBottom } = JSON.parse(scrollInfo);
                content.scrollTop = atBottom ? content.scrollHeight : top;
              } catch {}
            }
            if (content) {
              content.addEventListener('scroll', function() {
                const atBottom = Math.abs(content.scrollHeight - content.scrollTop - content.clientHeight) < 2;
                sessionStorage.setItem('quotaMonitorScroll', JSON.stringify({ top: content.scrollTop, atBottom }));
              });
            }
            function updateTimers() {
              const now = new Date();
              document.querySelectorAll('.quota-reset[data-reset-time]').forEach(el => {
                const targetStr = el.getAttribute('data-reset-time');
                if (!targetStr) return;
                const target = new Date(targetStr);
                const diffMs = target.getTime() - now.getTime();
                if (diffMs <= 0) {
                  el.textContent = 'Resetting...';
                  return;
                }
                const totalHours = Math.floor(diffMs / 3600000);
                const days = Math.floor(totalHours / 24);
                const hours = totalHours % 24;
                const mins = Math.floor((diffMs % 3600000) / 60000);
                const secs = Math.floor((diffMs % 60000) / 1000);
                const timeStr = days > 0 ? (days + 'd ' + hours + 'h') : totalHours > 0 ? (totalHours + 'h ' + mins + 'm') : (mins + 'm ' + secs + 's');
                el.textContent = 'Resets in ' + timeStr;
              });
            }
            setInterval(updateTimers, 1000);
          })();
        </script>
    </body>
    </html>`
  })

  function renderEmptyState(): string {
    return `<div class="empty-state"><div class="empty-state-icon">${iconSvg}</div><div class="empty-state-copy"><div class="empty-state-title">No Active Accounts</div><div class="empty-state-description">Add an account to monitor your quota usage</div></div></div>`
  }

  function createMockProviders(): ViewProvider[] {
    const futureReset = (
      days: number,
      hours: number = 0,
      minutes: number = 0
    ): string => {
      const date = new Date()
      date.setDate(date.getDate() + days)
      date.setHours(date.getHours() + hours)
      date.setMinutes(date.getMinutes() + minutes)
      return date.toISOString()
    }

    return [
      {
        name: providerById.githubCopilot.meta.name,
        accounts: [
          {
            name: 'Work',
            fallbackName: 'Work',
            usage: [
              {
                name: 'Inline Suggestions',
                included: true,
                resetTime: futureReset(4)
              },
              {
                name: 'Chat messages',
                included: true,
                resetTime: futureReset(4)
              },
              {
                name: 'Premium requests',
                percentage: 92.4,
                detail: { used: 92, total: 100 },
                resetTime: futureReset(4)
              }
            ]
          },
          {
            name: 'Personal',
            fallbackName: 'Personal',
            usage: [
              {
                name: 'Inline Suggestions',
                included: true,
                resetTime: futureReset(1, 8)
              },
              {
                name: 'Chat messages',
                included: true,
                resetTime: futureReset(1, 8)
              },
              {
                name: 'Included premium requests',
                percentage: 23.9,
                detail: { used: 24, total: 100 },
                resetTime: futureReset(1, 8)
              }
            ]
          }
        ]
      },
      {
        name: providerById.googleGemini.meta.name,
        accounts: [
          {
            name: 'Studio',
            fallbackName: 'Studio',
            usage: [
              {
                name: 'Requests',
                used: 742,
                total: 1000,
                resetTime: futureReset(0, 14)
              },
              {
                name: 'Tokens',
                used: 870000,
                total: 1000000,
                resetTime: futureReset(0, 14)
              }
            ]
          }
        ]
      },
      {
        name: providerById.openRouter.meta.name,
        accounts: [
          {
            name: 'Primary',
            fallbackName: 'Primary',
            usage: [
              { name: 'Balance', amount: 12.5, unit: '$' },
              {
                name: 'Requests',
                used: 420,
                total: 1000,
                resetTime: futureReset(0, 6, 30)
              }
            ]
          }
        ]
      },
      {
        name: providerById.claudeCode.meta.name,
        accounts: [
          {
            name: 'Staging',
            fallbackName: 'Staging',
            usage: [
              { name: 'Messages', percentage: 67, resetTime: futureReset(2) }
            ],
            error: 'Re-authentication required'
          }
        ]
      }
    ]
  }

  function renderProviders(list: ViewProvider[], locale: string): string {
    const activeProviders = list.filter((p) => p.accounts.length > 0)
    return activeProviders
      .map((provider, index) => {
        const divider = index === 0 ? '' : '<div class="provider-divider" aria-hidden="true"></div>'
        return `${divider}${renderProvider(provider, locale)}`
      })
      .join('')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function renderProvider(provider: ViewProvider, _locale: string): string {
    return `<div class="provider-section"><div class="provider-header"><span>${provider.name}</span></div><div class="provider-accounts">${provider.accounts.map((acc) => renderAccount(acc, provider.accounts.length > 1)).join('')}</div></div>`
  }

  function renderAccount(account: ViewAccount, showFallbackLabel: boolean): string {
    const errorHtml = account.error
      ? `<div class="account-error">${account.error}</div>`
      : ''
    const labelHtml = showFallbackLabel
      ? `<div class="account-label">${account.name ?? account.fallbackName}</div>`
      : ''
    const headerHtml = labelHtml || errorHtml
      ? `<div class="account-header">${labelHtml}${errorHtml}</div>`
      : ''
    const usageHtml = account.usage
      .map((u) => renderUsageItem(u))
      .join('')
    return `<div class="account-block">${headerHtml}<div class="usage-grid">${usageHtml}</div></div>`
  }

  function renderResetHtml(resetTime: string): string {
    const date = new Date(resetTime)
    const diffMs = date.getTime() - Date.now()
    if (diffMs <= 0) return `<span class="quota-reset">Resetting...</span>`
    const totalHours = Math.floor(diffMs / 3600000)
    const days = Math.floor(totalHours / 24)
    const hours = totalHours % 24
    const mins = Math.floor((diffMs % 3600000) / 60000)
    const secs = Math.floor((diffMs % 60000) / 1000)
    const timeStr =
      days > 0
        ? `${days}d ${hours}h`
        : totalHours > 0
          ? `${totalHours}h ${mins}m`
          : `${mins}m ${secs}s`
    return `<span class="quota-reset" data-reset-time="${resetTime}">Resets in ${timeStr}</span>`
  }

  function progressBar(percent: number): string {
    const clamped = Math.min(100, percent)
    return `<div class="quota-bar"><div class="quota-bit" style="width: ${clamped}%"></div></div>`
  }

  function renderQuotaDetails(
    value: string,
    suffix: string,
    resetHtml: string
  ): string {
    const suffixHtml = suffix
      ? `<span class="quota-value-suffix">${suffix}</span>`
      : ''

    return `<div class="quota-details"><div class="quota-percentage"><span class="quota-value-group"><span class="quota-value">${value}</span>${suffixHtml}</span></div>${resetHtml}</div>`
  }

  function renderUsageItem(usage: UsageItem): string {
    if (isBalanceUsage(usage)) {
      const unit = usage.unit ?? ''
      const amountStr = `${unit}${Number(usage.amount).toFixed(2)}`
      return `<div class="quota-indicator balance"><div class="quota-title">${usage.name}</div>${renderQuotaDetails(amountStr, '', '')}</div>`
    } else if (isIncludedUsage(usage)) {
      const resetHtml = usage.resetTime ? renderResetHtml(usage.resetTime) : ''
      return `<div class="quota-indicator included"><div class="quota-title">${usage.name}</div>${renderQuotaDetails('Included', '', resetHtml)}</div>`
    } else if (isPercentageUsage(usage)) {
      const pct = Math.min(100, usage.percentage)
      const resetHtml = usage.resetTime ? renderResetHtml(usage.resetTime) : ''
      return `<div class="quota-indicator"><div class="quota-title">${usage.name}</div>${renderQuotaDetails(String(pct), '% used', resetHtml)}${progressBar(pct)}</div>`
    } else if (isAmountUsage(usage)) {
      const pct =
        usage.total > 0 ? Math.round((usage.used / usage.total) * 100) : 0
      const resetHtml = usage.resetTime ? renderResetHtml(usage.resetTime) : ''
      return `<div class="quota-indicator"><div class="quota-title">${usage.name}</div>${renderQuotaDetails(String(pct), '% used', resetHtml)}${progressBar(pct)}</div>`
    } else {
      return ''
    }
  }

  useWebviewView('quotaMonitor.usageView', html, {
    webviewOptions: { enableScripts: true }
  })
}
