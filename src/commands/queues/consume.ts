import { env } from '@/config'
import { parseBooleanEnv } from '@/flags'
import { logger } from '@/logger'
import { claimPendingTasks, completeTask, retryTask } from '@/queue'
import { Dao, Propdate, Proposal } from '@/services/builder/types'
import { sendDirectCast } from '@/services/farcaster/send-direct-cast'
import { isPast, toRelativeTime } from '@/utils'
import sha256 from 'crypto-js/sha256'
import { uniqueBy } from 'remeda'
import removeMd from 'remove-markdown'
import { v4 as uuidv4 } from 'uuid'

const noSendNotifications = parseBooleanEnv(env.NO_SEND_NOTIFICATIONS, false)

type TaskData = {
  type: 'notification' | 'invitation'
} & (NotificationData | InvitationData)

interface NotificationData {
  recipient: number
  proposal: Proposal
  propdate?: Propdate
}

interface InvitationData {
  recipient: number
  daos: Dao[]
}

/**
 * Checks whether a value is a non-null object record.
 * @param value - Unknown value.
 * @returns True when value is an object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Checks whether a raw queue payload matches expected task shape.
 * @param value - Raw queue task data.
 * @returns True when payload contains a supported task type.
 */
function isTaskData(value: unknown): value is TaskData {
  if (!isRecord(value)) {
    return false
  }

  const maybeTask = value

  if (typeof maybeTask.type !== 'string' || maybeTask.type.length === 0) {
    return false
  }

  if (
    typeof maybeTask.recipient !== 'number' ||
    !Number.isFinite(maybeTask.recipient)
  ) {
    return false
  }

  if (maybeTask.type === 'invitation') {
    return Array.isArray(maybeTask.daos)
  }

  if (maybeTask.type !== 'notification') {
    return false
  }

  if (!isRecord(maybeTask.proposal)) {
    return false
  }

  const proposal = maybeTask.proposal

  if (
    typeof proposal.title !== 'string' ||
    typeof proposal.proposalNumber !== 'number' ||
    typeof proposal.timeCreated !== 'string' ||
    typeof proposal.voteStart !== 'string' ||
    typeof proposal.voteEnd !== 'string'
  ) {
    return false
  }

  if (!isRecord(proposal.dao)) {
    return false
  }

  if (
    typeof proposal.dao.id !== 'string' ||
    typeof proposal.dao.name !== 'string'
  ) {
    return false
  }

  if (!isRecord(proposal.dao.chain)) {
    return false
  }

  if (typeof proposal.dao.chain.name !== 'string') {
    return false
  }

  if (maybeTask.propdate !== undefined) {
    if (!isRecord(maybeTask.propdate)) {
      return false
    }

    const propdate = maybeTask.propdate

    if (!isRecord(propdate.chain) || !isRecord(propdate.parsedMessage)) {
      return false
    }

    if (
      typeof propdate.chain.name !== 'string' ||
      typeof propdate.parsedMessage.content !== 'string' ||
      typeof propdate.timeCreated !== 'number'
    ) {
      return false
    }
  }

  return true
}

/**
 * Formats a proposal notification message
 * @param proposal - The proposal data to format into a message
 * @returns A formatted string containing the proposal notification message
 */
function formatProposalMessage(proposal: Proposal): string {
  const {
    proposalNumber,
    title: proposalTitle,
    dao: {
      id: daoId,
      name: daoName,
      chain: { name: chainName },
    },
    timeCreated: createdAt,
    voteStart: votingStartsAt,
    voteEnd: votingEndsAt,
  } = proposal

  return [
    `🗳️ New proposal in ${daoName}`,
    `#${proposalNumber.toString()} - ${proposalTitle}`,
    '',
    `Created: ${toRelativeTime(Number(createdAt))}`,
    `Voting: ${isPast(Number(votingStartsAt)) ? 'started' : 'starts'} ${toRelativeTime(Number(votingStartsAt))} · ${isPast(Number(votingEndsAt)) ? 'ended' : 'ends'} ${toRelativeTime(Number(votingEndsAt))}`,
    '',
    `Vote now: https://nouns.build/dao/${chainName.toLowerCase()}/${daoId}/vote/${proposalNumber.toString()}`,
  ].join('\n')
}

