"use client";

import { useEffect } from "react";
import { useAccount, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { useWriteContractSponsored, useLoginWithAbstract } from "@abstract-foundation/agw-react";
import { getGeneralPaymasterInput } from "viem/zksync";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PRESENTATION_NFT_ABI, PRESENTATION_NFT_ADDRESS, PAYMASTER_ADDRESS } from "@/lib/contracts";
import { toast } from "sonner";
import { CheckCircle2, Clock, Loader2, ExternalLink, Wallet, Zap, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Presentation {
  name: string;
  description: string;
  imageUri: string;
  startTime: bigint;
  endTime: bigint;
  isActive: boolean;
  maxSupply: bigint;
}

interface MintCardProps {
  tokenId: number;
}

export function MintCard({ tokenId }: MintCardProps) {
  const { address, isConnected } = useAccount();
  const { login } = useLoginWithAbstract();

  const { data: presentation } = useReadContract({
    address: PRESENTATION_NFT_ADDRESS,
    abi: PRESENTATION_NFT_ABI,
    functionName: "getPresentation",
    args: [BigInt(tokenId)],
  });

  const { data: hasMinted, refetch: refetchHasMinted } = useReadContract({
    address: PRESENTATION_NFT_ADDRESS,
    abi: PRESENTATION_NFT_ABI,
    functionName: "hasMinted",
    args: address ? [address, BigInt(tokenId)] : undefined,
    query: { enabled: !!address },
  });

  const { data: canMint, refetch: refetchCanMint } = useReadContract({
    address: PRESENTATION_NFT_ADDRESS,
    abi: PRESENTATION_NFT_ABI,
    functionName: "canMint",
    args: address ? [BigInt(tokenId), address] : undefined,
    query: { enabled: !!address },
  });

  const { data: totalSupply, refetch: refetchTotalSupply } = useReadContract({
    address: PRESENTATION_NFT_ADDRESS,
    abi: PRESENTATION_NFT_ABI,
    functionName: "totalSupply",
    args: [BigInt(tokenId)],
  });

  const { writeContractSponsored, isPending, isSuccess, error, data: txHash } = useWriteContractSponsored();
  
  const { isSuccess: txConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (txConfirmed) {
      refetchTotalSupply();
      refetchHasMinted();
      refetchCanMint();
      toast.success("NFT minted!");
    }
  }, [txConfirmed, refetchTotalSupply, refetchHasMinted, refetchCanMint]);

  const handleMint = () => {
    if (!isConnected || !canMint) return;

    writeContractSponsored({
      address: PRESENTATION_NFT_ADDRESS,
      abi: PRESENTATION_NFT_ABI,
      functionName: "mint",
      args: [BigInt(tokenId)],
      paymaster: PAYMASTER_ADDRESS,
      paymasterInput: getGeneralPaymasterInput({ innerInput: "0x" }),
    });
  };

  if (!presentation) {
    return (
      <div className="w-full animate-pulse">
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16 xl:gap-24 gap-8">
          <div className="w-full lg:w-1/2 xl:w-[55%] aspect-square max-w-[500px] lg:max-w-none rounded-2xl bg-white/5 border border-white/10 mx-auto lg:mx-0" />
          <div className="w-full lg:w-1/2 xl:w-[45%] flex flex-col items-center lg:items-start space-y-8 lg:space-y-10">
            <div className="space-y-4 w-full text-center lg:text-left">
              <div className="h-12 lg:h-16 xl:h-20 bg-white/5 rounded w-3/4 mx-auto lg:mx-0" />
              <div className="h-4 bg-white/5 rounded w-1/2 mx-auto lg:mx-0 hidden lg:block" />
              <div className="h-4 bg-white/5 rounded w-1/3 mx-auto lg:mx-0" />
            </div>
            <div className="h-14 lg:h-16 bg-white/5 rounded-xl w-full max-w-md lg:max-w-none lg:w-48" />
          </div>
        </div>
      </div>
    );
  }

  const pres = presentation as Presentation;
  const now = BigInt(Math.floor(Date.now() / 1000));
  const isLive = pres.isActive && now >= pres.startTime && now <= pres.endTime;
  const hasEnded = now > pres.endTime;
  const notStarted = now < pres.startTime;

  const getStatusBadge = () => {
    if (isLive) return <Badge className="bg-primary text-primary-foreground hover:bg-primary px-4 py-1.5 text-sm font-bold tracking-wider uppercase border-0 shadow-[0_0_20px_-5px_var(--color-primary)] animate-pulse">Live Now</Badge>;
    if (hasEnded) return <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 px-4 py-1.5 text-sm font-medium tracking-wider uppercase border-0">Ended</Badge>;
    if (notStarted) return <Badge variant="outline" className="bg-black/40 backdrop-blur-md border-white/10 text-white px-4 py-1.5 text-sm font-medium tracking-wider uppercase"><Clock className="w-3 h-3 mr-2" /> Upcoming</Badge>;
    return null;
  };

  return (
    <div className="group relative w-full animate-in fade-in zoom-in-95 duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16 xl:gap-24 gap-8">
        
        <div className="relative w-full lg:w-1/2 xl:w-[55%] aspect-square max-w-[500px] lg:max-w-none overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-[0_0_100px_-30px_rgba(0,0,0,0.8)] mx-auto lg:mx-0">
          {pres.imageUri && (
            <img
              src={pres.imageUri}
              alt={pres.name}
              className="h-full w-full object-cover transition-all duration-1000 group-hover:scale-105"
            />
          )}
          
          <div className="absolute top-6 right-6 z-20">
            {getStatusBadge()}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
        </div>

        <div className="w-full lg:w-1/2 xl:w-[45%] flex flex-col items-center lg:items-start space-y-8 lg:space-y-10">
          
          <div className="space-y-4 text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tighter text-white uppercase leading-[0.9] text-glow">
              {pres.name}
            </h1>
            
            {pres.description && (
              <p className="text-white/50 text-sm lg:text-base max-w-md hidden lg:block">
                {pres.description}
              </p>
            )}
            
            <div className="flex items-center justify-center lg:justify-start gap-4 text-xs font-bold text-white/30 uppercase tracking-[0.2em] font-mono pt-2">
              <span>Minted: <span className="text-white/80">{totalSupply?.toString() ?? "0"}</span></span>
              {pres.maxSupply > 0n && (
                <>
                  <span className="text-white/10">/</span>
                  <span>Max: <span className="text-white/80">{pres.maxSupply.toString()}</span></span>
                </>
              )}
            </div>
          </div>

          <div className="w-full max-w-md lg:max-w-none">
            {hasMinted ? (
              <a
                href={`https://portal.abs.xyz/profile/${address}?t=nfts`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-4 lg:p-6 rounded-xl bg-primary/10 border border-primary/20 text-primary flex flex-col items-center lg:items-start justify-center gap-3 transition-all duration-300 hover:bg-primary/15 hover:border-primary/30 hover:scale-[1.01] group"
              >
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Collected</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-primary/70 group-hover:text-primary transition-colors">
                  <span>View your NFT on Abstract Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </a>
            ) : (
              <Button
                onClick={() => {
                  if (!isConnected) {
                    login();
                  } else {
                    handleMint();
                  }
                }}
                disabled={isPending || (isConnected && !canMint)}
                className={cn(
                  "group relative w-full lg:w-auto h-14 lg:h-16 px-8 lg:px-12 rounded-xl overflow-hidden select-none",
                  "text-base lg:text-lg font-bold tracking-[0.08em] transition-[transform,box-shadow,background-color] duration-300",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  "motion-safe:hover:scale-[1.01] motion-safe:active:scale-[0.99]",
                  !isConnected && "bg-black/50 text-white ring-1 ring-white/10 hover:ring-primary/35 hover:bg-black/60",
                  isConnected && canMint && !isPending && "bg-primary text-primary-foreground shadow-[0_14px_50px_-28px_oklch(0.85_0.2_155_/_0.9)] hover:bg-primary/90",
                  isPending && "bg-primary/70 text-primary-foreground cursor-wait",
                  isConnected && !canMint && !isPending && "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                )}
                variant="ghost"
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  {isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Minting...</span>
                    </>
                  ) : !isConnected ? (
                    <>
                      <Wallet className="w-5 h-5 text-zinc-400 group-hover:text-primary transition-colors duration-300" />
                      <span className="group-hover:text-white transition-colors">Connect Wallet</span>
                    </>
                  ) : !canMint ? (
                    <span>Unavailable</span>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 fill-current" />
                      <span>Mint Now</span>
                      <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out" />
                    </>
                  )}
                </div>
              </Button>
            )}

            {isSuccess && txHash && (
              <div className="mt-6 text-center lg:text-left animate-in fade-in slide-in-from-bottom-4">
                <a
                  href={`https://abscan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-white/40 hover:text-primary transition-colors uppercase tracking-widest font-mono border-b border-transparent hover:border-primary/50 pb-0.5"
                >
                  View Transaction →
                </a>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-center lg:text-left">
                <p className="text-xs text-red-400 font-mono">
                  {error.message}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
