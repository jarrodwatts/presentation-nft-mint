"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { CHAIN } from "@/lib/wagmi";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NetworkGuard() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected || chainId === CHAIN.id) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500/10 border-b border-yellow-500/30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-yellow-500">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-mono uppercase tracking-wider">
            Wrong network. Switch to {CHAIN.name} to continue.
          </span>
        </div>
        <Button
          onClick={() => switchChain({ chainId: CHAIN.id })}
          disabled={isPending}
          className="h-8 rounded-none bg-yellow-500 text-black hover:bg-yellow-400 text-xs font-bold uppercase tracking-wider"
        >
          {isPending ? "Switching..." : "Switch Network"}
        </Button>
      </div>
    </div>
  );
}
