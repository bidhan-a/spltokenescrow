"use client";

import {
  getSpltokenescrowProgram,
  getSpltokenescrowProgramId,
} from "@project/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import { Cluster, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import toast from "react-hot-toast";
import { useCluster } from "../cluster/cluster-data-access";
import { useAnchorProvider } from "../solana/solana-provider";
import { useTransactionToast } from "../ui/ui-layout";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";

export function useSpltokenescrowProgram() {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();
  const programId = useMemo(
    () => getSpltokenescrowProgramId(cluster.network as Cluster),
    [cluster]
  );
  const program = useMemo(
    () => getSpltokenescrowProgram(provider, programId),
    [provider, programId]
  );

  const accounts = useQuery({
    queryKey: ["spltokenescrow", "all", { cluster }],
    queryFn: () => program.account.escrowState.all(),
  });

  const getProgramAccount = useQuery({
    queryKey: ["get-program-account", { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  });

  const initialize = useMutation({
    mutationKey: ["spltokenescrow", "initialize", { cluster }],
    mutationFn: async (keypair: Keypair) => {
      const seed = new BN(1);
      const receiveAmount = new BN(25);
      const depositAmount = new BN(50);
      const mintA = new PublicKey(
        "8PwTZFDVrZP5CGhYpQf1sJC4dP6cNipQfvkXFx1jb9fs" // Turbo
      );
      const mintB = new PublicKey(
        "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU" // USDC
      );
      const mintAtaA = getAssociatedTokenAddressSync(mintA, provider.publicKey);

      const [escrow] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          provider.publicKey.toBuffer(),
          seed.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );
      const vault = getAssociatedTokenAddressSync(mintA, escrow, true);
      return program.methods
        .make(seed, receiveAmount, depositAmount)
        .accountsStrict({
          maker: provider.publicKey,
          mintA,
          mintB,
          makerMintAAta: mintAtaA,
          vault,
          escrow,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to initialize account"),
  });

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize,
  };
}

export function useSpltokenescrowProgramAccount({
  account,
}: {
  account: PublicKey;
}) {
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const { program, accounts } = useSpltokenescrowProgram();
  const provider = useAnchorProvider();

  const accountQuery = useQuery({
    queryKey: ["spltokenescrow", "fetch", { cluster, account }],
    queryFn: () => program.account.escrowState.fetch(account),
  });

  const vaultQuery = useQuery({
    queryKey: ["spltokenescrow-vault", "fetch", { cluster, account }],
    queryFn: async () => {
      const mintA = new PublicKey(
        "8PwTZFDVrZP5CGhYpQf1sJC4dP6cNipQfvkXFx1jb9fs"
      );
      const vault = getAssociatedTokenAddressSync(mintA, account, true);
      const vaultAccount = await getAccount(provider.connection, vault);
      return vaultAccount;
    },
  });

  return {
    accountQuery,
    vaultQuery,
  };
}