/**
 * Formats a proposal update (propdate) notification message
 * @param propdate - The proposal update data to format
 * @param proposal - The proposal information associated with the update
 * @returns A formatted string containing the proposal update notification message
 */
function formatPropdateMessage(propdate: Propdate, proposal: Proposal): string {
  const {
    chain: { name: chainName },
    parsedMessage,
    timeCreated: createdAt,
  } = propdate

  const {
    proposalNumber,
    title: proposalTitle,
    dao: { id: daoId, name: daoName },
  } = proposal

  const update = removeMd(parsedMessage.content)
  const truncatedUpdate =
    update.split('\n').slice(0, 2).join('\n') +
    (update.split('\n').length > 2 ? '...' : '')

  const milestoneText =
    parsedMessage.milestoneId !== undefined
      ? // Add 1 to the milestone ID to account for the fact that the milestone ID starts at 0
        ` for milestone ${(parsedMessage.milestoneId + 1).toString()}`
      : ''

  return [
    `📝 Proposal update in ${daoName}`,
    `#${proposalNumber.toString()} - ${proposalTitle}${milestoneText}`,
    '',
    `Posted: ${toRelativeTime(Number(createdAt))}`,
    '',
    truncatedUpdate,
    '',
    `View proposal: https://nouns.build/dao/${chainName.toLowerCase()}/${daoId}/vote/${proposalNumber.toString()}`,
  ].join('\n')
}

/**
 * Handles notification tasks.
 * @param taskId - The unique identifier for the task.
 * @param workerId - Current worker lock owner id.
 * @param data - The data associated with the notification task.
 * @returns Resolves when the notification has been successfully handled.
 */
async function handleNotification(
  taskId: string,
  workerId: string,
  data: NotificationData,
): Promise<boolean> {
  try {
    const { recipient, proposal, propdate } = data
    let message: string | undefined

    if (propdate) {
      message = formatPropdateMessage(propdate, proposal)
    } else {
      message = formatProposalMessage(proposal)
    }

    const idempotencyKey = sha256(message).toString()

    if (noSendNotifications) {
      logger.info(
        {
          idempotencyKey,
          recipientHash: sha256(recipient.toString()).toString(),
        },
        'NO_SEND_NOTIFICATIONS enabled. Skipping direct cast send.',
      )
      return true
    }

    const result = await sendDirectCast(env, recipient, message, idempotencyKey)

    if (!result.success) {
      throw new Error(`Non-successful result: ${JSON.stringify(result)}`)
    }

    logger.info({ recipient, result }, 'Direct cast sent successfully.')
    return true
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)

    if (error instanceof Error) {
      logger.error(
        { message: error.message, stack: error.stack },
        'Failed to send notification',
      )
    } else {
      logger.error({ error }, 'Unknown error occurred')
    }

    const retried = await retryTask(taskId, workerId, reason)
    if (!retried) {
      logger.warn(
        { taskId, workerId },
        'Skipped retry because task lock ownership changed.',
      )
    }
    return false
  }
}

/**
 * Handles invitation tasks.
 * @param taskId - The unique identifier for the task.
 * @param workerId - Current worker lock owner id.
 * @param data - The data associated with the invitation task.
 * @returns Resolves when the invitation has been successfully handled.
 */
