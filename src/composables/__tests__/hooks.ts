// VS Code Test CLI global setup/teardown
// Activates reactive-vscode context and clears configuration

import { defineExtension } from 'reactive-vscode'
import { ConfigurationTarget, ExtensionMode, Uri, workspace } from 'vscode'

/* eslint-disable @typescript-eslint/naming-convention */
const CONFIG_SECTION = 'quotaMonitor'

/**
 * Activates the extension context for reactive-vscode.
 * Must be called before any defineConfig / defineService usage.
 */
async function activateExtensionContext() {
  const { activate } = defineExtension(() => {})

  await activate({
    subscriptions: [],
    extensionPath: __dirname,
    extensionUri: Uri.file(__dirname),
    globalStoragePath: '/tmp/uqm-test-global',
    globalStorageUri: Uri.file('/tmp/uqm-test-global'),
    storagePath: '/tmp/uqm-test-storage',
    storageUri: Uri.file('/tmp/uqm-test-storage'),
    logPath: '/tmp/uqm-test-logs',
    logUri: Uri.file('/tmp/uqm-test-logs'),
    extensionMode: ExtensionMode.Test,
    secrets: {
      get: async () => undefined,
      store: async () => {},
      delete: async () => {},
      onDidChange: () => ({ dispose: () => {} }),
    },
  } as any)
}

/**
 * Clears all extension configuration.
 */
async function clearConfig() {
  const ws = workspace.getConfiguration(CONFIG_SECTION)
  await Promise.all([
    ws.update('providers', undefined, ConfigurationTarget.Global),
    ws.update('autoRefreshEnabled', undefined, ConfigurationTarget.Global),
    ws.update('autoRefreshIntervalMs', undefined, ConfigurationTarget.Global),
  ])
}

export async function mochaGlobalSetup() {
  await activateExtensionContext()
  await clearConfig()
}

export async function mochaGlobalTeardown() {
  await clearConfig()
}
