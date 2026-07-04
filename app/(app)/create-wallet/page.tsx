"use client";

import { useState, useEffect } from "react";
import { useWallets } from "@/hooks/useWallets";
import { useDeployWallet } from "@/hooks/useDeployWallet";
import { CONTRACTS } from "@/lib/chain/addresses";
import { MONAD_TESTNET_EXPLORER } from "@/lib/chain/config";
import { useAccount } from "wagmi";
import Link from "next/link";
import BorderGlow from "@/components/reactbits/interactions/BorderGlow";
import { GLOW_PROPS } from "@/lib/ui";
import { useWalletNames } from "@/hooks/useWalletNames";

export default function CreateWalletPage() {
  const { address: userAddress } = useAccount();
  const { wallets, refetch: refetchWallets } = useWallets();
  const { deploy, reset: resetDeploy, hash, isPending, isConfirming, isSuccess, error } = useDeployWallet();
  const { saveName } = useWalletNames();

  const [step, setStep] = useState<"configure" | "deploying" | "success">("configure");
  const [walletName, setWalletName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [newWalletAddress, setNewWalletAddress] = useState("");
  const [initialWalletCount] = useState(wallets.length);

  const contractsDeployed = CONTRACTS.factory !== "0x0000000000000000000000000000000000000000";

  // Handle MetaMask rejection / errors — reset to configure
  useEffect(() => {
    if (error && step === "deploying") {
      const msg = error.message?.includes("User rejected")
        ? "Transaction cancelled in wallet."
        : error.message || "Deployment failed. Please try again.";
      setErrorMsg(msg);
      setStep("configure");
      resetDeploy();
    }
  }, [error, step, resetDeploy]);

  // After deploy tx confirms, refetch wallets to find the new one
  useEffect(() => {
    if (isSuccess && step === "deploying") {
      const timer = setTimeout(async () => {
        await refetchWallets();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, step, refetchWallets]);

  // Detect the newly deployed wallet from the updated wallets array
  useEffect(() => {
    if (step === "deploying" && isSuccess && wallets.length > initialWalletCount) {
      const newest = wallets[wallets.length - 1];
      setNewWalletAddress(newest);

      // Save wallet name to Supabase
      saveName(newest, walletName.trim());

      setStep("success");
    }
  }, [wallets, step, isSuccess, initialWalletCount, walletName]);

  const handleDeploy = () => {
    setErrorMsg("");
    if (!contractsDeployed) { setErrorMsg("Contracts not deployed."); return; }
    if (!userAddress) { setErrorMsg("Connect your wallet first."); return; }
    if (!walletName.trim()) { setErrorMsg("Wallet name is required."); return; }

    setStep("deploying");
    deploy();
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Header */}
      <div>
        <Link
          href="/wallets"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors mb-4"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to AI Wallets
        </Link>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-text">New AI Wallet</h1>
        <p className="mt-1 text-sm text-muted">
          Deploy a dedicated smart contract wallet on Monad. You can create sessions on it afterwards.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-4">
          <p className="text-sm text-danger">{errorMsg}</p>
        </div>
      )}

      {/* Configure Step */}
      {step === "configure" && (
        <BorderGlow {...GLOW_PROPS}>
          <div className="p-6 space-y-5">
            <div>
              <label className="text-xs text-faint block mb-1.5">Wallet Name</label>
              <input
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder="e.g. Trading Bot, Payment Agent"
                maxLength={32}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-text placeholder:text-faint"
              />
              <p className="text-[11px] text-faint mt-1.5">
                A label to identify this wallet.
              </p>
            </div>

            <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-4 space-y-2">
              <p className="text-xs text-muted font-medium">What you get:</p>
              <ul className="text-xs text-faint space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">&#x2022;</span>
                  A dedicated smart contract wallet owned by your connected address
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">&#x2022;</span>
                  Ability to create AI sessions with spending limits and permissions
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">&#x2022;</span>
                  Full control: freeze sessions, withdraw funds anytime
                </li>
              </ul>
            </div>

            <button
              onClick={handleDeploy}
              disabled={!contractsDeployed || !userAddress}
              className="btn btn-primary w-full py-3 text-sm font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Deploy AI Wallet
            </button>
            <p className="text-[11px] text-faint text-center">Requires 1 transaction confirmation in MetaMask.</p>
          </div>
        </BorderGlow>
      )}

      {/* Deploying Step */}
      {step === "deploying" && (
        <BorderGlow {...GLOW_PROPS}>
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center animate-pulse">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent animate-spin">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-text">
                {isPending && "Confirm deployment in your wallet..."}
                {isConfirming && "Deploying AI Wallet on Monad..."}
                {isSuccess && "Wallet deployed! Detecting address..."}
              </p>
              <p className="text-xs text-muted mt-1">This takes a few seconds.</p>
            </div>
            {hash && (
              <a
                href={`${MONAD_TESTNET_EXPLORER}/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent hover:text-accent-hover"
              >
                View transaction &#x2192;
              </a>
            )}
            <button
              onClick={() => { setStep("configure"); resetDeploy(); }}
              className="text-xs text-faint hover:text-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </BorderGlow>
      )}

      {/* Success Step */}
      {step === "success" && newWalletAddress && (
        <div className="space-y-4">
          <BorderGlow {...GLOW_PROPS}>
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-safe/10 border border-safe/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-safe">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-text">
                  {walletName.trim() || "AI Wallet"} deployed!
                </p>
                <p className="text-xs text-muted mt-1 font-mono">{newWalletAddress}</p>
              </div>
              {hash && (
                <a
                  href={`${MONAD_TESTNET_EXPLORER}/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:text-accent-hover inline-block"
                >
                  View deploy transaction &#x2192;
                </a>
              )}
            </div>
          </BorderGlow>

          <div className="rounded-xl border border-accent/15 bg-accent/5 p-4">
            <p className="text-sm text-text font-medium">Next step: Create a session</p>
            <p className="text-xs text-muted mt-1">
              Add an AI session to this wallet with spending limits and contract permissions.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/wallets/${newWalletAddress}`}
              className="btn btn-primary flex-1 justify-center"
            >
              Open Wallet &amp; Create Session
            </Link>
            <button
              onClick={() => {
                setStep("configure");
                setNewWalletAddress("");
                setWalletName("");
                resetDeploy();
              }}
              className="btn btn-ghost flex-1 justify-center"
            >
              Deploy Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
