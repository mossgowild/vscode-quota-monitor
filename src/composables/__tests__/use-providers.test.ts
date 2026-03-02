import { strict as assert } from 'node:assert'
import sinon from 'sinon'
import { watch } from '@reactive-vscode/reactivity'
import { ConfigurationTarget } from 'vscode'
import { useProviders } from '../use-providers'
import { PROVIDER_IDS } from '../../common'
import type { ProviderId } from '../../types'
import { useConfig } from '../use-config'

const mockBigModelResponse = {
  success: true,
  data: {
    limits: [
      {
        type: 'TOKENS_LIMIT',
        currentValue: 42,
        usage: 100,
        nextResetTime: '2026-04-01T00:00:00Z'
      },
      {
        type: 'TIME_LIMIT',
        currentValue: 5,
        usage: 100,
        nextResetTime: '2026-04-01T00:00:00Z'
      }
    ]
  }
}

function mockFetch(body: unknown = mockBigModelResponse) {
  return () => Promise.resolve(new Response(JSON.stringify(body)))
}

function waitUntil(predicate: () => boolean, timeoutMs = 5000): Promise<void> {
  if (predicate()) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      stop()
      reject(new Error('Timed out waiting for reactive condition'))
    }, timeoutMs)
    const stop = watch(predicate, (met) => {
      if (!met) return
      clearTimeout(timer)
      stop()
      resolve()
    })
  })
}

