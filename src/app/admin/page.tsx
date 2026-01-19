"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AdminConnectButton } from "@/components/admin-connect-button";
import { AGWProvider } from "@/lib/providers";
import { PRESENTATION_NFT_ABI, PRESENTATION_NFT_ADDRESS } from "@/lib/contracts";
import { type Presentation, formatError } from "@/lib/types";
import { toast } from "sonner";
import { Loader2, Terminal, Activity, Layers, ArrowRight, Upload, X, Eye } from "lucide-react";

export default function AdminPage() {
  return (
    <AGWProvider>
      <AdminPageContent />
    </AGWProvider>
  );
}

function AdminPageContent() {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const [newPresentation, setNewPresentation] = useState({
    name: "",
    description: "",
    imageUri: "",
    durationMinutes: 60,
    maxSupply: 0,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setIsUploading(true);
    try {
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: "POST",
        body: file,
      });

      if (!response.ok) throw new Error("Upload failed");

      const blob = await response.json();
      setNewPresentation((p) => ({ ...p, imageUri: blob.url }));
      toast.success("Image uploaded");
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const { data: adminRole } = useReadContract({
    address: PRESENTATION_NFT_ADDRESS,
    abi: PRESENTATION_NFT_ABI,
    functionName: "ADMIN_ROLE",
  });

  const { data: hasAdminRole, isLoading: isLoadingRole } = useReadContract({
    address: PRESENTATION_NFT_ADDRESS,
    abi: PRESENTATION_NFT_ABI,
    functionName: "hasRole",
    args: adminRole && address ? [adminRole, address] : undefined,
    query: { enabled: !!adminRole && !!address },
  });

  const { data: presentationCount } = useReadContract({
    address: PRESENTATION_NFT_ADDRESS,
    abi: PRESENTATION_NFT_ABI,
    functionName: "presentationCount",
  });

  const isAdmin = !!hasAdminRole;

  const { writeContract, isPending, data: txHash, reset } = useWriteContract();

  const { isSuccess: txConfirmed, isLoading: txWaiting } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (txConfirmed) {
      queryClient.invalidateQueries({ queryKey: ["readContract"] });
      toast.success("Edition created!");
      setNewPresentation({
        name: "",
        description: "",
        imageUri: "",
        durationMinutes: 60,
        maxSupply: 0,
      });
      reset();
    }
  }, [txConfirmed, queryClient, reset]);

  const isCreating = isPending || txWaiting;

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
        onError: (error: Error) => {
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
          
          <AdminConnectButton />
        </div>
      </main>
    );
  }

  if (isLoadingRole) {
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

  if (!isAdmin) {
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
                Admin Only
              </p>
            </div>
          </div>
          
          <div className="w-full h-px bg-white/10" />
          
          <div className="text-center space-y-4 w-full">
            <p className="text-white/40 text-xs font-mono">Connected as</p>
            <p className="text-white/60 text-xs font-mono break-all border border-white/10 p-3 bg-black/20">
              {address}
            </p>
          </div>
          
          <AdminConnectButton />
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
          <AdminConnectButton />
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
                <Label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold pl-1">Image</Label>
                {newPresentation.imageUri ? (
                  <div className="relative aspect-video bg-black/20 border border-white/10 overflow-hidden group">
                    <img
                      src={newPresentation.imageUri}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setNewPresentation((p) => ({ ...p, imageUri: "" }))}
                      className="absolute top-2 right-2 p-1 bg-black/80 border border-white/20 text-white/60 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`relative aspect-video border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer ${
                      isDragging ? "border-primary bg-primary/5" : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      aria-label="Upload image"
                    />
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-white/30" />
                        <span className="text-xs text-white/40 font-mono uppercase tracking-wider">
                          Drop image or click to upload
                        </span>
                      </>
                    )}
                  </div>
                )}
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
                disabled={isCreating}
                className="w-full rounded-none bg-primary text-black hover:bg-primary/90 font-bold h-12 mt-4 uppercase tracking-widest transition-all text-xs"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Edition
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </div>

          {(newPresentation.name || newPresentation.imageUri) && (
            <>
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10"></div>
                <div className="flex items-center gap-2 text-white/40">
                  <Eye className="w-4 h-4" />
                  <span className="font-display text-sm tracking-tight uppercase">Preview</span>
                </div>
                <div className="h-px flex-1 bg-white/10"></div>
              </div>

              <div className="border border-white/10 bg-white/[0.02] p-6">
                <div className="flex gap-4">
                  <div className="w-24 h-24 shrink-0 bg-zinc-900 border border-white/10 overflow-hidden">
                    {newPresentation.imageUri ? (
                      <img
                        src={newPresentation.imageUri}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Layers className="w-8 h-8 text-white/10" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <h3 className="font-display font-bold text-lg tracking-tight uppercase text-white truncate">
                      {newPresentation.name || "Untitled"}
                    </h3>
                    {newPresentation.description && (
                      <p className="text-sm text-white/50 line-clamp-2">{newPresentation.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-white/30 font-mono">
                      <span>{newPresentation.durationMinutes} MIN</span>
                      <span className="w-px h-3 bg-white/10" />
                      <span>{newPresentation.maxSupply > 0 ? `${newPresentation.maxSupply} MAX` : "UNLIMITED"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
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
        onError: (error: Error) => {
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
