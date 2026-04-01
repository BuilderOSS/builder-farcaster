import { farcasterToken } from '@/commands/farcaster/token'
import { processInvitesCommand } from '@/commands/process/invites'
import { processProposalsCommand } from '@/commands/process/proposals'
import { queueConsumeCommand } from '@/commands/queues/consume'
import { getTargetingOptionsFromEnv } from '@/services/testing/targeting'
import { Command } from 'commander'
import packageJson from '../package.json'
import { processUpdates } from './commands/process/propdates'

// Create a new Command instance for the CLI tool
const program = new Command()

// Set up the metadata for the CLI tool
program
  .name('builder-bot')
  .description('A simple CLI tool to manage tasks')
  .version(packageJson.version)

// Register the 'process' command
const processCommand = program
  .command('process')
  .description('Process related commands')

// Register the 'proposals' sub-command under 'process'
processCommand
  .command('proposals')
  .description('Process proposals from API and enqueue tasks')
  .action(async () => {
    await processProposalsCommand(getTargetingOptionsFromEnv())
  })

// Register the 'propdates' sub-command under 'process'
processCommand
  .command('propdates')
  .description('Process proposals updates from API and enqueue tasks')
  .action(async () => {
    await processUpdates(getTargetingOptionsFromEnv())
  })

// Register the 'invites' sub-command under 'process'
processCommand
  .command('invites')
  .description('Process invitations')
  .action(async () => {
    await processInvitesCommand(getTargetingOptionsFromEnv())
  })

// Register the 'queues' command
const queueCommand = program
  .command('queues')
  .description('Queue related commands')

// Register the 'consume' sub-command under 'queues'
queueCommand
  .command('consume')
  .description('Consume tasks from the queue')
  .option(
    '-l, --limit <number>',
    'Limit the number of tasks to consume',
    parseInt,
  )
  .action(async ({ limit }: { limit: number }) => {
    await queueConsumeCommand(limit)
  })

// Register the 'farcaster' command
const farcasterCommand = program
  .command('farcaster')
  .description('Farcaster related commands')

// Register the 'token' sub-command under 'farcaster'
farcasterCommand
  .command('token')
  .description('Token related operations')
  .action(farcasterToken)

// Parse the command-line arguments to execute appropriate commands
/**
 * Parses and executes CLI commands.
 */
async function main(): Promise<void> {
  try {
    await program.parseAsync(process.argv)
  } catch (error) {
    console.error('CLI command failed:', error)
    process.exit(1)
  }
}

void main()
