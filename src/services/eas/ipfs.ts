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
