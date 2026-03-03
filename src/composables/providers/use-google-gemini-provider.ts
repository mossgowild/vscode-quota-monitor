/* eslint-disable @typescript-eslint/naming-convention */
import { defineService } from 'reactive-vscode'
import { useGoogleProvider } from '../use-google-provider'
import type { UsageItem } from '../../types'

const CLIENT_ID =
  '681255809395-oo8ft2oprdrnp9e3aqf6av3hmdib135j.apps.googleusercontent.com'
const CLIENT_SECRET = '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'

export const useGoogleGeminiProvider = defineService(() =>
  useGoogleProvider({
    id: 'googleGemini',
    name: 'Google Gemini',
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    scopes: [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ],
    fetchUsage: async (credential: string): Promise<UsageItem[]> => {
      // credential is refresh_token stored during OAuth flow
      const tokensResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: credential,
        }),
      })

      if (!tokensResponse.ok) {
        throw new Error(`Token refresh failed: ${tokensResponse.statusText}`)
      }

      const tokens = (await tokensResponse.json()) as { access_token: string }
      const accessToken = tokens.access_token

      const makeRequest = async <T>(url: string, body: object): Promise<T> => {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'User-Agent': 'gemini-cli/1.0',
            'content-type': 'application/json',
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify(body)
        })

        if (!response.ok) {
          throw new Error(`Request failed: ${response.statusText}`)
        }

        return response.json() as Promise<T>
      }

      const loadResult = await makeRequest<{
        cloudaicompanionProject?: string
      }>('https://cloudcode-pa.googleapis.com/v1internal:loadCodeAssist', {
        metadata: {
          ideType: 'IDE_UNSPECIFIED',
          platform: 'PLATFORM_UNSPECIFIED',
          pluginType: 'GEMINI'
        }
      })

      if (!loadResult?.cloudaicompanionProject) {
        throw new Error('Failed to load project')
      }

      const quotaResult = await makeRequest<{
        buckets?: Array<{
          modelId: string
          remainingFraction: number
          resetTime?: string
        }>
      }>('https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuota', {
        project: loadResult.cloudaicompanionProject
      })

      if (!quotaResult?.buckets) {
        throw new Error('Failed to fetch quota')
      }

      return quotaResult.buckets.map((bucket) => ({
        name: bucket.modelId,
        percentage: Math.round((1 - bucket.remainingFraction) * 100),
        resetTime: bucket.resetTime
      }))
    },
  })
)
