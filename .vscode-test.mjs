import { defineConfig } from '@vscode/test-cli'
import { existsSync, readdirSync } from 'fs'
import { join } from 'path'

// Auto-detect locally cached VS Code
const vscodeTestDir = '/workspace/.vscode-test'
let cachedVscodePath = null

if (existsSync(vscodeTestDir)) {
  const entries = readdirSync(vscodeTestDir, { withFileTypes: true })
  const vscodeDir = entries.find(e => e.isDirectory() && e.name.startsWith('vscode-linux-'))
  if (vscodeDir) {
    const possiblePath = join(vscodeTestDir, vscodeDir.name, 'bin', 'code')
    if (existsSync(possiblePath)) {
      cachedVscodePath = possiblePath
      console.log('Using cached VS Code:', cachedVscodePath)
    }
  }
}

export default defineConfig({
  files: 'dist/composables/__tests__/**/*.test.js',
  workspaceFolder: '/workspace',
  extensionDevelopmentPath: '/workspace',
  ...(cachedVscodePath && { vscodePath: cachedVscodePath }),
  mocha: {
    ui: 'bdd',
    timeout: 60_000,
    // Global hooks: loaded before all test suites to activate reactive-vscode context
    require: ['./dist/composables/__tests__/hooks.js'],
    reporter: 'spec',
    color: true,
  },
  // Disable GPU acceleration for more stability in headless environments
  launchArgs: ['--disable-gpu', '--disable-extensions', '--no-sandbox', '--disable-setuid-sandbox', '--enable-proposed-api'],
})
