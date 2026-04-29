import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  claimPendingTasksMock,
  completeTaskMock,
  envMock,
  retryTaskMock,
  sendDirectCastMock,
} = vi.hoisted(() => ({
  claimPendingTasksMock: vi.fn(),
  completeTaskMock: vi.fn(),
  envMock: {
    DATABASE_URL: 'postgres://localhost:5432/test',
    FARCASTER_API_BASE_URL: 'https://api.farcaster.xyz',
    FARCASTER_API_KEY: 'test-key',
    FARCASTER_APP_FID: '123',
    NO_SEND_NOTIFICATIONS: 'false',
    NODE_ENV: 'test' as const,
  },
  retryTaskMock: vi.fn(),
  sendDirectCastMock: vi.fn(),
}))

vi.mock('../../config', () => ({
  env: envMock,
}))

vi.mock('../../flags', () => ({
  parseBooleanEnv: () => false,
}))

vi.mock('../../queue', () => ({
  claimPendingTasks: claimPendingTasksMock,
  completeTask: completeTaskMock,
  retryTask: retryTaskMock,
}))

vi.mock('../../services/farcaster/send-direct-cast', () => ({
  sendDirectCast: sendDirectCastMock,
}))

let queueConsumeCommand: typeof import('./consume.js').queueConsumeCommand

beforeAll(async () => {
  const consumeModule = await import('./consume.js')
  queueConsumeCommand = consumeModule.queueConsumeCommand
})

/**
 * Creates a valid notification queue task fixture.
 * @param data - Partial payload override.
 * @returns Queue task fixture.
 */
function makeNotificationTask(data: Record<string, unknown> = {}) {
  return {
    data: {
      proposal: {
        dao: {
          chain: { name: 'BASE' },
          id: '0xabc',
          name: 'DAO',
        },
        proposalNumber: 1,
        timeCreated: '100',
        title: 'Title',
        voteEnd: '200',
        voteStart: '150',
      },
      recipient: 397143,
      type: 'notification',
      ...data,
    },
    taskId: 'task-1',
  }
}

describe('queueConsumeCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    claimPendingTasksMock.mockResolvedValue([])
    completeTaskMock.mockResolvedValue(true)
    retryTaskMock.mockResolvedValue(true)
    sendDirectCastMock.mockResolvedValue({ success: true })
  })

  it('retries malformed payload tasks safely', async () => {
    claimPendingTasksMock.mockResolvedValue([
      {
        data: { foo: 'bar' },
        taskId: 'bad-task',
      },
    ])

    await queueConsumeCommand(1)

    expect(retryTaskMock).toHaveBeenCalledWith(
      'bad-task',
      expect.stringContaining('consumer-'),
      'Malformed task payload schema',
    )
    expect(sendDirectCastMock).not.toHaveBeenCalled()
  })

  it('completes successful notification tasks', async () => {
    claimPendingTasksMock.mockResolvedValue([makeNotificationTask()])

    await queueConsumeCommand(1)

    expect(sendDirectCastMock).toHaveBeenCalledTimes(1)
    expect(completeTaskMock).toHaveBeenCalledWith(
      'task-1',
      expect.stringContaining('consumer-'),
    )
  })

  it('retries when sending notification fails', async () => {
    claimPendingTasksMock.mockResolvedValue([makeNotificationTask()])
    sendDirectCastMock.mockRejectedValue(new Error('send failed'))

    await queueConsumeCommand(1)

    expect(retryTaskMock).toHaveBeenCalledWith(
      'task-1',
      expect.stringContaining('consumer-'),
      'send failed',
    )
  })

  it('appends risk warning text to proposal notification', async () => {
    claimPendingTasksMock.mockResolvedValue([
      makeNotificationTask({
        warning:
          'The proposer is flagged as a blocked or known malicious actor.',
      }),
    ])

    await queueConsumeCommand(1)

    expect(sendDirectCastMock).toHaveBeenCalledWith(
      envMock,
      397143,
      expect.stringContaining('⚠️ Risk warning:'),
      expect.any(String),
    )
  })
})
