import { processInvitesCommand } from '@/commands/process/invites'
import { processProposalsCommand } from '@/commands/process/proposals'
import { queueConsumeCommand } from '@/commands/queues/consume'
import { warpcastToken } from '@/commands/warpcast/token'
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
  .action(processProposalsCommand)

// Register the 'propdates' sub-command under 'process'
processCommand
  .command('propdates')
  .description('Process proposals updates from API and enqueue tasks')
  .action(processUpdates)

// Register the 'invites' sub-command under 'process'
processCommand
  .command('invites')
  .description('Process invitations')
  .action(processInvitesCommand)

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

// Register the 'warpcast' command
const warpcastCommand = program
  .command('warpcast')
  .description('Warpcast related commands')

// Register the 'token' sub-command under 'warpcast'
warpcastCommand
  .command('token')
  .description('Token related operations')
  .action(warpcastToken)

// Parse the command-line arguments to execute appropriate commands
program.parse(process.argv)
