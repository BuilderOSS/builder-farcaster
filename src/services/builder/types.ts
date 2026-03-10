import { CHAIN_ID } from '@buildeross/types'
import { Hex } from 'viem'

export interface Env {
  ENABLE_TESTNET_CHAINS?: string
}

export interface Chain {
  id: CHAIN_ID
  name: string
  isTestnet?: boolean
}

export interface Dao {
  id: string
  name: string
  ownerCount: number
  chain: Chain
}

export interface Owner {
  id: string
  owner: string
  dao: Dao
  daoTokenCount: number
}

export interface Proposal {
  id: string
  proposalNumber: number
  dao: Dao
  title: string
  proposer: string
  timeCreated: string
  voteStart: string
  voteEnd: string
}

export interface Attestation {
  id: Hex
  recipient: string
  decodedDataJson: string
  timeCreated: number
}

export interface AttestationJsonData {
  name: string
  type: string
  signature: string
  value: {
    name: string
    type: string
    value: string | number
  }
}

export interface PropdateMessage {
  milestoneId?: number
  content: string
  labels?: string[]
  attachments?: string[]
}

export enum MessageType {
  INLINE_TEXT = 0,
  INLINE_JSON,
  URL_TEXT,
  URL_JSON,
}

export interface PropdateObject {
  proposalId: Hex
  originalMessageId: Hex
  messageType: MessageType
  message: string
  parsedMessage: PropdateMessage
}

export interface Propdate extends PropdateObject {
  id: Hex
  chain: Chain
  recipient: string
  timeCreated: number
}
