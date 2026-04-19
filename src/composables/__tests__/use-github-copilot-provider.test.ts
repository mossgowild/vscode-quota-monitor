import { strict as assert } from 'node:assert'
import { parseGithubCopilotUsage } from '../providers/use-github-copilot-provider'

describe('use-github-copilot-provider', () => {
  it('should map modern quota snapshots to Copilot usage items', () => {
    const usage = parseGithubCopilotUsage({
      quota_reset_date_utc: '2026-04-01T00:00:00Z',
      quota_snapshots: {
        completions: {
          entitlement: 0,
          percent_remaining: 100,
          remaining: 0,
          unlimited: true,
        },
        chat: {
          entitlement: 0,
          percent_remaining: 100,
          remaining: 0,
          unlimited: true,
        },
        premium_interactions: {
          entitlement: 100,
          percent_remaining: 76.1,
          remaining: 76,
          unlimited: false,
        },
      },
    })

    assert.deepEqual(usage, [
      {
        name: 'Inline Suggestions',
        included: true,
        resetTime: '2026-04-01T00:00:00Z',
      },
      {
        name: 'Chat messages',
        included: true,
        resetTime: '2026-04-01T00:00:00Z',
      },
      {
        name: 'Premium requests',
        percentage: 23.9,
        detail: {
          used: 24,
          total: 100,
        },
        resetTime: '2026-04-01T00:00:00Z',
      },
    ])
  })

  it('should use the included premium label when overage is enabled', () => {
    const usage = parseGithubCopilotUsage({
      quota_reset_date: '2026-04-01',
      quota_snapshots: {
        premium_interactions: {
          entitlement: 100,
          percent_remaining: 8,
          remaining: 8,
          overage_permitted: true,
          unlimited: false,
        },
      },
    })

    assert.deepEqual(usage, [
      {
        name: 'Included premium requests',
        percentage: 92,
        detail: {
          used: 92,
          total: 100,
        },
        resetTime: '2026-04-01',
      },
    ])
  })

  it('should read modern quota snapshots from nested user_copilot data', () => {
    const usage = parseGithubCopilotUsage({
      user_copilot: {
        quota_reset_date_utc: '2026-04-01T00:00:00Z',
        quota_snapshots: {
          chat: {
            entitlement: 20,
            percent_remaining: 25,
            remaining: 5,
            unlimited: false,
          },
        },
      },
    })

    assert.deepEqual(usage, [
      {
        name: 'Chat messages',
        percentage: 75,
        detail: {
          used: 15,
          total: 20,
        },
        resetTime: '2026-04-01T00:00:00Z',
      },
    ])
  })

  it('should map legacy free quotas when modern snapshots are missing', () => {
    const usage = parseGithubCopilotUsage({
      limited_user_reset_date: '2026-04-15',
      monthly_quotas: {
        completions: 50,
        chat: 20,
      },
      limited_user_quotas: {
        completions: 40,
        chat: 5,
      },
    })

    assert.deepEqual(usage, [
      {
        name: 'Inline Suggestions',
        percentage: 20,
        detail: {
          used: 10,
          total: 50,
        },
        resetTime: '2026-04-15',
      },
      {
        name: 'Chat messages',
        percentage: 75,
        detail: {
          used: 15,
          total: 20,
        },
        resetTime: '2026-04-15',
      },
    ])
  })

  it('should let modern quota snapshots override legacy free quotas', () => {
    const usage = parseGithubCopilotUsage({
      limited_user_reset_date: '2026-04-15',
      quota_reset_date_utc: '2026-04-01T00:00:00Z',
      monthly_quotas: {
        completions: 50,
        chat: 20,
      },
      limited_user_quotas: {
        completions: 40,
        chat: 5,
      },
      quota_snapshots: {
        completions: {
          entitlement: 0,
          percent_remaining: 100,
          remaining: 0,
          unlimited: true,
        },
      },
    })

    assert.deepEqual(usage, [
      {
        name: 'Inline Suggestions',
        included: true,
        resetTime: '2026-04-01T00:00:00Z',
      },
      {
        name: 'Chat messages',
        percentage: 75,
        detail: {
          used: 15,
          total: 20,
        },
        resetTime: '2026-04-01T00:00:00Z',
      },
    ])
  })

  it('should return an empty list when no quota data exists', () => {
    assert.deepEqual(parseGithubCopilotUsage({}), [])
  })
})
