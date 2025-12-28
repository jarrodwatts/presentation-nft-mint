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
          <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50 hover:border-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20">
            <img
              src={`https://avatar.vercel.sh/${address}.svg`}
              alt="Avatar"
              className="w-6 h-6 rounded-full"
            />
            <span className="text-sm font-mono text-zinc-300">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 bg-zinc-900/95 backdrop-blur-xl border-zinc-800 p-1.5 animate-in fade-in-0 zoom-in-95 duration-200">
          <DropdownMenuLabel className="flex items-center gap-3 px-2 py-2.5">
            <img
              src={`https://avatar.vercel.sh/${address}.svg`}
              alt="Avatar"
              className="w-9 h-9 rounded-full ring-2 ring-zinc-800"
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Connected</span>
              <span className="text-xs font-mono text-zinc-300">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-zinc-800/50 my-1.5" />
          <DropdownMenuItem 
            onClick={copyAddress}
            className="flex items-center gap-3 px-2 py-2.5 rounded-md cursor-pointer transition-all duration-200 focus:bg-zinc-800/80 focus:text-zinc-100 hover:bg-zinc-800/80 hover:translate-x-0.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center transition-colors group-hover:bg-zinc-700">
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200" />
              )}
            </div>
            <span className="text-sm text-zinc-300">{copied ? "Copied!" : "Copy address"}</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => window.open(`https://portal.abs.xyz/profile/${address}?t=nfts`, '_blank')}
            className="flex items-center gap-3 px-2 py-2.5 rounded-md cursor-pointer transition-all duration-200 focus:bg-zinc-800/80 focus:text-zinc-100 hover:bg-zinc-800/80 hover:translate-x-0.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center transition-colors group-hover:bg-zinc-700">
              <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200" />
            </div>
            <span className="text-sm text-zinc-300">View on Portal</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-zinc-800/50 my-1.5" />
          <DropdownMenuItem 
            onClick={logout}
            className="flex items-center gap-3 px-2 py-2.5 rounded-md cursor-pointer transition-all duration-200 focus:bg-red-500/10 hover:bg-red-500/10 hover:translate-x-0.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center transition-colors group-hover:bg-red-500/20">
              <LogOut className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-sm text-red-400">Disconnect</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button onClick={login} size="sm" className="h-9 glow-abstract">
      Connect with Abstract
    </Button>
  );
}