async function handleInvitation(
  taskId: string,
  workerId: string,
  data: InvitationData,
): Promise<boolean> {
  try {
    const { recipient, daos } = data
    const uniqueDaos = uniqueBy(daos, (dao) => dao.name)

    const daoNames = uniqueDaos
      .map((dao) => dao.name.replace(/\s*(?:DAO|dao)$/, '')) // Clean names inline
      .join(', ')
    const daoCount = uniqueDaos.length.toString()

    const message =
      uniqueDaos.length === 1
        ? `👋 Hey there! You're a proud member of ${daoNames}, powered by Builder Protocol. 🎉 ` +
          `Want to stay in the loop for the latest proposals? Follow @builderbot on Farcaster ` +
          `to never miss an update! 🚀`
        : `👋 Hey there! You're a member of ${daoCount} DAOs built by Builder Protocol: ${daoNames}. 🚀 ` +
          `Stay informed about new proposals in your DAOs by following @builderbot on Farcaster ` +
          `and make your voice count! 🎉`

    const idempotencyKey = sha256(message).toString()

    if (noSendNotifications) {
      logger.info(
        {
          daoCount: uniqueDaos.length,
          idempotencyKey,
          recipientHash: sha256(recipient.toString()).toString(),
        },
        'NO_SEND_NOTIFICATIONS enabled. Skipping invitation direct cast send.',
      )
      return true
    }

    const result = await sendDirectCast(env, recipient, message, idempotencyKey)

    if (!result.success) {
      throw new Error(`Non-successful result: ${JSON.stringify(result)}`)
    }

    logger.info({ recipient, result }, 'Invitation sent successfully.')
    return true
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)

    if (error instanceof Error) {
      logger.error(
        { message: error.message, stack: error.stack },
        'Failed to send invitation',
      )
    } else {
      logger.error({ error }, 'Unknown error occurred')
    }

    const retried = await retryTask(taskId, workerId, reason)
    if (!retried) {
      logger.warn(
        { taskId, workerId },
        'Skipped retry because task lock ownership changed.',
      )
    }
    return false
  }
}

/**
 * Processes a queue of tasks from the database with an optional limit on the number of tasks to process at one time.
 *
 * This function retrieves pending tasks from the database, processes each task by its type, and marks them as completed.
 * If there are no pending tasks, it waits for a short period before checking again.
 * @param [limit] - Optional limit on the number of tasks to take from the queue.
 * @returns A promise that resolves when the queue processing is done.
 */
export const queueConsumeCommand = async (limit?: number) => {
  try {
    const workerId = `consumer-${uuidv4()}`
    const safeLimit = Number.isFinite(limit) && limit && limit > 0 ? limit : 10
    const tasks = await claimPendingTasks(safeLimit, workerId)

    if (tasks.length <= 0) {
      logger.warn('No pending tasks available. Waiting...')
      return
    }

    for (const task of tasks) {
      logger.info({ taskId: task.taskId, workerId }, 'Processing task')
      let handledSuccessfully = false

      if (!isTaskData(task.data)) {
        const malformedType =
          typeof (task.data as { type?: unknown }).type === 'string'
            ? (task.data as { type: string }).type
            : 'unknown'

        logger.error(
          {
            taskId: task.taskId,
            taskType: malformedType,
          },
          'Malformed task payload. Expected supported task schema.',
        )

        const retried = await retryTask(
          task.taskId,
          workerId,
          'Malformed task payload schema',
        )

        if (!retried) {
          logger.warn(
            { taskId: task.taskId, workerId },
            'Skipped retry because task lock ownership changed.',
          )
        }

        continue
      }

      const taskData = task.data

      switch (taskData.type) {
        case 'notification':
          handledSuccessfully = await handleNotification(
            task.taskId,
            workerId,
            taskData as NotificationData,
          )
          break
        case 'invitation':
          handledSuccessfully = await handleInvitation(
            task.taskId,
            workerId,
            taskData as InvitationData,
          )
          break
        default: {
          logger.error({ task }, 'Unknown task type')
          const retried = await retryTask(
            task.taskId,
            workerId,
            `Unknown task type: ${String(taskData.type)}`,
          )

          if (!retried) {
            logger.warn(
              { taskId: task.taskId, workerId },
              'Skipped retry because task lock ownership changed.',
            )
          }
          break
        }
      }

      if (handledSuccessfully) {
        const completed = await completeTask(task.taskId, workerId)
        if (completed) {
          logger.info({ taskId: task.taskId }, 'Task marked as completed')
        } else {
          logger.warn(
            { taskId: task.taskId, workerId },
            'Skipped completion because task lock ownership changed.',
          )
        }
      }
    }
  } catch (error) {
    logger.error({ error }, 'Error while processing the queue')
    throw error
  }
}
