"use client";

import { useState } from "react";
import { useLoginWithAbstract } from "@abstract-foundation/agw-react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, Copy, LogOut, ChevronDown, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export function ConnectButton() {
  const { login, logout } = useLoginWithAbstract();
  const { address, isConnected, isConnecting } = useAccount();
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success("Address copied");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isConnecting) {
    return (
      <Button disabled variant="secondary" size="sm" className="h-9">
        Connecting...
      </Button>
    );
  }

  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button 
            aria-label="Account menu"
            className="flex items-center gap-2 px-3 py-2 border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 group"
          >
            <div className="w-5 h-5 bg-gradient-to-tr from-primary to-zinc-500 rounded-none opacity-80 group-hover:opacity-100" />
            <span className="text-xs font-mono text-zinc-300 uppercase tracking-widest">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
            <ChevronDown className="w-3 h-3 text-zinc-500 group-hover:text-primary transition-colors" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 bg-[#050505] border border-white/10 p-0 rounded-none animate-in fade-in-0 zoom-in-95 duration-200 shadow-2xl shadow-black">
          <DropdownMenuLabel className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
            <div className="w-8 h-8 bg-gradient-to-tr from-primary to-zinc-800 rounded-none" />
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-primary uppercase tracking-widest font-bold">Connected</span>
              <span className="text-xs font-mono text-white/60">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </div>
          </DropdownMenuLabel>
          <div className="p-2">
            <DropdownMenuItem 
              onClick={copyAddress}
              className="flex items-center gap-3 px-3 py-2 rounded-none cursor-pointer transition-all duration-200 focus:bg-white/5 hover:bg-white/5 group border border-transparent hover:border-white/5"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white" />
                )}
              </div>
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 group-hover:text-white">{copied ? "Copied!" : "Copy address"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => window.open(`https://portal.abs.xyz/profile/${address}?t=nfts`, '_blank')}
              className="flex items-center gap-3 px-3 py-2 rounded-none cursor-pointer transition-all duration-200 focus:bg-white/5 hover:bg-white/5 group border border-transparent hover:border-white/5"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white" />
              </div>
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 group-hover:text-white">View on Portal</span>
            </DropdownMenuItem>
            <div className="h-[1px] bg-white/5 my-2" />
            <DropdownMenuItem 
              onClick={logout}
              className="flex items-center gap-3 px-3 py-2 rounded-none cursor-pointer transition-all duration-200 focus:bg-red-500/10 hover:bg-red-500/10 group border border-transparent hover:border-red-500/20"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <LogOut className="w-3.5 h-3.5 text-red-900 group-hover:text-red-500" />
              </div>
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 group-hover:text-red-400">Disconnect</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button 
      onClick={login}
      aria-label="Connect wallet"
      className="h-10 rounded-none bg-white text-black hover:bg-primary hover:text-black border-0 font-bold uppercase tracking-widest text-xs transition-all duration-300 focus:ring-2 focus:ring-primary/50"
    >
      Connect Wallet
    </Button>
  );
}
