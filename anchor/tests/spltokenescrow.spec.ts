import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair } from '@solana/web3.js'
import { Spltokenescrow } from '../target/types/spltokenescrow'

describe('spltokenescrow', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const payer = provider.wallet as anchor.Wallet

  const program = anchor.workspace.Spltokenescrow as Program<Spltokenescrow>

  const spltokenescrowKeypair = Keypair.generate()

  it('Initialize Spltokenescrow', async () => {
    await program.methods
      .initialize()
      .accounts({
        spltokenescrow: spltokenescrowKeypair.publicKey,
        payer: payer.publicKey,
      })
      .signers([spltokenescrowKeypair])
      .rpc()

    const currentCount = await program.account.spltokenescrow.fetch(spltokenescrowKeypair.publicKey)

    expect(currentCount.count).toEqual(0)
  })

  it('Increment Spltokenescrow', async () => {
    await program.methods.increment().accounts({ spltokenescrow: spltokenescrowKeypair.publicKey }).rpc()

    const currentCount = await program.account.spltokenescrow.fetch(spltokenescrowKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Increment Spltokenescrow Again', async () => {
    await program.methods.increment().accounts({ spltokenescrow: spltokenescrowKeypair.publicKey }).rpc()

    const currentCount = await program.account.spltokenescrow.fetch(spltokenescrowKeypair.publicKey)

    expect(currentCount.count).toEqual(2)
  })

  it('Decrement Spltokenescrow', async () => {
    await program.methods.decrement().accounts({ spltokenescrow: spltokenescrowKeypair.publicKey }).rpc()

    const currentCount = await program.account.spltokenescrow.fetch(spltokenescrowKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Set spltokenescrow value', async () => {
    await program.methods.set(42).accounts({ spltokenescrow: spltokenescrowKeypair.publicKey }).rpc()

    const currentCount = await program.account.spltokenescrow.fetch(spltokenescrowKeypair.publicKey)

    expect(currentCount.count).toEqual(42)
  })

  it('Set close the spltokenescrow account', async () => {
    await program.methods
      .close()
      .accounts({
        payer: payer.publicKey,
        spltokenescrow: spltokenescrowKeypair.publicKey,
      })
      .rpc()

    // The account should no longer exist, returning null.
    const userAccount = await program.account.spltokenescrow.fetchNullable(spltokenescrowKeypair.publicKey)
    expect(userAccount).toBeNull()
  })
})
