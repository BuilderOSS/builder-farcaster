import {
  getTargetingOptionsFromQuery,
  mergeTargetingOptions,
} from '@/services/testing/targeting'
import { describe, expect, it } from 'vitest'

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
