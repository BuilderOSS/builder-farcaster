import { env } from '@/config'
import { fetchRequest, HttpRequestMethod } from '@/services/warpcast'
import { input } from '@inquirer/prompts'
import { getPublicKeyAsync, utils } from '@noble/ed25519'
import qrcode from 'qrcode-terminal'
import { Hex } from 'viem'
import { mnemonicToAccount } from 'viem/accounts'

const SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN = {
  chainId: 10,
  name: 'Farcaster SignedKeyRequestValidator',
  verifyingContract: '0x00000000fc700472606ed4fa22623acf62c60553',
  version: '1',
} as const

const SIGNED_KEY_REQUEST_TYPE = [
  { name: 'requestFid', type: 'uint256' },
  { name: 'key', type: 'bytes' },
  { name: 'deadline', type: 'uint256' },
] as const

const SIGNED_KEY_REQUEST_CREATE_PATHS = [
  '/v2/signed-key-requests',
  '/v2/signed-key-request',
] as const

interface SignedKeyRequest {
  deeplinkUrl?: string
  deepLinkUrl?: string
  key: string
  state: 'pending' | 'approved' | 'completed'
  token: string
  userFid?: number
}

interface SignedKeyRequestResponse {
  result: {
    signedKeyRequest: SignedKeyRequest
  }
}

interface CreateSignedKeyRequestBody {
  deadline: number
  key: string
  requestFid: number
  signature: string
}

/**
 * Attempts to decode a mnemonic input that may be raw words or base64.
 * @param value - Raw user input.
 * @returns Decoded mnemonic phrase.
 */
function decodeMnemonicInput(value: string): string {
  const trimmed = value.trim()

  if (trimmed.split(/\s+/).length >= 12) {
    return trimmed
  }

  const decoded = Buffer.from(trimmed, 'base64').toString('utf8').trim()
  if (decoded.split(/\s+/).length >= 12) {
    return decoded
  }

  throw new Error(
    'Input must be a mnemonic phrase or a base64-encoded mnemonic',
  )
}

/**
 * Reads and validates the request FID from user input.
 * @returns Positive integer FID.
 */
async function promptFid(): Promise<number> {
  const defaultFid = env.FARCASTER_APP_FID
  const response = await input({
    default: defaultFid,
    message: 'Enter FID for signer request (bot/account FID):',
    validate(value) {
      const parsed = Number.parseInt(value, 10)
      return Number.isFinite(parsed) && parsed > 0
        ? true
        : 'FID must be a positive integer'
    },
  })

  return Number.parseInt(response, 10)
}

/**
 * Reads mnemonic input from user.
 * @returns Decoded mnemonic phrase.
 */
async function promptMnemonic(): Promise<string> {
  const raw = await input({
    message: 'Enter mnemonic or base64-encoded mnemonic:',
    validate(value) {
      try {
        decodeMnemonicInput(value)
        return true
      } catch {
        return 'Enter valid mnemonic words or base64-encoded mnemonic'
      }
    },
  })

  return decodeMnemonicInput(raw)
}

/**
 * Creates signed key request at supported API paths.
 * @param body - Signed key request payload.
 * @returns Created signed key request details.
 */
async function createSignedKeyRequest(
  body: CreateSignedKeyRequestBody,
): Promise<SignedKeyRequest> {
  for (const path of SIGNED_KEY_REQUEST_CREATE_PATHS) {
    try {
      const response = await fetchRequest<SignedKeyRequestResponse>(
        env.FARCASTER_API_BASE_URL,
        undefined,
        HttpRequestMethod.POST,
        path,
        { json: body as unknown as Record<string, unknown> },
      )
      return response.result.signedKeyRequest
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!message.includes('Path') || !message.includes('does not exist')) {
        throw error
      }
    }
  }

  throw new Error('Could not create signed key request on known API paths')
}

/**
 * Polls the Farcaster API until signed key request is completed.
 * @param token - Signed key request token.
 * @returns Final signed key request state.
 */
async function waitForSignedKeyCompletion(
  token: string,
): Promise<SignedKeyRequest> {
  const maxAttempts = 300

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetchRequest<SignedKeyRequestResponse>(
      env.FARCASTER_API_BASE_URL,
      undefined,
      HttpRequestMethod.GET,
      '/v2/signed-key-request',
      {
        params: { token },
      },
    )

    const request = response.result.signedKeyRequest
    if (request.state === 'completed') {
      return request
    }

    if (attempt % 5 === 0) {
      console.log(`Waiting for approval... current state: ${request.state}`)
    }

    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  throw new Error('Timed out waiting for signed key request approval')
}

/**
 * Creates and approves a Farcaster app key using signed-key-request flow.
 */
export async function warpcastToken(): Promise<void> {
  const fid = await promptFid()
  const mnemonic = await promptMnemonic()

  const privateKey = utils.randomPrivateKey()
  const publicKeyBytes = await getPublicKeyAsync(privateKey)
  const publicKeyHex = `0x${Buffer.from(publicKeyBytes).toString('hex')}`
  const privateKeyHex = `0x${Buffer.from(privateKey).toString('hex')}`

  const account = mnemonicToAccount(mnemonic)
  const deadline = Math.floor(Date.now() / 1000) + 24 * 60 * 60

  const signature = await account.signTypedData({
    domain: SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
    message: {
      deadline: BigInt(deadline),
      key: publicKeyHex as Hex,
      requestFid: BigInt(fid),
    },
    primaryType: 'SignedKeyRequest',
    types: {
      SignedKeyRequest: SIGNED_KEY_REQUEST_TYPE,
    },
  })

  const request = await createSignedKeyRequest({
    deadline,
    key: publicKeyHex,
    requestFid: fid,
    signature,
  })

  const deeplinkUrl = request.deeplinkUrl ?? request.deepLinkUrl
  if (!deeplinkUrl) {
    throw new Error('Signed key request response missing deeplinkUrl')
  }

  console.log('\nOpen this URL in Warpcast and approve the signer request:\n')
  console.log(deeplinkUrl)
  console.log('\nQR code:\n')
  qrcode.generate(deeplinkUrl, { small: true })
  console.log('\nWaiting for approval...\n')

  const completed = await waitForSignedKeyCompletion(request.token)

  console.log('Signed key request completed.')
  console.log('\nSet these env vars:\n')
  console.log(`FARCASTER_APP_FID=${String(completed.userFid ?? fid)}`)
  console.log(`FARCASTER_APP_KEY=${privateKeyHex}`)
  console.log(`FARCASTER_APP_KEY_PUBLIC=${publicKeyHex}`)
}
