import { strict as assert } from 'node:assert'
import sinon from 'sinon'
import {
  buildOpenaiCodexAuthUrl,
  exchangeOpenaiCodexCode,
  parseOpenaiCodexUsage,
} from '../providers/use-openai-codex-provider'

describe('use-openai-codex-provider', () => {
  let fetchStub: sinon.SinonStub | undefined

  afterEach(() => {
    fetchStub?.restore()
    fetchStub = undefined
  })

  it('should build the official Codex OAuth authorization URL', () => {
    const url = new URL(
      buildOpenaiCodexAuthUrl('state-value', {
        verifier: 'verifier-value',
        challenge: 'challenge-value',
        method: 'S256',
      })
    )

    assert.equal(url.origin + url.pathname, 'https://auth.openai.com/oauth/authorize')
    assert.equal(url.searchParams.get('response_type'), 'code')
    assert.equal(url.searchParams.get('client_id'), 'app_EMoamEEZ73f0CkXaXp7hrann')
    assert.equal(url.searchParams.get('redirect_uri'), 'http://localhost:1455/auth/callback')
    assert.equal(
      url.searchParams.get('scope'),
      'openid profile email offline_access api.connectors.read api.connectors.invoke'
    )
    assert.equal(url.searchParams.get('code_challenge'), 'challenge-value')
    assert.equal(url.searchParams.get('code_challenge_method'), 'S256')
    assert.equal(url.searchParams.get('id_token_add_organizations'), 'true')
    assert.equal(url.searchParams.get('codex_cli_simplified_flow'), 'true')
    assert.equal(url.searchParams.get('state'), 'state-value')
    assert.equal(url.searchParams.get('originator'), 'codex_cli_rs')
  })

  it('should exchange Codex authorization codes as form data', async () => {
    fetchStub = sinon.stub(globalThis, 'fetch').resolves(
      new Response(
        JSON.stringify(Object.fromEntries([['access_token', 'access-token']])),
        { status: 200 }
      )
    )

    const token = await exchangeOpenaiCodexCode('code-value', 'verifier-value')

    assert.equal(token, 'access-token')
    assert.ok(fetchStub.calledOnce)
    const [url, init] = fetchStub.firstCall.args as [string, RequestInit]
    assert.equal(url, 'https://auth.openai.com/oauth/token')
    assert.equal(init.method, 'POST')
    assert.equal(
      (init.headers as Record<string, string>)['Content-Type'],
      'application/x-www-form-urlencoded'
    )
    assert.ok(init.body instanceof URLSearchParams)
    const body = init.body as URLSearchParams
    assert.equal(body.get('grant_type'), 'authorization_code')
    assert.equal(body.get('client_id'), 'app_EMoamEEZ73f0CkXaXp7hrann')
    assert.equal(body.get('code'), 'code-value')
    assert.equal(body.get('redirect_uri'), 'http://localhost:1455/auth/callback')
    assert.equal(body.get('code_verifier'), 'verifier-value')
  })

  it('should parse current Codex rate limit windows', () => {
    const usage = parseOpenaiCodexUsage(
      JSON.parse(`{
        "rate_limit": {
          "primary_window": {
            "used_percent": 3,
            "limit_window_seconds": 18000,
            "reset_at": 1777946642
          },
          "secondary_window": {
            "used_percent": 56,
            "limit_window_seconds": 604800,
            "reset_at": 1778250538
          }
        }
      }`)
    )

    assert.deepEqual(usage, [
      {
        name: '5 Hour Limit',
        percentage: 3,
        resetTime: '2026-05-05T02:04:02.000Z',
      },
      {
        name: 'Weekly Limit',
        percentage: 56,
        resetTime: '2026-05-08T14:28:58.000Z',
      },
    ])
  })
})