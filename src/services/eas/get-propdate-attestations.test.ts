import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MessageType } from '../builder/types'
import { getPropdateAttestations } from './get-propdate-attestations'

const { fetchFromURLMock, runBuilderRequestWithRetryMock } = vi.hoisted(() => ({
  fetchFromURLMock: vi.fn(),
  runBuilderRequestWithRetryMock: vi.fn(),
}))

vi.mock('../builder/request', () => ({
  runBuilderRequestWithRetry: runBuilderRequestWithRetryMock,
}))

vi.mock('./ipfs', () => ({
  fetchFromURL: fetchFromURLMock,
}))

vi.mock('./', () => ({
  propdateChainEndpoints: [
    {
      chain: { id: 8453, name: 'base' },
      endpoint: 'https://example.com/subgraph',
    },
  ],
}))

vi.mock('graphql-request', () => {
  class GraphQLClient {
    request = vi.fn()
  }

  return {
    GraphQLClient,
    gql: (value: TemplateStringsArray) => value.join(''),
  }
})

describe('getPropdateAttestations', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('paginates until final short page and maps payloads', async () => {
    const firstPage = Array.from({ length: 1000 }, (_, index) => ({
      id: `0x${index.toString(16)}`,
      message: '{"content":"inline"}',
      messageType: MessageType.INLINE_JSON,
      originalMessageId:
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      proposal: {
        dao: { tokenAddress: '0xdao' },
        proposalId: `0x${(index + 100).toString(16)}`,
      },
      timestamp: '123',
    }))

    runBuilderRequestWithRetryMock
      .mockResolvedValueOnce({
        proposalUpdates: firstPage,
      })
      .mockResolvedValueOnce({ proposalUpdates: [] })

    const result = await getPropdateAttestations()

    expect(runBuilderRequestWithRetryMock).toHaveBeenCalledTimes(2)
    expect(result.propdates).toHaveLength(1000)
    expect(result.propdates[0].recipient).toBe('0xdao')
    expect(result.propdates[0].parsedMessage.content).toBe('inline')
  })

  it('parses URL message payloads via fetchFromURL', async () => {
    fetchFromURLMock.mockResolvedValue('{"content":"from-url"}')

    runBuilderRequestWithRetryMock
      .mockResolvedValueOnce({
        proposalUpdates: [
          {
            id: '0x2',
            message: 'ipfs://cid-1',
            messageType: MessageType.URL_JSON,
            originalMessageId:
              '0x0000000000000000000000000000000000000000000000000000000000000000',
            proposal: {
              dao: { tokenAddress: '0xdao' },
              proposalId: '0x11',
            },
            timestamp: '124',
          },
        ],
      })
      .mockResolvedValueOnce({ proposalUpdates: [] })

    const result = await getPropdateAttestations()

    expect(fetchFromURLMock).toHaveBeenCalledWith('ipfs://cid-1')
    expect(result.propdates[0].parsedMessage.content).toBe('from-url')
  })

  it('filters out zero-hash proposal ids', async () => {
    runBuilderRequestWithRetryMock
      .mockResolvedValueOnce({
        proposalUpdates: [
          {
            id: '0x3',
            message: 'text',
            messageType: MessageType.INLINE_TEXT,
            originalMessageId:
              '0x0000000000000000000000000000000000000000000000000000000000000000',
            proposal: {
              dao: { tokenAddress: '0xdao' },
              proposalId:
                '0x0000000000000000000000000000000000000000000000000000000000000000',
            },
            timestamp: '125',
          },
        ],
      })
      .mockResolvedValueOnce({ proposalUpdates: [] })

    const result = await getPropdateAttestations()

    expect(result.propdates).toEqual([])
  })
})