describe('use-providers', () => {
  let config: ReturnType<typeof useConfig>
  let providers: ReturnType<typeof useProviders>
  let fetchStub: sinon.SinonStub

  before(async () => {
    config = useConfig()
    providers = useProviders()
  })

  afterEach(() => {
    if (fetchStub?.restore) fetchStub.restore()
    fetchStub = undefined as any
  })

  after(async () => {
    config.update('providers', undefined, ConfigurationTarget.Global)
    config.update('autoRefreshEnabled', undefined, ConfigurationTarget.Global)
    config.update(
      'autoRefreshIntervalMs',
      undefined,
      ConfigurationTarget.Global
    )
  })

  it(`should have ${PROVIDER_IDS.length} providers`, () => {
    PROVIDER_IDS.forEach((id) => {
      assert.ok(providers.providerById[id], `${id} provider should exist`)
    })
  })

  describe('login', () => {
    it('should add account when API key login succeeds', async () => {
      await providers.providerById.zhipu.login('sk.test-api-key')
      await waitUntil(
        () => providers.providerById.zhipu.accounts.value.length > 0
      )
    })

    it('should have 1 account after login', () => {
      assert.equal(providers.providerById.zhipu.accounts.value.length, 1)
    })

    it('should have default name format', () => {
      const account = providers.providerById.zhipu.accounts.value[0]
      assert.equal(account.name, undefined)
      assert.equal(account.fallbackName, 'Zhipu AI #1')
    })

    it('should have no usage before refresh', () => {
      assert.equal(
        providers.providerById.zhipu.accounts.value[0].usage.length,
        0
      )
    })

    it('should reject when user cancels API key input', async () => {
      await assert.rejects(() => providers.providerById.zhipu.login(), {
        message: 'Authentication cancelled'
      })
    })
  })

  describe('rename', () => {
    it('should update account name at given index', async () => {
      providers.providerById.zhipu.rename(0, 'My Zhipu')
      await waitUntil(
        () =>
          providers.providerById.zhipu.accounts.value[0]?.name === 'My Zhipu'
      )
    })

    it('should preserve account count after rename', () => {
      assert.equal(providers.providerById.zhipu.accounts.value.length, 1)
    })

    it('should persist new name', () => {
      assert.equal(
        providers.providerById.zhipu.accounts.value[0].name,
        'My Zhipu'
      )
    })

    it('should have no usage before refresh', () => {
      assert.equal(
        providers.providerById.zhipu.accounts.value[0].usage.length,
        0
      )
    })
  })

  describe('refresh', () => {
    it('should populate usage data on first refresh', async () => {
      fetchStub = sinon.stub(globalThis, 'fetch').callsFake(mockFetch())

      await providers.providerById.zhipu.refresh(0)

      assert.equal(
        providers.providerById.zhipu.accounts.value[0].usage.length,
        2
      )

      fetchStub.restore()
    })

    it('should have correct Token Limit values', () => {
      const tokenLimit =
        providers.providerById.zhipu.accounts.value[0].usage.find(
          (u) => u.name === 'Token Limit'
        )
      assert.ok(tokenLimit, 'Token Limit should exist')
      if ('used' in tokenLimit) {
        assert.equal(tokenLimit.used, 42)
        assert.equal(tokenLimit.total, 100)
      }
    })

    it('should have correct Time Limit values', () => {
      const timeLimit =
        providers.providerById.zhipu.accounts.value[0].usage.find(
          (u) => u.name === 'Time Limit'
        )
      assert.ok(timeLimit, 'Time Limit should exist')
      if ('used' in timeLimit) {
        assert.equal(timeLimit.used, 5)
        assert.equal(timeLimit.total, 100)
      }
    })

    it('should call refresh on all providers when refresh() is called without providerId', async () => {
      const refreshStubs = Object.values(providers.providerById).map(
        (provider) => sinon.stub(provider, 'refresh').resolves()
      )

      await providers.refresh()

      for (const stub of refreshStubs) {
        assert.ok(stub.calledOnce, 'Provider refresh should be called once')
        stub.restore()
      }
    })

    it('should call refresh on specific provider when providerId is provided', async () => {
      const refreshStubs: Record<ProviderId, sinon.SinonStub> = {
        zhipu: sinon.stub(providers.providerById.zhipu, 'refresh').resolves(),
        zai: sinon.stub(providers.providerById.zai, 'refresh').resolves(),
        kimiCode: sinon
          .stub(providers.providerById.kimiCode, 'refresh')
          .resolves(),
        googleAntigravity: sinon
          .stub(providers.providerById.googleAntigravity, 'refresh')
          .resolves(),
        googleGemini: sinon
          .stub(providers.providerById.googleGemini, 'refresh')
          .resolves(),
        githubCopilot: sinon
          .stub(providers.providerById.githubCopilot, 'refresh')
          .resolves(),
        deepSeek: sinon
          .stub(providers.providerById.deepSeek, 'refresh')
          .resolves(),
        moonshot: sinon
          .stub(providers.providerById.moonshot, 'refresh')
          .resolves(),
        siliconFlow: sinon
          .stub(providers.providerById.siliconFlow, 'refresh')
          .resolves(),
        openRouter: sinon
          .stub(providers.providerById.openRouter, 'refresh')
          .resolves(),
        claudeCode: sinon
          .stub(providers.providerById.claudeCode, 'refresh')
          .resolves(),
        openaiCodex: sinon
          .stub(providers.providerById.openaiCodex, 'refresh')
          .resolves()
      }

      await providers.refresh('zhipu')

      assert.ok(refreshStubs.zhipu.calledOnce, 'zhipu refresh should be called')
      const otherIds = PROVIDER_IDS.filter((id) => id !== 'zhipu')
      for (const id of otherIds) {
        assert.ok(
          !refreshStubs[id].called,
          `${id} refresh should not be called`
        )
      }

      Object.values(refreshStubs).forEach((stub) => stub.restore())
    })

    it('should call refresh with accountIndex when both providerId and accountIndex are provided', async () => {
      const zhipuRefreshStub = sinon
        .stub(providers.providerById.zhipu, 'refresh')
        .resolves()

      await providers.refresh('zhipu', 0)

      assert.ok(
        zhipuRefreshStub.calledOnceWith(0),
        'zhipu refresh should be called with accountIndex 0'
      )

      zhipuRefreshStub.restore()
    })

    it('should retain usage data after refresh routing tests', () => {
      const account = providers.providerById.zhipu.accounts.value[0]
      assert.equal(account.usage.length, 2)
    })

    it('should update usage data after real refresh', async () => {
      fetchStub = sinon.stub(globalThis, 'fetch').callsFake(
        mockFetch({
          success: true,
          data: {
            limits: [
              {
                type: 'TOKENS_LIMIT',
                currentValue: 80,
                usage: 100,
                nextResetTime: '2026-05-01T00:00:00Z'
              }
            ]
          }
        })
      )

      await providers.providerById.zhipu.refresh(0)

      assert.equal(
        providers.providerById.zhipu.accounts.value[0].usage.length,
        1
      )

      fetchStub.restore()
    })

    it('should have updated Token Limit values', () => {
      const tokenLimit =
        providers.providerById.zhipu.accounts.value[0].usage.find(
          (u) => u.name === 'Token Limit'
        )
      assert.ok(tokenLimit, 'Token Limit should exist')
      if ('used' in tokenLimit) {
        assert.equal(tokenLimit.used, 80)
      }
    })

    it('should show error when refresh fails', async () => {
      fetchStub = sinon.stub(globalThis, 'fetch').callsFake(() =>
        Promise.resolve(
          new Response('Server Error', {
            status: 500,
            statusText: 'Internal Server Error'
          })
        )
      )

      await providers.providerById.zhipu.refresh(0)

      const account = providers.providerById.zhipu.accounts.value[0]
      assert.ok(account.error, 'should have error after failed refresh')

      fetchStub.restore()
    })
  })

  describe('logout', () => {
    it('should remove account at given index', async () => {
      providers.providerById.zhipu.logout(0)
      await waitUntil(
        () => providers.providerById.zhipu.accounts.value.length === 0
      )

      assert.equal(providers.providerById.zhipu.accounts.value.length, 0)
    })

    it('should have no accounts for any provider', () => {
      for (const id of PROVIDER_IDS) {
        assert.equal(
          providers.providerById[id].accounts.value.length,
          0,
          `${id} should have 0 accounts`
        )
      }
    })
  })
})
