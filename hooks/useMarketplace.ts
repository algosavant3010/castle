"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { CastleEscrowABI } from '@/lib/chain/abis';
import { CONTRACTS } from '@/lib/chain/addresses';
import { parseEther } from 'viem';

export type TaskStatus = 'Open' | 'Accepted' | 'Submitted' | 'Released' | 'Disputed' | 'Cancelled';

export interface Task {
  id: number;
  buyer: `0x${string}`;
  worker: `0x${string}`;
  reward: bigint;
  specURI: string;
  resultURI: string;
  status: TaskStatus;
  createdAt: bigint;
  deadline: bigint;
}

const STATUS_MAP: TaskStatus[] = ['Open', 'Accepted', 'Submitted', 'Released', 'Disputed', 'Cancelled'];

export function useTaskCount() {
  return useReadContract({
    address: CONTRACTS.escrow,
    abi: CastleEscrowABI,
    functionName: 'taskCount',
    query: { enabled: CONTRACTS.escrow !== '0x0000000000000000000000000000000000000000' },
  });
}

export function useTask(taskId: number) {
  const { data, isLoading } = useReadContract({
    address: CONTRACTS.escrow,
    abi: CastleEscrowABI,
    functionName: 'getTask',
    args: [BigInt(taskId)],
    query: { enabled: CONTRACTS.escrow !== '0x0000000000000000000000000000000000000000' },
  });

  if (!data) return { task: null, isLoading };

  const [buyer, worker, reward, specURI, resultURI, status, createdAt, deadline] = data as [
    `0x${string}`, `0x${string}`, bigint, string, string, number, bigint, bigint
  ];

  const task: Task = {
    id: taskId,
    buyer,
    worker,
    reward,
    specURI,
    resultURI,
    status: STATUS_MAP[status] || 'Open',
    createdAt,
    deadline,
  };

  return { task, isLoading };
}

export function useCreateTask() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createTask = (specURI: string, deadlineHours: number, rewardMon: string) => {
    const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineHours * 3600);
    writeContract({
      address: CONTRACTS.escrow,
      abi: CastleEscrowABI,
      functionName: 'createTask',
      args: [specURI, deadline],
      value: parseEther(rewardMon),
    });
  };

  return { createTask, hash, isPending, isConfirming, isSuccess, error };
}

export function useReleaseFunds() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const release = (taskId: number) => {
    writeContract({
      address: CONTRACTS.escrow,
      abi: CastleEscrowABI,
      functionName: 'releaseFunds',
      args: [BigInt(taskId)],
    });
  };

  return { release, hash, isPending, isConfirming, isSuccess, error };
}
