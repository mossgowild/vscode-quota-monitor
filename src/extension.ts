import { defineExtension, defineLogger, useCommand } from 'reactive-vscode'
import { commands } from 'vscode'
import { useView } from './composables/use-view'
import { useProviders } from './composables/use-providers'
import { useMenu } from './composables/use-menu'

const logger = defineLogger('Quota Monitor')

export = defineExtension(() => {
  logger.info('Extension Activated')

  const { refresh } = useProviders()
  const { show } = useMenu()
  useView()

  useCommand('quotaMonitor.focus', () => commands.executeCommand('quotaMonitor.usageView.focus'))
  useCommand('quotaMonitor.settings', () => show())
  useCommand('quotaMonitor.refresh', () => refresh())

  refresh()

  return () => {
    logger.info('Extension Deactivated')
  }
})
