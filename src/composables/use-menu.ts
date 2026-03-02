import { defineService } from 'reactive-vscode'
import {
  QuickInputButtons,
  QuickPickItemKind,
  ThemeIcon,
  Uri,
  env,
  window
} from 'vscode'
import type { ProviderId } from '../types'
import { useProviders } from './use-providers'
import { showInputBoxWithBack } from '../utils/show-input-box-with-back'

export const useMenu = defineService(() => {
  const { providerById } = useProviders()

  async function showAddAccount(): Promise<void> {
    type ProviderPickItem = {
      label: string
      providerId: ProviderId
      helpUrl?: string
      buttons: readonly { iconPath: ThemeIcon; tooltip: string }[]
    }
    const qp = window.createQuickPick<ProviderPickItem>()
    qp.title = 'Select Provider'
    qp.placeholder = 'Choose a provider to add'
    qp.buttons = [QuickInputButtons.Back]
    qp.items = (Object.keys(providerById) as ProviderId[]).map((id) => {
      const { meta } = providerById[id]
      const helpUrl = meta.login.helpUrl
      return {
        label: meta.name,
        providerId: id,
        helpUrl,
        buttons: helpUrl
          ? [
              {
                iconPath: new ThemeIcon('question'),
                tooltip: 'Open documentation'
              }
            ]
          : []
      }
    })
    return new Promise<void>((resolve) => {
      qp.onDidTriggerButton(async (btn) => {
        if (btn === QuickInputButtons.Back) {
          qp.hide()
          await showSettingsMenu()
          resolve()
        }
      })
      qp.onDidTriggerItemButton((e) => {
        const { helpUrl } = e.item
        if (helpUrl) env.openExternal(Uri.parse(helpUrl))
      })
      qp.onDidAccept(async () => {
        const selected = qp.activeItems[0]
        qp.hide()
        if (!selected) {
          resolve()
          return
        }
        const provider = providerById[selected.providerId]
        try {
          if (provider.meta.login.type === 'apiKey') {
            const prefix = provider.meta.login.apiKeyPrefix ?? 'sk'
            await showInputBoxWithBack({
              title: `Enter ${provider.meta.name} API Key`,
              prompt: `Format: ${prefix}...`,
              password: true,
              placeholder: `${prefix}...`,
              validate: (v: string) => {
                if (!v?.trim()) return 'API Key is required'
                if (!v.startsWith(prefix))
                  return `Key must start with ${prefix}`
                return null
              },
              onBack: () => showAddAccount(),
              onAccept: async (apiKey) => {
                await provider.login(apiKey.trim())
              }
            })
          } else {
            await provider.login()
          }
        } catch (e: any) {
          window.showErrorMessage(e?.message ?? 'Login failed')
        }
        resolve()
      })
      qp.onDidHide(() => resolve())
      qp.show()
    })
  }

  async function showSettingsMenu(): Promise<void> {
    const items: {
      label: string
      description?: string
      kind?: QuickPickItemKind
      providerId?: ProviderId
      accountIndex?: number
    }[] = []

    for (const providerId of Object.keys(providerById) as ProviderId[]) {
      const accounts = providerById[providerId].accounts.value
      if (accounts.length === 0) continue
      const providerName = providerById[providerId].meta.name
      items.push({ label: providerName, kind: QuickPickItemKind.Separator })
      for (let i = 0; i < accounts.length; i++) {
        const acc = accounts[i]
        items.push({
          label: acc.name ?? acc.fallbackName,
          providerId,
          accountIndex: i
        })
      }
    }

    if (items.length > 0) {
      items.push({ label: '', kind: QuickPickItemKind.Separator })
    }
    items.push({
      label: 'Add Account',
      description: 'Add a new provider account'
    })

    const selected = await window.showQuickPick(items, {
      title: 'Settings',
      placeHolder: 'Manage your provider accounts'
    })
    if (!selected) return

    if (
      selected.providerId !== undefined &&
      selected.accountIndex !== undefined
    ) {
      await showAccountActions(selected.providerId, selected.accountIndex)
    } else if (selected.label === 'Add Account') {
      await showAddAccount()
    }
  }

  async function showAccountActions(
    providerId: ProviderId,
    accountIndex: number
  ): Promise<void> {
    const providerName = providerById[providerId].meta.name
    const accounts = providerById[providerId].accounts.value
    const account = accounts[accountIndex]
    if (!account) return

    const qp = window.createQuickPick()
    qp.title = `${providerName} - ${account.name ?? account.fallbackName}`
    qp.placeholder = 'Select an action'
    qp.buttons = [QuickInputButtons.Back]
    qp.items = [
      {
        label: 'Set Name',
        description: 'Change the display name for this account'
      },
      { label: 'Logout', description: 'Remove this account' }
    ]

    return new Promise<void>((resolve) => {
      qp.onDidTriggerButton(async (btn) => {
        if (btn === QuickInputButtons.Back) {
          qp.hide()
          await showSettingsMenu()
          resolve()
        }
      })
      qp.onDidAccept(async () => {
        const selected = qp.activeItems[0]
        qp.hide()
        if (!selected) {
          resolve()
          return
        }

        if (selected.label === 'Set Name') {
          await showInputBoxWithBack({
            title: 'Account Name',
            prompt: 'Enter a display name for this account',
            value: account.name,
            placeholder: account.fallbackName,
            onBack: () => showAccountActions(providerId, accountIndex),
            onAccept: (name) => {
              providerById[providerId].rename(
                accountIndex,
                name.trim() ? name : account.fallbackName
              )
            }
          })
        } else if (selected.label === 'Logout') {
          const displayName = account.name ?? account.fallbackName
          const confirmed = await window.showWarningMessage(
            `Logout from ${providerName} - ${displayName}?`,
            'Confirm',
            'Cancel'
          )
          if (confirmed === 'Confirm') {
            providerById[providerId].logout(accountIndex)
            window.showInformationMessage(
              `Logged out from ${providerName} - ${displayName}`
            )
          }
          await showSettingsMenu()
        }
        resolve()
      })
      qp.onDidHide(() => resolve())
      qp.show()
    })
  }

  return { show: showSettingsMenu }
})
