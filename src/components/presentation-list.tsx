"use client";

import { useReadContract } from "wagmi";
import { PRESENTATION_NFT_ABI, PRESENTATION_NFT_ADDRESS } from "@/lib/contracts";
import { MintCard } from "./mint-card";

export function PresentationList() {
  const { data: activePresentations, isLoading } = useReadContract({
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

  if (!activePresentations || (activePresentations as bigint[]).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
        <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter text-white/20 uppercase">No Active Drops</h2>
        <div className="w-12 h-[1px] bg-white/10" />
        <p className="text-white/40 font-mono text-xs uppercase tracking-[0.2em]">
          Check back soon
        </p>
      </div>
    );
  }

  const presentations = activePresentations as bigint[];
  const latestTokenId = presentations[presentations.length - 1];

  return (
    <div className="w-full max-w-xl lg:max-w-6xl mx-auto px-4">
      <MintCard tokenId={Number(latestTokenId)} />
    </div>
  );
}
