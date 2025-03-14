import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Spltokenescrow } from "../target/types/spltokenescrow";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAccount,
  createMint,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import { randomBytes } from "crypto";

describe("spltokenescrow", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Spltokenescrow as Program<Spltokenescrow>;

  // Accounts.
  const maker = anchor.web3.Keypair.generate();
  const taker = anchor.web3.Keypair.generate();

  let mintA: anchor.web3.PublicKey;
  let makerAtaA: anchor.web3.PublicKey;
  let takerAtaA: anchor.web3.PublicKey;

  let mintB: anchor.web3.PublicKey;
  let makerAtaB: anchor.web3.PublicKey;
  let takerAtaB: anchor.web3.PublicKey;

  let vault: anchor.web3.PublicKey;
  let escrow: anchor.web3.PublicKey;

  const seed = new anchor.BN(1);
  const depositAmount = new anchor.BN(10);
  const receiveAmount = new anchor.BN(9);

  const makerAtaABalance = 1000;
  const takerAtaBBalance = 1000;

  beforeAll(async () => {
    const latestBlockhash = await provider.connection.getLatestBlockhash();

    const makerAirdrop = await provider.connection.requestAirdrop(
      maker.publicKey,
      100 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction({
      signature: makerAirdrop,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });

    const takerAirdrop = await provider.connection.requestAirdrop(
      taker.publicKey,
      100 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction({
      signature: takerAirdrop,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });

    mintA = await createMint(
      provider.connection,
      maker,
      maker.publicKey,
      null,
      6
    );
    makerAtaA = await createAccount(
      provider.connection,
      maker,
      mintA,
      maker.publicKey
    );
    takerAtaA = await createAccount(
      provider.connection,
      taker,
      mintA,
      taker.publicKey
    );

    mintB = await createMint(
      provider.connection,
      taker,
      taker.publicKey,
      null,
      6
    );
    makerAtaB = await createAccount(
      provider.connection,
      maker,
      mintB,
      maker.publicKey
    );
    takerAtaB = await createAccount(
      provider.connection,
      taker,
      mintB,
      taker.publicKey
    );

    await mintTo(
      provider.connection,
      maker,
      mintA,
      makerAtaA,
      maker,
      makerAtaABalance
    );
    await mintTo(
      provider.connection,
      taker,
      mintB,
      takerAtaB,
      taker,
      takerAtaBBalance
    );

    [escrow] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        maker.publicKey.toBuffer(),
        seed.toBuffer("le", 8),
      ],
      program.programId
    );

    vault = anchor.utils.token.associatedAddress({
      mint: mintA,
      owner: escrow,
    });
  });

  it("make offer", async () => {
    await program.methods
      .make(seed, receiveAmount, depositAmount)
      .accountsPartial({
        maker: maker.publicKey,
        mintA,
        mintB,
        makerMintAAta: makerAtaA,
        escrow,
        vault,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([maker])
      .rpc();

    const escrowAccount = await program.account.escrowState.fetch(escrow);
    const vaultAccount = await getAccount(provider.connection, vault);

    expect(escrowAccount.maker).toEqual(maker.publicKey);
    expect(escrowAccount.mintA).toEqual(mintA);
    expect(escrowAccount.mintB).toEqual(mintB);
    expect(escrowAccount.receiveAmount.toNumber()).toEqual(
      receiveAmount.toNumber()
    );
    expect(vaultAccount.amount).toEqual(BigInt(depositAmount.toString()));
  });

  it("take offer", async () => {
    await program.methods
      .take()
      .accountsPartial({
        taker: taker.publicKey,
        maker: maker.publicKey,
        mintA,
        mintB,
        takerMintAAta: takerAtaA,
        takerMintBAta: takerAtaB,
        makerMintBAta: makerAtaB,
        escrow,
        vault,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([taker])
      .rpc();

    // Check balances.
    const makerAtaBAccount = await getAccount(provider.connection, makerAtaB);
    const takerAtaAAccount = await getAccount(provider.connection, takerAtaA);
    expect(makerAtaBAccount.amount).toEqual(BigInt(receiveAmount.toNumber()));
    expect(takerAtaAAccount.amount).toEqual(BigInt(depositAmount.toNumber()));

    // Confirm both escrow and vault accounts are closed.
    try {
      await program.account.escrowState.fetch(escrow);
      fail("Escrow account has not been closed.");
    } catch (err: any) {
      expect(/does not exist/.test(err.toString())).toEqual(true);
    }

    try {
      await getAccount(provider.connection, vault);
      fail("Vault account has not been closed.");
    } catch (err: any) {
      expect(/TokenAccountNotFoundError/.test(err.toString())).toBe(true);
    }
  });

  it("refund", async () => {
    const seed2 = new anchor.BN(2);
    const [escrow2] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        maker.publicKey.toBuffer(),
        seed2.toBuffer("le", 8),
      ],
      program.programId
    );
    const vault2 = anchor.utils.token.associatedAddress({
      mint: mintA,
      owner: escrow2,
    });

    const makerAtaAAccountBefore = await getAccount(
      provider.connection,
      makerAtaA
    );

    await program.methods
      .make(seed2, receiveAmount, depositAmount)
      .accountsPartial({
        maker: maker.publicKey,
        mintA,
        mintB,
        makerMintAAta: makerAtaA,
        escrow: escrow2,
        vault: vault2,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([maker])
      .rpc();

    // Maker changed their mind and wants to initiate a refund.
    await program.methods
      .refund()
      .accountsPartial({
        maker: maker.publicKey,
        mintA,
        mintB,
        makerMintAAta: makerAtaA,
        escrow: escrow2,
        vault: vault2,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([maker])
      .rpc();

    // Verify that the balance remained unchanged after doing make and refund.
    const makerAtaAAccountAfter = await getAccount(
      provider.connection,
      makerAtaA
    );
    expect(makerAtaAAccountBefore.amount).toEqual(makerAtaAAccountAfter.amount);

    // Confirm both escrow and vault accounts are closed.
    try {
      await program.account.escrowState.fetch(escrow2);
      fail("Escrow account has not been closed.");
    } catch (err: any) {
      expect(/does not exist/.test(err.toString())).toEqual(true);
    }

    try {
      await getAccount(provider.connection, vault2);
      fail("Vault account has not been closed.");
    } catch (err: any) {
      expect(/TokenAccountNotFoundError/.test(err.toString())).toEqual(true);
    }
  });
});
