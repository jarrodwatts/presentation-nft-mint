"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ConnectButton } from "@/components/connect-button";
import { PRESENTATION_NFT_ABI, PRESENTATION_NFT_ADDRESS } from "@/lib/contracts";
import { toast } from "sonner";
import { Loader2, Terminal, Activity, Layers } from "lucide-react";

const ERROR_PATTERNS: [RegExp, string][] = [
  [/user rejected/i, "Transaction cancelled"],
  [/insufficient funds/i, "Insufficient funds for gas"],
  [/ownable|not the owner/i, "Only the contract owner can do this"],
  [/reverted|revert/i, "Transaction failed"],
];

function formatError(error: Error): string {
  const msg = error.message || "Unknown error";
  
  for (const [pattern, friendlyMessage] of ERROR_PATTERNS) {
    if (pattern.test(msg)) return friendlyMessage;
  }
  
  const firstSentence = msg.split(/[.\n]/)[0];
  return firstSentence.length > 60 ? `${firstSentence.slice(0, 60)}...` : firstSentence;
}

interface Presentation {
  name: string;
  description: string;
  imageUri: string;
  startTime: bigint;
  endTime: bigint;
  isActive: boolean;
  maxSupply: bigint;
}

export default function AdminPage() {
  const { isConnected } = useAccount();
  const [newPresentation, setNewPresentation] = useState({
    name: "",
    description: "",
    imageUri: "",
    durationMinutes: 60,
    maxSupply: 0,
  });

  const { data: presentationCount, refetch: refetchCount } = useReadContract({
    address: PRESENTATION_NFT_ADDRESS,
    abi: PRESENTATION_NFT_ABI,
    functionName: "presentationCount",
  });

  const { writeContract, isPending, data: txHash } = useWriteContract();
  
  const { isSuccess: txConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (txConfirmed) {
      refetchCount();
    }
  }, [txConfirmed, refetchCount]);

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
      <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-[100px] pointer-events-none" />

        <div className="w-full max-w-sm border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl p-8 rounded-2xl flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-900/20">
              <Terminal className="w-5 h-5 text-zinc-950" />
            </div>
            <span className="font-bold text-xl tracking-tight">Admin Portal</span>
          </div>
          <p className="text-zinc-400 text-center text-sm">
            Authenticate to access presentation controls
          </p>
          <ConnectButton />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30 relative overflow-hidden">
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-teal-500/5 blur-[100px]" />
        <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full bg-emerald-500/5 blur-[80px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]" />
      </div>

      <div className="relative z-10">
        <header className="border-b border-zinc-800/50 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Terminal className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-bold tracking-tight text-zinc-100">ABSTRACT</span>
                <span className="text-[10px] uppercase tracking-wider text-emerald-500 font-semibold mt-0.5">Admin Console</span>
              </div>
            </div>
            <ConnectButton />
          </div>
        </header>

        <div className="container mx-auto px-6 py-8 grid gap-8 lg:grid-cols-12">
          
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-2 text-zinc-100 mb-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h2 className="font-semibold tracking-tight">Create Presentation</h2>
            </div>
            
            <div className="border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm rounded-xl p-6 shadow-sm">
              <form onSubmit={handleCreatePresentation} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold ml-1">Event Name</Label>
                  <Input
                    id="name"
                    placeholder="E.g. Abstract Summit 2024"
                    value={newPresentation.name}
                    onChange={(e) => setNewPresentation((p) => ({ ...p, name: e.target.value }))}
                    className="bg-zinc-950/50 border-zinc-800 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-10 transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold ml-1">Brief Description</Label>
                  <Input
                    id="description"
                    placeholder="Short summary for attendees"
                    value={newPresentation.description}
                    onChange={(e) => setNewPresentation((p) => ({ ...p, description: e.target.value }))}
                    className="bg-zinc-950/50 border-zinc-800 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-10 transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="imageUri" className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold ml-1">Asset URL</Label>
                  <Input
                    id="imageUri"
                    placeholder="ipfs://... or https://..."
                    value={newPresentation.imageUri}
                    onChange={(e) => setNewPresentation((p) => ({ ...p, imageUri: e.target.value }))}
                    className="bg-zinc-950/50 border-zinc-800 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-10 font-mono text-xs transition-colors"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="duration" className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold ml-1">Duration (Min)</Label>
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
                      className="bg-zinc-950/50 border-zinc-800 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-10 font-mono transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="maxSupply" className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold ml-1">Supply Cap</Label>
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
                      className="bg-zinc-950/50 border-zinc-800 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-10 font-mono transition-colors"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isPending}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold h-10 mt-2 transition-all"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    "Deploy Presentation Contract"
                  )}
                </Button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-zinc-100">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h2 className="font-semibold tracking-tight">Active Deployments</h2>
              </div>
              <Badge variant="outline" className="border-zinc-800 text-zinc-500 font-mono text-xs">
                {presentationCount?.toString() ?? "0"} Total
              </Badge>
            </div>

            <div className="border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm rounded-xl overflow-hidden">
              {presentationCount && Number(presentationCount) > 0 ? (
                <div className="divide-y divide-zinc-800/50">
                  {Array.from({ length: Number(presentationCount) }).map((_, i) => (
                    <PresentationRow
                      key={i}
                      tokenId={i}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-12 flex flex-col items-center justify-center text-zinc-500 gap-2">
                  <Layers className="w-8 h-8 opacity-20" />
                  <p className="text-sm">No presentations deployed yet</p>
                </div>
              )}
            </div>
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
  const { data: presentation, refetch: refetchPresentation } = useReadContract({
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
      refetchPresentation();
    }
  }, [toggleTxConfirmed, refetchPresentation]);

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
    <div className="flex items-center justify-between p-4 hover:bg-zinc-800/20 transition-colors group">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <span className="font-medium text-zinc-200 text-sm">{pres.name}</span>
          {isLive ? (
            <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-0 text-[10px] px-1.5 py-0 h-4 uppercase tracking-wider font-bold">
              Live
            </Badge>
          ) : isFinished ? (
            <Badge variant="outline" className="text-zinc-500 border-zinc-800 text-[10px] px-1.5 py-0 h-4 uppercase tracking-wider">
              Ended
            </Badge>
          ) : isPaused ? (
            <Badge variant="outline" className="text-amber-500/80 border-amber-500/30 text-[10px] px-1.5 py-0 h-4 uppercase tracking-wider">
              Paused
            </Badge>
          ) : (
            <Badge variant="outline" className="text-zinc-500 border-zinc-800 text-[10px] px-1.5 py-0 h-4 uppercase tracking-wider">
              Scheduled
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
          <span>ID: {tokenId}</span>
          <span className="w-1 h-1 rounded-full bg-zinc-800" />
          <span>
            Minted: <span className="text-zinc-300">{totalSupply?.toString() ?? "0"}</span>
            <span className="text-zinc-600"> / </span>
            {pres.maxSupply > 0n ? pres.maxSupply.toString() : "∞"}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor={`toggle-${tokenId}`} className="text-[10px] uppercase font-bold text-zinc-600 cursor-pointer group-hover:text-zinc-400 transition-colors">
            {pres.isActive ? "Active" : "Paused"}
          </Label>
          <Switch
            id={`toggle-${tokenId}`}
            checked={pres.isActive}
            onCheckedChange={handleToggle}
            disabled={isPending}
            className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-zinc-800"
          />
        </div>
      </div>
    </div>
  );
}
