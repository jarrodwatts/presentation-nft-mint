"use client";

import { useReadContract } from "wagmi";
import { PRESENTATION_NFT_ABI, PRESENTATION_NFT_ADDRESS } from "@/lib/contracts";
import { MintCard } from "./mint-card";
import { ErrorBoundary } from "./error-boundary";

export function PresentationList() {
  const { data: activePresentations, isLoading, isError, refetch } = useReadContract({
    address: PRESENTATION_NFT_ADDRESS,
    abi: PRESENTATION_NFT_ABI,
    functionName: "getActivePresentations",
  });

  if (isLoading) {
    return (
      <div className="w-full max-w-xl lg:max-w-6xl mx-auto px-4 animate-pulse">
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

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 animate-in fade-in duration-500">
        <h2 className="text-2xl md:text-3xl font-display font-black tracking-tighter text-red-400/80 uppercase">Connection Error</h2>
        <div className="w-12 h-[1px] bg-red-500/20" />
        <p className="text-white/40 font-mono text-xs uppercase tracking-[0.2em]">
          Unable to fetch presentations
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-6 py-2 border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors font-mono text-xs uppercase tracking-wider"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!activePresentations || (activePresentations as bigint[]).length === 0) {
    return (
      <div className="w-full max-w-xl lg:max-w-6xl mx-auto px-4 animate-reveal">
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16 xl:gap-24 gap-12">
          <div className="relative w-full lg:w-1/2 xl:w-[55%] aspect-square max-w-[600px] lg:max-w-none mx-auto lg:mx-0">
            <div className="absolute inset-0 border border-white/10 translate-x-4 translate-y-4" />
            <div className="relative h-full w-full bg-zinc-900 border border-white/10 overflow-hidden">
              <img
                src="/placeholder.png"
                alt="Coming Soon"
                className="h-full w-full object-cover grayscale opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </div>
          </div>
          <div className="w-full lg:w-1/2 xl:w-[45%] flex flex-col space-y-8 lg:space-y-12">
            <div className="space-y-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black text-white/20 uppercase leading-[0.95] tracking-tight">
                Coming Soon
              </h1>
              <div className="flex items-start gap-4">
                <div className="w-12 h-[1px] bg-white/10 mt-3 shrink-0" />
                <p className="text-white/40 text-sm md:text-base font-body max-w-md leading-relaxed">
                  The next edition is being prepared. Check back soon.
                </p>
              </div>
            </div>
            <div className="w-full p-6 border border-white/10 bg-white/5 text-center">
              <span className="text-white/30 uppercase tracking-widest font-mono text-sm">No Active Editions</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const presentations = activePresentations as bigint[];
  const latestTokenId = presentations[presentations.length - 1];

  return (
    <div className="w-full max-w-xl lg:max-w-6xl mx-auto px-4">
      <ErrorBoundary>
        <MintCard tokenId={Number(latestTokenId)} />
      </ErrorBoundary>
    </div>
  );
}
