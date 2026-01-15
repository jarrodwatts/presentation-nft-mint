import { http, createConfig } from "wagmi";
import { abstract, abstractTestnet } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const config = createConfig({
  chains: [abstract, abstractTestnet],
  connectors: [injected()],
  transports: {
    [abstract.id]: http(),
    [abstractTestnet.id]: http(),
  },
  ssr: true,
});

export const CHAIN = process.env.NEXT_PUBLIC_NETWORK === "mainnet" ? abstract : abstractTestnet;
