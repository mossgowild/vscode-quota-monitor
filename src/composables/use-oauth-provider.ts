import { createServer } from 'node:http'
import { generatePkce } from '../utils/pkce'
import { useBaseProvider } from './use-base-provider'
import type { ProviderId, UsageItem } from '../types'
import type { PkceChallenge } from '../utils/pkce'

export interface OAuthProviderOptions {
  id: ProviderId
  name: string
  port?: number
  path?: string
  fetchUsage: (credential: string) => Promise<UsageItem[]>
  getAuthUrl: (state: string, pkce: PkceChallenge) => string
  exchangeCode: (code: string, verifier: string) => Promise<string>
}

export function useOAuthProvider(options: OAuthProviderOptions) {
  const authenticate = async (): Promise<string> => {
    const state = crypto.randomUUID()
    const pkce = generatePkce()
    const port = options.port ?? 51121
    const path = options.path ?? '/callback'

    const codePromise = new Promise<string>((resolve, reject) => {
      const server = createServer((req, res) => {
        const url = new URL(req.url || '', `http://localhost:${port}`)

        if (url.pathname !== path) {
          res.statusCode = 404
          res.end('Not Found')
          return
        }

        const code = url.searchParams.get('code')
        const returnedState = url.searchParams.get('state')

        if (returnedState !== state) {
          res.end('Invalid state. Please try again.')
          server.close()
          reject(new Error('Invalid state'))
          return
        }

        if (!code) {
          res.end('Missing auth code. Please try again.')
          server.close()
          reject(new Error('Missing auth code'))
          return
        }

        res.end('Authentication successful! You can close this window.')
        server.close()
        resolve(code)
      })

      server.on('error', (err) => {
        server.close()
        reject(err)
      })

      server.listen(port, () => {
        setTimeout(() => {
          server.close()
          reject(new Error('OAuth timeout'))
        }, 120000) // 2 minute timeout
      })
    })

    const vscode = await import('vscode')
    const authUrl = options.getAuthUrl(state, pkce)
    await vscode.env.openExternal(vscode.Uri.parse(authUrl))

    const code = await codePromise
    return await options.exchangeCode(code, pkce.verifier)
  }

  return useBaseProvider({
    id: options.id,
    name: options.name,
    fetchUsage: options.fetchUsage,
    authenticate
  })
}
