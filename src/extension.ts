import { defineExtension, defineLogger, useCommand } from 'reactive-vscode'
import { commands } from 'vscode'
import { useView } from './composables/use-view'
import { useProviders } from './composables/use-providers'
import { useMenu } from './composables/use-menu'

const logger = defineLogger('Unify Quota Monitor')

export = defineExtension(() => {
  logger.info('Extension Activated')

  const { refresh } = useProviders()
  const { show } = useMenu()
  useView()

  useCommand('unifyQuotaMonitor.focus', () => commands.executeCommand('unifyQuotaMonitor.usageView.focus'))
  useCommand('unifyQuotaMonitor.settings', () => show())
  useCommand('unifyQuotaMonitor.refresh', () => refresh())

  refresh()

  return () => {
    logger.info('Extension Deactivated')
  }
})
