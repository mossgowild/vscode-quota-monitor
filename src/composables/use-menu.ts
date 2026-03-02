import { defineService } from 'reactive-vscode'
import { QuickInputButtons, QuickPickItemKind, ThemeIcon, Uri, env, window } from 'vscode'
import type { ProviderId } from '../types'
import { useProviders } from './use-providers'

export const useMenu = defineService(() => {
  const { providersMap } = useProviders()

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
    qp.items = (Object.keys(providersMap) as ProviderId[]).map((id) => {
      const { meta } = providersMap[id]
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
        const provider = providersMap[selected.providerId]
        try {
          if (provider.meta.login.type === 'apiKey') {
            const prefix = provider.meta.login.apiKeyPrefix ?? 'sk'
            const apiKey = await window.showInputBox({
              title: `Enter ${provider.meta.name} API Key`,
              prompt: `Format: ${prefix}...`,
              password: true,
              ignoreFocusOut: true,
              placeHolder: `${prefix}...`,
              validateInput: (v: string) => {
                if (!v?.trim()) return 'API Key is required'
                if (!v.startsWith(prefix)) return `Key must start with ${prefix}`
                return null
              }
            })
            await provider.login(apiKey?.trim())
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

    for (const providerId of Object.keys(providersMap) as ProviderId[]) {
      const accounts = providersMap[providerId].accounts.value
      if (accounts.length === 0) continue
      const providerName = providersMap[providerId].meta.name
      items.push({ label: providerName, kind: QuickPickItemKind.Separator })
      for (let i = 0; i < accounts.length; i++) {
        const acc = accounts[i]
        items.push({
          label: acc.name,
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
    const providerName = providersMap[providerId].meta.name
    const accounts = providersMap[providerId].accounts.value
    const account = accounts[accountIndex]
    if (!account) return

    const qp = window.createQuickPick()
    qp.title = `${providerName} - ${account.name}`
    qp.placeholder = 'Select an action'
    qp.buttons = [QuickInputButtons.Back]
    qp.items = [
      { label: '$(edit) Set Name', description: 'Change the display name for this account' },
      { label: '$(trash) Logout', description: 'Remove this account' }
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
        if (!selected) { resolve(); return }

        if (selected.label === '$(edit) Set Name') {
          const name = await window.showInputBox({
            title: 'Account Name',
            prompt: 'Enter a display name for this account',
            value: account.name,
            placeHolder: `Current: ${account.name}`
          })
          if (name !== undefined) providersMap[providerId].rename(accountIndex, name)
        } else if (selected.label === '$(trash) Logout') {
          const confirmed = await window.showWarningMessage(
            `Logout from ${providerName} - ${account.name}?`,
            'Confirm',
            'Cancel'
          )
          if (confirmed === 'Confirm') {
            providersMap[providerId].logout(accountIndex)
            window.showInformationMessage(`Logged out from ${providerName} - ${account.name}`)
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
