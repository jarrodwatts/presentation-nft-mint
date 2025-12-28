"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { AbstractWalletProvider } from "@abstract-foundation/agw-react";
import { config, CHAIN } from "./wagmi";
import { useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

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
        <AbstractWalletProvider chain={CHAIN}>
          {children}
          <Toaster richColors position="top-center" />
        </AbstractWalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
