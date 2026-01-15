"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { AbstractWalletProvider } from "@abstract-foundation/agw-react";
import { config, CHAIN } from "./wagmi";
import { useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { NetworkGuard } from "@/components/network-guard";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <NetworkGuard />
        {children}
        <Toaster richColors position="top-center" />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export function AGWProvider({ children }: { children: ReactNode }) {
  return (
    <AbstractWalletProvider chain={CHAIN}>
      {children}
    </AbstractWalletProvider>
  );
}
