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
          <div className="w-full lg:w-1/2 xl:w-[55%] aspect-square max-w-[500px] lg:max-w-none bg-white/5 border border-white/10 mx-auto lg:mx-0" />
          <div className="w-full lg:w-1/2 xl:w-[45%] flex flex-col items-center lg:items-start space-y-8 lg:space-y-10">
            <div className="space-y-4 w-full text-center lg:text-left">
              <div className="h-12 lg:h-16 xl:h-20 bg-white/5 w-3/4 mx-auto lg:mx-0" />
              <div className="h-4 bg-white/5 w-1/2 mx-auto lg:mx-0 hidden lg:block" />
              <div className="h-4 bg-white/5 w-1/3 mx-auto lg:mx-0" />
            </div>
            <div className="h-14 lg:h-16 bg-white/5 w-full max-w-md lg:max-w-none lg:w-48" />
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
    if (isLive) return <div className="flex items-center gap-2 px-3 py-1 bg-primary text-black text-xs font-bold uppercase tracking-widest animate-pulse"><div className="w-2 h-2 bg-black" />Live</div>;
    if (notStarted) return <div className="px-3 py-1 border border-white/20 text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2"><Clock className="w-3 h-3" /> Soon</div>;
    return null;
  };

  return (
    <div className="group relative w-full animate-reveal max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16 xl:gap-24 gap-12">
        
        <div className="relative w-full lg:w-1/2 xl:w-[55%] aspect-square max-w-[600px] lg:max-w-none mx-auto lg:mx-0">
          <div className="absolute inset-0 border border-white/20 translate-x-4 translate-y-4" />
          <div className="relative h-full w-full bg-zinc-900 border border-white/10 overflow-hidden">
            {pres.imageUri && (
              <img
                src={pres.imageUri}
                alt={pres.name}
                className="h-full w-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
              />
            )}
            
            <div className="absolute top-4 left-4 z-20">
              {getStatusBadge()}
            </div>
            
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </div>

        <div className="w-full lg:w-1/2 xl:w-[45%] flex flex-col space-y-8 lg:space-y-12">
          
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black text-white uppercase leading-[0.95] tracking-tight">
              {pres.name}
            </h1>
            
            {pres.description && (
              <div className="flex items-start gap-4">
                <div className="w-12 h-[1px] bg-primary mt-3 shrink-0" />
                <p className="text-white/60 text-sm md:text-base font-body max-w-md leading-relaxed">
                  {pres.description}
                </p>
              </div>
            )}
            
            <div className="flex items-center gap-6 text-xs font-bold text-white/40 uppercase tracking-[0.2em] font-mono border-t border-white/10 pt-6">
              <div className="flex flex-col gap-1">
                <span className="text-[10px]">Minted</span>
                <span className="text-white text-base">{totalSupply?.toString() ?? "0"}</span>
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              {pres.maxSupply > 0n && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px]">Supply</span>
                  <span className="text-white text-base">{pres.maxSupply.toString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="w-full">
            {hasEnded && isConnected && !hasMinted ? (
               <div className="w-full p-6 border border-white/10 bg-white/5 text-center">
                 <span className="text-white/40 uppercase tracking-widest font-mono text-sm">Edition Closed</span>
               </div>
            ) : hasMinted ? (
              <a
                href={`https://portal.abs.xyz/profile/${address}?t=nfts`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-6 border border-primary bg-primary/5 text-primary flex items-center justify-between group/collected hover:bg-primary hover:text-black transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="p-1 border border-current">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-lg font-bold uppercase tracking-widest font-display">Collected</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider opacity-60 group-hover/collected:opacity-100">
                  <span>View</span>
                  <ExternalLink className="w-3 h-3" />
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
                  "relative w-full h-20 rounded-none border transition-all duration-300",
                  "text-lg font-bold uppercase tracking-widest font-display",
                  !isConnected && "bg-transparent border-white/20 text-white hover:bg-white hover:text-black",
                  isConnected && canMint && !isPending && "bg-primary text-black border-primary hover:bg-transparent hover:text-primary hover:shadow-[0_0_30px_-10px_var(--color-primary)]",
                  isPending && "bg-zinc-800 border-zinc-700 text-white/50 cursor-wait",
                  isConnected && !canMint && !isPending && "bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed"
                )}
                variant="ghost"
              >
                <div className="relative z-10 flex items-center justify-center gap-4">
                  {isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : !isConnected ? (
                    <>
                      <span>Connect Wallet</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  ) : !canMint ? (
                    <span>Unavailable</span>
                  ) : (
                    <>
                      <span>Mint Edition</span>
                      <Zap className="w-5 h-5 fill-current" />
                    </>
                  )}
                </div>
              </Button>
            )}

            {isSuccess && txHash && (
              <div className="mt-4 flex justify-between items-center border-t border-white/10 pt-4 animate-in fade-in">
                <span className="text-xs text-primary font-mono uppercase">Transaction Confirmed</span>
                <a
                  href={`https://abscan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-white/40 hover:text-white transition-colors uppercase tracking-widest font-mono flex items-center gap-2"
                >
                  Abscan <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 border border-red-500/50 bg-red-500/5">
                <p className="text-xs text-red-500 font-mono uppercase tracking-wide">
                  Error: {error.message}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
