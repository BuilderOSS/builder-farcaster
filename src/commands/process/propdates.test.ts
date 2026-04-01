import { processUpdates } from '@/commands/process/propdates'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  addToQueueMock,
  getCacheMock,
  getFollowerFidsMock,
  getFollowersDaoMapMock,
  getPropdateAttestationsMock,
  getProposalFromIdMock,
  getUserFidMock,
  setCacheMock,
} = vi.hoisted(() => ({
  addToQueueMock: vi.fn(),
  getCacheMock: vi.fn(),
  getFollowerFidsMock: vi.fn(),
  getFollowersDaoMapMock: vi.fn(),
  getPropdateAttestationsMock: vi.fn(),
  getProposalFromIdMock: vi.fn(),
  getUserFidMock: vi.fn(),
  setCacheMock: vi.fn(),
}))

vi.mock('@/queue', () => ({
  addToQueue: addToQueueMock,
}))

vi.mock('@/cache', () => ({
  getCache: getCacheMock,
  setCache: setCacheMock,
}))

vi.mock('@/services/eas/get-propdate-attestations', () => ({
  getPropdateAttestations: getPropdateAttestationsMock,
}))

vi.mock('@/commands', () => ({
  getFollowerFids: getFollowerFidsMock,
  getFollowersDaoMap: getFollowersDaoMapMock,
  getProposalFromId: getProposalFromIdMock,
  getUserFid: getUserFidMock,
}))

describe('processUpdates', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getUserFidMock.mockReturnValue(999)
    getFollowerFidsMock.mockResolvedValue([397143])
    getFollowersDaoMapMock.mockResolvedValue({
      397143: ['0xabc:8453'],
    })
    getCacheMock.mockResolvedValue([])
    setCacheMock.mockResolvedValue(undefined)
    addToQueueMock.mockResolvedValue(undefined)
    getProposalFromIdMock.mockResolvedValue({
      dao: {
        chain: { id: 8453, name: 'base' },
        id: '0xabc',
        name: 'Test DAO',
      },
      id: 'proposal-1',
      proposalNumber: 1,
      timeCreated: '1',
      title: 'Title',
      voteEnd: '3',
      voteStart: '2',
    })

    getPropdateAttestationsMock.mockResolvedValue({
      propdates: [
        {
          chain: { id: 8453, name: 'base' },
          id: 'propdate-1',
          message: '{}',
          messageType: 0,
          originalMessageId:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          parsedMessage: { content: 'update' },
          proposalId: '0x01',
          recipient: '0xabc',
          timeCreated: 123,
        },
      ],
    })
  })

  it('enqueues notifications for matching follower and dao', async () => {
    await processUpdates()

    expect(addToQueueMock).toHaveBeenCalledTimes(1)
    expect(setCacheMock).toHaveBeenCalledWith(
      'notified_proposals_updates_397143',
      ['propdate-1'],
    )
  })

  it('does not enqueue in dry run mode', async () => {
    await processUpdates({ dryRun: true })

    expect(addToQueueMock).not.toHaveBeenCalled()
    expect(setCacheMock).not.toHaveBeenCalled()
  })

  it('filters by target chain and skips non-matching chains', async () => {
    await processUpdates({ targetChains: ['mainnet'] })

    expect(addToQueueMock).not.toHaveBeenCalled()
  })

  it('skips when proposal dao does not match follower dao map', async () => {
    getFollowersDaoMapMock.mockResolvedValue({
      397143: ['0xdef:8453'],
    })

    await processUpdates()

    expect(addToQueueMock).not.toHaveBeenCalled()
  })
})
