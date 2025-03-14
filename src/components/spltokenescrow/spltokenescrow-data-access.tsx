'use client'

import { getSpltokenescrowProgram, getSpltokenescrowProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'

export function useSpltokenescrowProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getSpltokenescrowProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getSpltokenescrowProgram(provider, programId), [provider, programId])

  const accounts = useQuery({
    queryKey: ['spltokenescrow', 'all', { cluster }],
    queryFn: () => program.account.spltokenescrow.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const initialize = useMutation({
    mutationKey: ['spltokenescrow', 'initialize', { cluster }],
    mutationFn: (keypair: Keypair) =>
      program.methods.initialize().accounts({ spltokenescrow: keypair.publicKey }).signers([keypair]).rpc(),
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: () => toast.error('Failed to initialize account'),
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize,
  }
}

export function useSpltokenescrowProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useSpltokenescrowProgram()

  const accountQuery = useQuery({
    queryKey: ['spltokenescrow', 'fetch', { cluster, account }],
    queryFn: () => program.account.spltokenescrow.fetch(account),
  })

  const closeMutation = useMutation({
    mutationKey: ['spltokenescrow', 'close', { cluster, account }],
    mutationFn: () => program.methods.close().accounts({ spltokenescrow: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accounts.refetch()
    },
  })

  const decrementMutation = useMutation({
    mutationKey: ['spltokenescrow', 'decrement', { cluster, account }],
    mutationFn: () => program.methods.decrement().accounts({ spltokenescrow: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const incrementMutation = useMutation({
    mutationKey: ['spltokenescrow', 'increment', { cluster, account }],
    mutationFn: () => program.methods.increment().accounts({ spltokenescrow: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const setMutation = useMutation({
    mutationKey: ['spltokenescrow', 'set', { cluster, account }],
    mutationFn: (value: number) => program.methods.set(value).accounts({ spltokenescrow: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  return {
    accountQuery,
    closeMutation,
    decrementMutation,
    incrementMutation,
    setMutation,
  }
}
