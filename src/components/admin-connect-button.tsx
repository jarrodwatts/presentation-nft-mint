"use client";

import { useLoginWithAbstract } from "@abstract-foundation/agw-react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { LogOut, Wallet } from "lucide-react";
import { CHAIN } from "@/lib/wagmi";

export function AdminConnectButton() {
  const { address, isConnected, isConnecting } = useAccount();
  const { login, logout } = useLoginWithAbstract();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const injectedConnector = connectors.find((c) => c.type === "injected");

  if (isConnecting || isPending) {
    return (
      <Button
        disabled
        className="h-10 rounded-none bg-white/50 text-black border-0 font-bold uppercase tracking-widest text-xs"
      >
        Connecting...
      </Button>
    );
  }

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
          onClick={() => {
            logout();
            disconnect();
          }}
          className="p-2 border border-white/10 hover:border-red-500/30 hover:bg-red-500/10 transition-colors"
          aria-label="Disconnect wallet"
        >
          <LogOut className="w-4 h-4 text-zinc-500 hover:text-red-500" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={login}
        className="h-10 rounded-none bg-white text-black hover:bg-primary hover:text-black border-0 font-bold uppercase tracking-widest text-xs transition-all duration-300"
      >
        <Wallet className="w-4 h-4 mr-2" />
        AGW
      </Button>
      {injectedConnector && (
        <Button
          onClick={() => connect({ connector: injectedConnector, chainId: CHAIN.id })}
          variant="outline"
          className="h-10 rounded-none border-white/20 bg-transparent text-white hover:bg-white/10 hover:border-white/40 font-bold uppercase tracking-widest text-xs transition-all duration-300"
        >
          MetaMask
        </Button>
      )}
    </div>
  );
}
