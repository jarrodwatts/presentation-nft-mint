"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { LogOut, Wallet } from "lucide-react";
import { CHAIN } from "@/lib/wagmi";

export function AdminConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 border border-white/10 bg-white/5">
          <div className="w-2 h-2 bg-primary rounded-full" />
          <span className="text-xs font-mono text-zinc-300">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <button
          onClick={() => disconnect()}
          className="p-2 border border-white/10 hover:border-red-500/30 hover:bg-red-500/10 transition-colors"
          aria-label="Disconnect wallet"
        >
          <LogOut className="w-4 h-4 text-zinc-500 hover:text-red-500" />
        </button>
      </div>
    );
  }

  const injectedConnector = connectors.find((c) => c.type === "injected");

  return (
    <Button
      onClick={() => injectedConnector && connect({ connector: injectedConnector, chainId: CHAIN.id })}
      disabled={isPending || !injectedConnector}
      className="h-10 rounded-none bg-white text-black hover:bg-primary hover:text-black border-0 font-bold uppercase tracking-widest text-xs transition-all duration-300"
    >
      {isPending ? (
        "Connecting..."
      ) : (
        <>
          <Wallet className="w-4 h-4 mr-2" />
          Connect MetaMask
        </>
      )}
    </Button>
  );
}
