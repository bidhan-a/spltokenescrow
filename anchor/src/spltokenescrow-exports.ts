// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import SpltokenescrowIDL from '../target/idl/spltokenescrow.json'
import type { Spltokenescrow } from '../target/types/spltokenescrow'

// Re-export the generated IDL and type
export { Spltokenescrow, SpltokenescrowIDL }

// The programId is imported from the program IDL.
export const SPLTOKENESCROW_PROGRAM_ID = new PublicKey(SpltokenescrowIDL.address)

// This is a helper function to get the Spltokenescrow Anchor program.
export function getSpltokenescrowProgram(provider: AnchorProvider, address?: PublicKey) {
  return new Program({ ...SpltokenescrowIDL, address: address ? address.toBase58() : SpltokenescrowIDL.address } as Spltokenescrow, provider)
}

// This is a helper function to get the program ID for the Spltokenescrow program depending on the cluster.
export function getSpltokenescrowProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Spltokenescrow program on devnet and testnet.
      return new PublicKey('coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF')
    case 'mainnet-beta':
    default:
      return SPLTOKENESCROW_PROGRAM_ID
  }
}
