"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ConnectButton } from "@/components/connect-button";
import { PRESENTATION_NFT_ABI, PRESENTATION_NFT_ADDRESS } from "@/lib/contracts";
import { type Presentation, formatError } from "@/lib/types";
import { toast } from "sonner";
import { Loader2, Terminal, Activity, Layers, ArrowRight } from "lucide-react";

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const [newPresentation, setNewPresentation] = useState({
    name: "",
    description: "",
    imageUri: "",
    durationMinutes: 60,
    maxSupply: 0,
  });

  const { data: contractOwner, isLoading: isLoadingOwner } = useReadContract({
    address: PRESENTATION_NFT_ADDRESS,
    abi: PRESENTATION_NFT_ABI,
    functionName: "owner",
  });

  const { data: presentationCount } = useReadContract({
    address: PRESENTATION_NFT_ADDRESS,
    abi: PRESENTATION_NFT_ABI,
    functionName: "presentationCount",
  });

  const isOwner = address && contractOwner && 
    address.toLowerCase() === (contractOwner as string).toLowerCase();

  const { writeContract, isPending, data: txHash } = useWriteContract();
  
  const { isSuccess: txConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (txConfirmed) {
      queryClient.invalidateQueries({ queryKey: ["readContract"] });
    }
  }, [txConfirmed, queryClient]);

  const handleCreatePresentation = async (e: React.FormEvent) => {
    e.preventDefault();

    const startTime = BigInt(Math.floor(Date.now() / 1000));
    const endTime = startTime + BigInt(newPresentation.durationMinutes * 60);

    writeContract(
      {
        address: PRESENTATION_NFT_ADDRESS,
        abi: PRESENTATION_NFT_ABI,
        functionName: "createPresentation",
        args: [
          newPresentation.name,
          newPresentation.description,
          newPresentation.imageUri,
          startTime,
          endTime,
          BigInt(newPresentation.maxSupply),
        ],
      },
      {
        onSuccess: () => {
          toast.success("Transaction submitted");
          setNewPresentation({
            name: "",
            description: "",
            imageUri: "",
            durationMinutes: 60,
            maxSupply: 0,
          });
        },
        onError: (error) => {
          toast.error(formatError(error));
        },
      }
    );
  };



  if (!isConnected) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 relative overflow-hidden font-body selection:bg-primary selection:text-black">
        <div className="w-full max-w-md border border-white/10 bg-black/40 p-12 flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border border-primary/20 bg-primary/5 flex items-center justify-center">
              <Terminal className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h1 className="font-display font-bold text-3xl tracking-tighter uppercase">Admin Portal</h1>
              <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest">
                Restricted Access
              </p>
            </div>
          </div>
          
          <div className="w-full h-px bg-white/10" />
          
          <ConnectButton />
        </div>
      </main>
    );
  }

  if (isLoadingOwner) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 font-body">
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest">
            Verifying Access
          </p>
        </div>
      </main>
    );
  }

  if (!isOwner) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 font-body selection:bg-primary selection:text-black">
        <div className="w-full max-w-md border border-red-500/20 bg-red-500/5 p-12 flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border border-red-500/30 bg-red-500/10 flex items-center justify-center">
              <Terminal className="w-8 h-8 text-red-500" />
            </div>
            <div className="text-center space-y-2">
              <h1 className="font-display font-bold text-3xl tracking-tighter uppercase text-red-500">Access Denied</h1>
              <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest">
                Owner Only
              </p>
            </div>
          </div>
          
          <div className="w-full h-px bg-white/10" />
          
          <div className="text-center space-y-4 w-full">
            <p className="text-white/40 text-xs font-mono">Connected as</p>
            <p className="text-white/60 text-xs font-mono break-all border border-white/10 p-3 bg-black/20">
              {address}
            </p>
            <p className="text-white/40 text-xs font-mono mt-4">Contract owner</p>
            <p className="text-white/60 text-xs font-mono break-all border border-white/10 p-3 bg-black/20">
              {contractOwner as string}
            </p>
          </div>
          
          <ConnectButton />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black font-body">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 border border-primary/20 bg-primary/5 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-xl tracking-tighter uppercase leading-none">Abstract<span className="text-primary">.</span></span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium mt-1">Admin Console</span>
            </div>
          </div>
          <ConnectButton />
        </div>
      </header>

      <div className="container mx-auto px-6 py-12 grid gap-12 lg:grid-cols-12">
        
        <div className="lg:col-span-5 space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10"></div>
            <div className="flex items-center gap-2 text-primary">
              <Layers className="w-4 h-4" />
              <h2 className="font-display text-lg tracking-tight uppercase">New Deployment</h2>
            </div>
            <div className="h-px flex-1 bg-white/10"></div>
          </div>
          
          <div className="border border-white/10 bg-white/[0.02] p-8">
            <form onSubmit={handleCreatePresentation} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold pl-1">Event Name</Label>
                <Input
                  id="name"
                  placeholder="E.G. ABSTRACT SUMMIT 2024"
                  value={newPresentation.name}
                  onChange={(e) => setNewPresentation((p) => ({ ...p, name: e.target.value }))}
                  className="rounded-none bg-black/20 border-white/10 focus:border-primary focus:ring-0 h-12 transition-colors placeholder:text-white/20 uppercase"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold pl-1">Description</Label>
                <Input
                  id="description"
                  placeholder="BRIEF SUMMARY"
                  value={newPresentation.description}
                  onChange={(e) => setNewPresentation((p) => ({ ...p, description: e.target.value }))}
                  className="rounded-none bg-black/20 border-white/10 focus:border-primary focus:ring-0 h-12 transition-colors placeholder:text-white/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUri" className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold pl-1">Asset URL</Label>
                <Input
                  id="imageUri"
                  placeholder="IPFS://... OR HTTPS://..."
                  value={newPresentation.imageUri}
                  onChange={(e) => setNewPresentation((p) => ({ ...p, imageUri: e.target.value }))}
                  className="rounded-none bg-black/20 border-white/10 focus:border-primary focus:ring-0 h-12 font-mono text-xs transition-colors placeholder:text-white/20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold pl-1">Duration (Min)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min={5}
                    value={newPresentation.durationMinutes || ""}
                    onChange={(e) =>
                      setNewPresentation((p) => ({
                        ...p,
                        durationMinutes: e.target.valueAsNumber || 60,
                      }))
                    }
                    className="rounded-none bg-black/20 border-white/10 focus:border-primary focus:ring-0 h-12 font-mono transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxSupply" className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold pl-1">Supply Cap</Label>
                  <Input
                    id="maxSupply"
                    type="number"
                    min={0}
                    placeholder="0 = ∞"
                    value={newPresentation.maxSupply || ""}
                    onChange={(e) =>
                      setNewPresentation((p) => ({
                        ...p,
                        maxSupply: e.target.valueAsNumber || 0,
                      }))
                    }
                    className="rounded-none bg-black/20 border-white/10 focus:border-primary focus:ring-0 h-12 font-mono transition-colors"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isPending}
                className="w-full rounded-none bg-primary text-black hover:bg-primary/90 font-bold h-12 mt-4 uppercase tracking-widest transition-all text-xs"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    Initialize Contract
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <Activity className="w-4 h-4 text-primary" />
               <h2 className="font-display text-lg tracking-tight uppercase">Live Contracts</h2>
            </div>
            <div className="border border-white/10 px-3 py-1 bg-white/5 font-mono text-xs text-muted-foreground">
              {presentationCount?.toString() ?? "0"} TOTAL
            </div>
          </div>

          <div className="border border-white/10 bg-white/[0.02]">
            {presentationCount && Number(presentationCount) > 0 ? (
              <div className="divide-y divide-white/5">
                {Array.from({ length: Number(presentationCount) }).map((_, i) => (
                  <PresentationRow
                    key={i}
                    tokenId={i}
                  />
                ))}
              </div>
            ) : (
              <div className="p-20 flex flex-col items-center justify-center text-muted-foreground gap-4">
                <Layers className="w-12 h-12 opacity-10" />
                <p className="text-sm font-mono uppercase tracking-widest opacity-50">System Empty</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function PresentationRow({
  tokenId,
}: {
  tokenId: number;
}) {
  const queryClient = useQueryClient();
  
  const { data: presentation } = useReadContract({
    address: PRESENTATION_NFT_ADDRESS,
    abi: PRESENTATION_NFT_ABI,
    functionName: "getPresentation",
    args: [BigInt(tokenId)],
  });

  const { data: totalSupply } = useReadContract({
    address: PRESENTATION_NFT_ADDRESS,
    abi: PRESENTATION_NFT_ABI,
    functionName: "totalSupply",
    args: [BigInt(tokenId)],
  });

  const { writeContract, isPending, data: toggleTxHash } = useWriteContract();
  
  const { isSuccess: toggleTxConfirmed } = useWaitForTransactionReceipt({ hash: toggleTxHash });

  useEffect(() => {
    if (toggleTxConfirmed) {
      queryClient.invalidateQueries({ queryKey: ["readContract"] });
    }
  }, [toggleTxConfirmed, queryClient]);

  const handleToggle = (checked: boolean) => {
    writeContract(
      {
        address: PRESENTATION_NFT_ADDRESS,
        abi: PRESENTATION_NFT_ABI,
        functionName: "setMintingActive",
        args: [BigInt(tokenId), checked],
      },
      {
        onSuccess: () => {
          toast.success(`Minting ${checked ? "enabled" : "disabled"}`);
        },
        onError: (error) => {
          toast.error(formatError(error));
        },
      }
    );
  };

  if (!presentation) return null;

  const pres = presentation as Presentation;
  const now = BigInt(Math.floor(Date.now() / 1000));
  const isLive = pres.isActive && now >= pres.startTime && now <= pres.endTime;
  const isFinished = now > pres.endTime;
  const isPaused = !pres.isActive;

  return (
    <div className="flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors group border-l-2 border-transparent hover:border-primary">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <span className="font-display font-bold text-lg tracking-tight uppercase text-foreground">{pres.name}</span>
          {isLive ? (
            <Badge className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 rounded-none text-[10px] px-2 py-0.5 uppercase tracking-widest font-bold">
              Live
            </Badge>
          ) : isFinished ? (
            <Badge variant="outline" className="text-muted-foreground border-white/10 rounded-none text-[10px] px-2 py-0.5 uppercase tracking-widest">
              Ended
            </Badge>
          ) : isPaused ? (
            <Badge variant="outline" className="text-amber-500/80 border-amber-500/30 rounded-none text-[10px] px-2 py-0.5 uppercase tracking-widest">
              Paused
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground border-white/10 rounded-none text-[10px] px-2 py-0.5 uppercase tracking-widest">
              Scheduled
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
          <span className="text-white/30">ID_0{tokenId}</span>
          <span className="w-px h-3 bg-white/10" />
          <span>
            MINTED: <span className="text-foreground">{totalSupply?.toString() ?? "0"}</span>
            <span className="text-white/20 mx-1">/</span>
            {pres.maxSupply > 0n ? pres.maxSupply.toString() : "∞"}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <Label htmlFor={`toggle-${tokenId}`} className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground cursor-pointer group-hover:text-foreground transition-colors">
            {pres.isActive ? "Active" : "Paused"}
          </Label>
          <Switch
            id={`toggle-${tokenId}`}
            checked={pres.isActive}
            onCheckedChange={handleToggle}
            disabled={isPending}
            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-zinc-800 border border-white/10 rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
