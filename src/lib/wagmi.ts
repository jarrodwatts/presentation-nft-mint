import { http, createConfig } from "wagmi";
import { abstract, abstractTestnet } from "wagmi/chains";

export const config = createConfig({
  chains: [abstract, abstractTestnet],
  transports: {
    [abstract.id]: http(),
    [abstractTestnet.id]: http(),
  },
  ssr: true,
});

export const CHAIN = process.env.NEXT_PUBLIC_NETWORK === "mainnet" ? abstract : abstractTestnet;
