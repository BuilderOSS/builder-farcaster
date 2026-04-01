import { getDAOsForOwners } from '@/services/builder/get-daos-for-owners'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { runBuilderRequestWithRetryMock } = vi.hoisted(() => ({
  runBuilderRequestWithRetryMock: vi.fn(),
}))

vi.mock('@/services/builder/index', () => ({
  chainEndpoints: [
    {
      chain: { id: 8453, name: 'base' },
      endpoint: 'https://example.com/base',
    },
    {
      chain: { id: 1, name: 'mainnet' },
      endpoint: 'https://example.com/mainnet',
    },
  ],
}))

vi.mock('@/services/builder/request', () => ({
  runBuilderRequestWithRetry: runBuilderRequestWithRetryMock,
}))

vi.mock('graphql-request', () => ({
  GraphQLClient: class GraphQLClient {
    request = vi.fn()
  },
  gql: (value: TemplateStringsArray) => value.join(''),
}))

describe('getDAOsForOwners', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns pre-seeded empty arrays for owners without memberships', async () => {
    runBuilderRequestWithRetryMock.mockResolvedValue({ owners: [] })

    const result = await getDAOsForOwners({} as never, ['0xA', '0xB'])

    expect(result.ownerDaoIdsMap).toEqual({
      '0xa': [],
      '0xb': [],
    })
    expect(result.daos).toEqual([])
  })

  it('deduplicates DAOs by chain-qualified key and maps owner memberships', async () => {
    runBuilderRequestWithRetryMock
      .mockResolvedValueOnce({
        owners: [
          {
            dao: { id: '0xDAO', name: 'DAO One', ownerCount: 1 },
            owner: '0xA',
          },
        ],
      })
      .mockResolvedValueOnce({
        owners: [
          {
            dao: { id: '0xDAO', name: 'DAO One', ownerCount: 1 },
            owner: '0xA',
          },
        ],
      })

    const result = await getDAOsForOwners({} as never, ['0xA'])

    expect(result.daos).toHaveLength(2)
    expect(result.ownerDaoIdsMap['0xa']).toEqual(['0xdao:8453', '0xdao:1'])
  })
})
