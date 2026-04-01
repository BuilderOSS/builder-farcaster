import { CID } from 'multiformats/cid'

/**
 * Checks if a string is a valid IPFS CID
 * @param str - The string to check
 * @returns True if the string is a valid IPFS CID, false otherwise
 */
function isCID(str: string | null | undefined): str is string {
  if (!str) return false

  try {
    CID.parse(str)
    return true
  } catch {
    if (/^(?:bafy|Qm)/.test(str)) return true
    return false
  }
}

const IPFS_ENDPOINTS = [
  `https://nouns-builder.mypinata.cloud/ipfs/`,
  `https://ipfs.io/ipfs/`,
  `https://dweb.link/ipfs/`,
  `https://w3s.link/ipfs/`,
  `https://flk-ipfs.xyz/ipfs/`,
  `https://ipfs.decentralized-content.com/ipfs/`,
  `https://gateway.pinata.cloud/ipfs`,
]

const REQUEST_TIMEOUT = 10000 // 10 seconds

/**
 * Checks whether an IPv4 address is in a private/local range.
 * @param address - IPv4 address.
 * @returns True when private/local.
 */
function isPrivateIPv4(address: string): boolean {
  const parts = address.split('.').map((part) => Number.parseInt(part, 10))
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false
  }

  const [first, second] = parts

  return (
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  )
}

/**
 * Checks whether a value is a syntactically valid IPv4 address.
 * @param address - Candidate address.
 * @returns True when valid IPv4.
 */
function isIPv4Address(address: string): boolean {
  const parts = address.split('.')
  if (parts.length !== 4) {
    return false
  }

  return parts.every((part) => {
    const parsed = Number.parseInt(part, 10)
    return !Number.isNaN(parsed) && parsed >= 0 && parsed <= 255
  })
}

/**
 * Checks whether a value looks like an IPv6 address.
 * @param address - Candidate address.
 * @returns True when value appears to be IPv6.
 */
function isIPv6Address(address: string): boolean {
  return address.includes(':') && /^[0-9a-f:]+$/i.test(address)
}

/**
 * Checks whether an IPv6 address is in a private/local range.
 * @param address - IPv6 address.
 * @returns True when private/local.
 */
function isPrivateIPv6(address: string): boolean {
  const normalized = address.toLowerCase()

  if (normalized === '::1') {
    return true
  }

  if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
    return true
  }

  if (
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb')
  ) {
    return true
  }

  if (normalized.includes('::ffff:')) {
    const mapped = normalized.split('::ffff:')[1]
    if (mapped && isPrivateIPv4(mapped)) {
      return true
    }
  }

  return false
}

/**
 * Checks whether an IP address is in a blocked private/local range.
 * @param address - IP address.
 * @returns True when private/local.
 */
function isPrivateIPAddress(address: string): boolean {
  if (isIPv4Address(address)) {
    return isPrivateIPv4(address)
  }

  if (isIPv6Address(address)) {
    return isPrivateIPv6(address)
  }

  return false
}

/**
 * Ensures an HTTP URL does not resolve to private-network targets.
 * @param rawUrl - Candidate HTTP(S) URL.
 */
function assertPublicHttpTarget(rawUrl: string): void {
  const parsed = new URL(rawUrl)
  const hostname = parsed.hostname.toLowerCase()

  if (hostname === 'localhost') {
    throw new Error(`Blocked private-network URL host: ${hostname}`)
  }

  if (isPrivateIPAddress(hostname)) {
    throw new Error(`Blocked private-network IP: ${hostname}`)
  }
}

/**
 * Fetches content from IPFS using multiple gateways
 * @param cid - The IPFS CID to fetch, with or without protocol prefix
 * @returns The content fetched from IPFS as a string
 */
const fetchFromIPFS = async (cid: string | undefined): Promise<string> => {
  if (!isCID(cid)) {
    throw new Error('CID is invalid')
  }

  const urls = IPFS_ENDPOINTS.map((endpoint) => `${endpoint}${cid}`)

  for (const url of urls) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, REQUEST_TIMEOUT)

      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)

      if (!res.ok) throw new Error(`HTTP ${String(res.status)}`)

      const data = await res.text()
      return data
    } catch (err) {
      console.warn(`Failed to fetch from ${url}: ${(err as Error).message}`)
    }
  }

  throw new Error(`Failed to fetch from IPFS for CID: ${cid}`)
}

const fetchWithTimeout = async (url: string) => {
  try {
    assertPublicHttpTarget(url)

    const controller = new AbortController()
    const { signal } = controller

    // Set a 10s timeout for the request
    const timeoutId = setTimeout(function () {
      controller.abort()
    }, REQUEST_TIMEOUT)

    const res = await fetch(url, { signal })
    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status.toString()}`)
    }

    return await res.text()
  } catch (error) {
    console.error(`Failed to fetch from URL: ${url}`, error)
    throw new Error(`Failed to fetch from URL: ${url}`)
  }
}

/**
 * Fetches content from a URL
 * @param url - The URL to fetch, can be http, https, or ipfs
 * @returns The content fetched from the URI as a string
 */
export const fetchFromURL = async (url: string): Promise<string> => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return fetchWithTimeout(url)
  }
  if (url.startsWith('ipfs://')) {
    return fetchFromIPFS(url.replace('ipfs://', ''))
  }
  throw new Error(`Unsupported URI: ${url}`)
}
