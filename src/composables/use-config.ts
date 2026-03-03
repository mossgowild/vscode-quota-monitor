import { defineConfig } from 'reactive-vscode'
import type { Config } from '../types'

const config = defineConfig<Config>('quotaMonitor', null)

export function useConfig() {
  return config
}
