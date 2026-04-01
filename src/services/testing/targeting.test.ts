import { beforeAll, describe, expect, it, vi } from 'vitest'

const { envMock } = vi.hoisted(() => ({
  envMock: {
    DATABASE_URL: 'postgres://localhost:5432/test',
    FARCASTER_API_BASE_URL: 'https://api.farcaster.xyz',
    FARCASTER_API_KEY: 'test-key',
    FARCASTER_APP_FID: '123',
    NODE_ENV: 'test' as const,
  },
}))

vi.mock('@/config', () => ({
  env: envMock,
}))

let getTargetingOptionsFromQuery: typeof import('@/services/testing/targeting').getTargetingOptionsFromQuery
let mergeTargetingOptions: typeof import('@/services/testing/targeting').mergeTargetingOptions

beforeAll(async () => {
  const targetingModule = await import('@/services/testing/targeting')
  getTargetingOptionsFromQuery = targetingModule.getTargetingOptionsFromQuery
  mergeTargetingOptions = targetingModule.mergeTargetingOptions
})

describe('targeting', () => {
  it('parses repeated and csv fid values with strict numeric validation', () => {
    const result = getTargetingOptionsFromQuery({
      fid: ['1,2', '3', '123abc', '1.5', '0', '-7', '8'],
    })

    expect(result.targetFids).toEqual([1, 2, 3, 8])
  })

  it('normalizes dao and chain filters to lowercase', () => {
    const result = getTargetingOptionsFromQuery({
      chain: ['BASE', 'Mainnet'],
      daoId: ['0xAbC,0xDef'],
    })

    expect(result.targetChains).toEqual(['base', 'mainnet'])
    expect(result.targetDaoIds).toEqual(['0xabc', '0xdef'])
  })

  it('parses dryRun booleans from multiple forms', () => {
    expect(getTargetingOptionsFromQuery({ dryRun: 'true' }).dryRun).toBe(true)
    expect(getTargetingOptionsFromQuery({ dryRun: '1' }).dryRun).toBe(true)
    expect(getTargetingOptionsFromQuery({ dryRun: 'yes' }).dryRun).toBe(true)
    expect(getTargetingOptionsFromQuery({ dryRun: 'false' }).dryRun).toBe(false)
    expect(getTargetingOptionsFromQuery({ dryRun: '0' }).dryRun).toBe(false)
    expect(getTargetingOptionsFromQuery({ dryRun: 'no' }).dryRun).toBe(false)
  })

  it('merges targeting options with overrides taking precedence', () => {
    const merged = mergeTargetingOptions(
      {
        dryRun: false,
        targetChains: ['mainnet'],
        targetFids: [1],
      },
      {
        dryRun: true,
        targetFids: [2, 3],
      },
    )

    expect(merged).toEqual({
      dryRun: true,
      targetChains: ['mainnet'],
      targetFids: [2, 3],
    })
  })
})
