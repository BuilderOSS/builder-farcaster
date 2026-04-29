import { DateTime } from 'luxon'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { processProposalsCommand } from './proposals.js'

const {
  addToQueueMock,
  getActiveProposalsMock,
  getCacheMock,
  getFollowerFidsMock,
  getFollowersDaoMapMock,
  getProposalWarningMock,
  getUserFidMock,
  setCacheMock,
} = vi.hoisted(() => ({
  addToQueueMock: vi.fn(),
  getActiveProposalsMock: vi.fn(),
  getCacheMock: vi.fn(),
  getFollowerFidsMock: vi.fn(),
  getFollowersDaoMapMock: vi.fn(),
  getProposalWarningMock: vi.fn(),
  getUserFidMock: vi.fn(),
  setCacheMock: vi.fn(),
}))

vi.mock('../../queue', () => ({
  addToQueue: addToQueueMock,
}))

vi.mock('../../cache', () => ({
  getCache: getCacheMock,
  setCache: setCacheMock,
}))

vi.mock('..', () => ({
  getFollowerFids: getFollowerFidsMock,
  getFollowersDaoMap: getFollowersDaoMapMock,
  getUserFid: getUserFidMock,
}))

vi.mock('../../services/builder/get-active-proposals', () => ({
  getActiveProposals: getActiveProposalsMock,
}))

vi.mock('@buildeross/utils', () => ({
  getProposalWarning: getProposalWarningMock,
}))

/**
 * Creates a baseline proposal payload for tests.
 * @param overrides - Partial field overrides.
 * @returns Proposal-like object.
 */
function makeProposal(overrides: Record<string, unknown> = {}) {
  return {
    dao: {
      chain: { id: 8453, name: 'BASE' },
      id: '0xabc',
      name: 'DAO',
      treasuryAddress: '0x0000000000000000000000000000000000000001',
    },
    id: 'p1',
    proposalNumber: 1,
    proposer: '0x0000000000000000000000000000000000000002',
    timeCreated: '100',
    title: 'Test proposal',
    values: ['0'],
    voteEnd: '1100',
    voteStart: '900',
    ...overrides,
  }
}

describe('processProposalsCommand', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()

    vi.spyOn(DateTime, 'now').mockReturnValue({
      toSeconds: () => 1000,
    } as unknown as DateTime)

    getUserFidMock.mockReturnValue(863865)
    getFollowerFidsMock.mockResolvedValue([397143])
    getFollowersDaoMapMock.mockResolvedValue({
      397143: ['0xabc:8453'],
    })
    getCacheMock.mockResolvedValue([])
    setCacheMock.mockResolvedValue(undefined)
    addToQueueMock.mockResolvedValue(undefined)
    getProposalWarningMock.mockReturnValue('')
  })

  it('enqueues matching active proposals and updates cache', async () => {
    getActiveProposalsMock.mockResolvedValue({
      proposals: [makeProposal()],
    })

    await processProposalsCommand()

    expect(addToQueueMock).toHaveBeenCalledTimes(2)
    expect(setCacheMock).toHaveBeenCalledWith(
      'notified_voting_proposals_397143',
      ['p1'],
    )
    expect(setCacheMock).toHaveBeenCalledWith(
      'notified_ending_proposals_397143',
      ['p1'],
    )
  })

  it('does not enqueue in dry-run mode', async () => {
    getActiveProposalsMock.mockResolvedValue({
      proposals: [makeProposal()],
    })

    await processProposalsCommand({ dryRun: true })

    expect(addToQueueMock).not.toHaveBeenCalled()
    expect(setCacheMock).not.toHaveBeenCalled()
  })

  it('filters proposals by dao and chain targets case-insensitively', async () => {
    getActiveProposalsMock.mockResolvedValue({
      proposals: [makeProposal()],
    })

    await processProposalsCommand({
      targetChains: ['base'],
      targetDaoIds: ['0xABC'],
    })

    expect(addToQueueMock).toHaveBeenCalledTimes(2)
  })

  it('rethrows errors from proposal retrieval', async () => {
    getActiveProposalsMock.mockRejectedValue(new Error('subgraph failed'))

    await expect(processProposalsCommand()).rejects.toThrow('subgraph failed')
  })

  it('attaches risk warning text to notification payload', async () => {
    getActiveProposalsMock.mockResolvedValue({
      proposals: [makeProposal()],
    })
    getProposalWarningMock.mockReturnValue('High-risk proposal warning')

    await processProposalsCommand()

    expect(addToQueueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'notification',
        warning: 'High-risk proposal warning',
      }),
    )
  })
})
