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
              padding: 0.5em 1em;
                display: flex;
                flex-direction: column;
            }
            .provider-section {
              margin-top: 0;
              margin-bottom: 0;
              padding-bottom: 0;
            }
            .provider-section + .provider-section {
              margin-top: 10px;
              padding-top: 10px;
              border-top: 1px solid var(--vscode-panel-border);
            }
            .provider-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 12px;
                font-weight: 600;
                color: var(--vscode-descriptionForeground);
                margin-bottom: 6px;
            }
            .account-block {
              margin-top: 8px;
              margin-bottom: 0;
            }
            .provider-header + .account-block {
              margin-top: 0;
            }
            .account-label {
                font-size: 11px;
                color: var(--vscode-descriptionForeground);
                margin-bottom: 6px;
                font-weight: 500;
            }
            .account-error {
                color: var(--vscode-errorForeground);
                font-size: 0.8em;
              margin-top: 0.4em;
                word-break: break-all;
            }
            .usage-grid {
              display: flex;
              flex-direction: column;
              gap: 0;
              font-size: 12px;
              line-height: 1.4;
            }
            .usage-section-footer {
              margin-top: 0;
            }
            .quota-item {
              margin-bottom: 6px;
            }
            .quota-item:last-child {
              margin-bottom: 0;
            }
            .quota-item-header {
                display: flex;
                align-items: flex-end;
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
            .quota-item-value-group {
              display: flex;
              align-items: center;
              justify-content: flex-end;
              gap: 4px;
              white-space: nowrap;
              font-variant-numeric: tabular-nums;
            }
            .quota-item-detail-prefix {
              display: inline-flex;
              align-items: center;
              gap: 4px;
            }
            .quota-item-detail-text,
            .quota-item-detail-separator {
              font-size: 10px;
              color: var(--vscode-descriptionForeground);
              opacity: 0.82;
              line-height: 1;
            }
            .quota-item-detail-separator {
              opacity: 0.68;
              display: inline-block;
              transform: translateY(-0.5px);
            }
            .quota-bar {
                box-sizing: content-box;
                width: 100%;
                height: 4px;
                background-color: var(--vscode-gauge-background);
                border-radius: 4px;
                border: 1px solid var(--vscode-gauge-border);
                margin: 4px 0;
            }
            .quota-bit {
                height: 100%;
                background-color: var(--vscode-gauge-foreground);
                border-radius: 4px;
                transition: width 0.3s ease;
            }
            .quota-item.warning .quota-bar {
                background-color: var(--vscode-gauge-warningBackground);
            }
            .quota-item.warning .quota-bar .quota-bit {
                background-color: var(--vscode-gauge-warningForeground);
            }
            .quota-item.error .quota-bar {
                background-color: var(--vscode-gauge-errorBackground);
            }
            .quota-item.error .quota-bar .quota-bit {
                background-color: var(--vscode-gauge-errorForeground);
            }
            .usage-reset {
              font-size: 11px;
                color: var(--vscode-descriptionForeground);
              display: flex;
              align-items: center;
              gap: 3px;
            }
            .empty-state {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                padding: 2em 1.5em;
                color: var(--vscode-descriptionForeground);
                user-select: none;
                -webkit-user-select: none;
                cursor: default;
            }
            .empty-state-icon {
                margin-bottom: 8px;
                color: var(--vscode-editor-foreground);
                display: flex;
                justify-content: center;
            }
            .empty-state-icon svg {
                width: 60px;
                height: 60px;
            }
            .empty-state-title {
                font-size: 1.6em;
                font-weight: 500;
                margin-bottom: 4px;
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
              document.querySelectorAll('.usage-reset[data-reset-time]').forEach(el => {
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
                el.textContent = 'Reset in ' + timeStr;
              });
            }
            setInterval(updateTimers, 1000);
          })();
        </script>
    </body>
    </html>`
  })

  function renderEmptyState(): string {
    return `<div class="empty-state"><div class="empty-state-icon">${iconSvg}</div><div class="empty-state-title">No Active Accounts</div><div class="empty-state-description">Add an account to monitor your quota usage</div></div>`
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
    return list
      .filter((p) => p.accounts.length > 0)
      .map((p) => renderProvider(p, locale))
      .join('')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function renderProvider(provider: ViewProvider, _locale: string): string {
    const hasMultiple = provider.accounts.length > 1
    return `<div class="provider-section"><div class="provider-header"><span>${provider.name}</span></div>${provider.accounts.map((acc) => renderAccount(acc, hasMultiple)).join('')}</div>`
  }

  function renderAccount(account: ViewAccount, showLabel: boolean): string {
    const sharedResetTime = getSharedResetTime(account.usage)
    const errorHtml = account.error
      ? `<div class="account-error">${account.error}</div>`
      : ''
    const usageHtml = account.usage
      .map((u) => renderUsageItem(u, Boolean(sharedResetTime)))
      .join('')
    const footerHtml = sharedResetTime
      ? `<div class="usage-section-footer">${renderResetHtml(sharedResetTime)}</div>`
      : ''
    if (!showLabel)
      return `<div class="account-block">${errorHtml}<div class="usage-grid">${usageHtml}</div>${footerHtml}</div>`
    return `<div class="account-block"><div class="account-label">${account.name ?? account.fallbackName}</div>${errorHtml}<div class="usage-grid">${usageHtml}</div>${footerHtml}</div>`
  }

  function getUsageResetTime(usage: UsageItem): string | undefined {
    if (
      isPercentageUsage(usage) ||
      isIncludedUsage(usage) ||
      isAmountUsage(usage)
    )
      return usage.resetTime
    return undefined
  }

  function getSharedResetTime(list: UsageItem[]): string | undefined {
    const resetTimes = list
      .map((usage) => getUsageResetTime(usage))
      .filter((resetTime): resetTime is string => Boolean(resetTime))

    if (resetTimes.length === 0) return undefined

    const first = resetTimes[0]
    return resetTimes.every((resetTime) => resetTime === first)
      ? first
      : undefined
  }

  function renderResetHtml(resetTime: string): string {
    const date = new Date(resetTime)
    const diffMs = date.getTime() - Date.now()
    if (diffMs <= 0) return `<div class="usage-reset">Resetting...</div>`
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
    return `<div class="usage-reset" data-reset-time="${resetTime}">Reset in ${timeStr}</div>`
  }

  function getQuotaStatusClass(percent: number): string {
    const clamped = Math.min(100, percent)
    if (clamped >= 90) return 'error'
    if (clamped >= 75) return 'warning'
    return ''
  }

  function progressBar(percent: number): string {
    const clamped = Math.min(100, percent)
    return `<div class="quota-bar"><div class="quota-bit" style="width: ${clamped}%"></div></div>`
  }

  function renderUsageDetailPrefix(detail?: {
    used: number
    total: number
  }): string {
    return detail
      ? `<span class="quota-item-detail-prefix"><span class="quota-item-detail-text">${detail.used} / ${detail.total}</span><span class="quota-item-detail-separator">=</span></span>`
      : ''
  }

  function renderUsageItem(
    usage: UsageItem,
    hideReset: boolean = false
  ): string {
    if (isBalanceUsage(usage)) {
      const unit = usage.unit ?? ''
      const amountStr = `${unit}${Number(usage.amount).toFixed(2)}`
      return `<div class="quota-item"><div class="quota-item-header"><span class="quota-item-label">${usage.name}</span><span class="quota-item-value">${amountStr}</span></div></div>`
    } else if (isIncludedUsage(usage)) {
      const resetHtml =
        !hideReset && usage.resetTime ? renderResetHtml(usage.resetTime) : ''
      return `<div class="quota-item"><div class="quota-item-header"><span class="quota-item-label">${usage.name}</span><span class="quota-item-value">Included</span></div>${progressBar(0)}${resetHtml}</div>`
    } else if (isPercentageUsage(usage)) {
      const pct = Math.min(100, usage.percentage)
      const resetHtml =
        !hideReset && usage.resetTime ? renderResetHtml(usage.resetTime) : ''
      const detailPrefixHtml = renderUsageDetailPrefix(usage.detail)
      const statusClass = getQuotaStatusClass(pct)
      return `<div class="quota-item ${statusClass}"><div class="quota-item-header"><span class="quota-item-label">${usage.name}</span><span class="quota-item-value-group">${detailPrefixHtml}<span class="quota-item-value">${pct}%</span></span></div>${progressBar(pct)}${resetHtml}</div>`
    } else if (isAmountUsage(usage)) {
      const pct =
        usage.total > 0 ? Math.round((usage.used / usage.total) * 100) : 0
      const displayValue = `${usage.used} / ${usage.total}`
      const resetHtml =
        !hideReset && usage.resetTime ? renderResetHtml(usage.resetTime) : ''
      const statusClass = getQuotaStatusClass(pct)
      return `<div class="quota-item ${statusClass}"><div class="quota-item-header"><span class="quota-item-label">${usage.name}</span><span class="quota-item-value">${displayValue}</span></div>${progressBar(pct)}${resetHtml}</div>`
    } else {
      return ''
    }
  }

  useWebviewView('quotaMonitor.usageView', html, {
    webviewOptions: { enableScripts: true }
  })
}
