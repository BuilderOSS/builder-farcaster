#!/usr/bin/env node

import dotenv from 'dotenv'

dotenv.config()

const username = process.argv[2]?.trim()

if (!username) {
  console.error('Usage: pnpm dev:fid <username>')
  process.exit(1)
}

const baseUrl = (
  process.env.FARCASTER_API_BASE_URL || 'https://api.farcaster.xyz'
).replace(/\/$/, '')

const endpoint = `${baseUrl}/v2/user-by-username?${new URLSearchParams({ username }).toString()}`

try {
  const response = await fetch(endpoint)
  const body = await response.json()

  if (!response.ok) {
    const message =
      body?.errors?.[0]?.message ||
      `Request failed with status ${response.status}`
    throw new Error(message)
  }

  const fid = body?.result?.user?.fid

  if (!fid) {
    throw new Error('FID not found in response')
  }

  console.log(`username: ${username}`)
  console.log(`fid: ${String(fid)}`)
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
