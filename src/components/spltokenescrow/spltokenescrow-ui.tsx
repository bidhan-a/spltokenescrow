"use client";

import { Keypair, PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { ellipsify } from "../ui/ui-layout";
import { ExplorerLink } from "../cluster/cluster-ui";
import {
  useSpltokenescrowProgram,
  useSpltokenescrowProgramAccount,
} from "./spltokenescrow-data-access";
import { useAnchorProvider } from "../solana/solana-provider";

export function SpltokenescrowCreate() {
  const { initialize } = useSpltokenescrowProgram();

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => initialize.mutateAsync(Keypair.generate())}
      disabled={initialize.isPending}
    >
      Create {initialize.isPending && "..."}
    </button>
  );
}

export function SpltokenescrowList() {
  const { accounts, getProgramAccount } = useSpltokenescrowProgram();

  if (getProgramAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>;
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>
          Program account not found. Make sure you have deployed the program and
          are on the correct cluster.
        </span>
      </div>
    );
  }
  return (
    <div className={"space-y-6"}>
      {accounts.isLoading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : accounts.data?.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {accounts.data?.map((account) => (
            <SpltokenescrowCard
              key={account.publicKey.toString()}
              account={account.publicKey}
            />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className={"text-2xl"}>No accounts</h2>
          No accounts found. Create one above to get started.
        </div>
      )}
    </div>
  );
}

function SpltokenescrowCard({ account }: { account: PublicKey }) {
  const { accountQuery, vaultQuery, takeMutation, refundMutation } =
    useSpltokenescrowProgramAccount({
      account,
    });

  const provider = useAnchorProvider();

  return vaultQuery.isLoading ? (
    <span className="loading loading-spinner loading-lg"></span>
  ) : (
    <div className="card card-bordered border-base-300 border-4 text-neutral-content">
      <div className="card-body items-center text-center">
        <div className="space-y-6">
          <h2
            className="card-title justify-center text-3xl cursor-pointer"
            onClick={() => accountQuery.refetch()}
          >
            {vaultQuery.data?.amount?.toString()}
          </h2>
          <div className="card-actions justify-around"></div>
          <div className="text-center space-y-4">
            <p>
              <ExplorerLink
                path={`account/${account}`}
                label={ellipsify(account.toString())}
              />
            </p>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => takeMutation.mutateAsync()}
        >
          Take
        </button>
        {accountQuery?.data?.maker?.equals(provider.publicKey) ? (
          <button
            className="btn btn-primary"
            onClick={() => refundMutation.mutateAsync()}
          >
            Refund
          </button>
        ) : null}
      </div>
    </div>
  );
}
