# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NFT minting dApp for Abstract chain presentations. Users connect via Abstract Global Wallet (AGW) and mint time-windowed ERC1155 NFTs with gas sponsored by a paymaster.

## Commands

### Frontend (Next.js)
```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # ESLint (eslint-config-next)
```

### Contracts (Foundry + ZKsync)
Abstract is ZKsync-based. **Always use `--zksync` flag**.

```bash
cd contracts

# Build and test
forge build --zksync
forge test --zksync

# Deploy
forge script script/Deploy.s.sol --zksync --rpc-url https://api.testnet.abs.xyz --broadcast
forge script script/Deploy.s.sol --zksync --rpc-url https://api.mainnet.abs.xyz --broadcast

# Verify (uses Etherscan V2 API)
ETHERSCAN_API_KEY=<key> forge verify-contract <ADDRESS> <CONTRACT> --zksync --verifier-url "https://api.etherscan.io/v2/api?chainid=2741" --chain 2741
```

## Architecture

### Frontend Stack
- **Next.js 16** with App Router (`src/app/`)
- **wagmi v3 + viem** for blockchain interactions
- **@abstract-foundation/agw-react** for Abstract Global Wallet
- **TanStack Query** for async state
- **Tailwind CSS v4** + Radix UI primitives

### Provider Hierarchy
`WagmiProvider` → `QueryClientProvider` → `AbstractWalletProvider` (see `src/lib/providers.tsx`)

### Key Modules
- `src/lib/wagmi.ts` - Chain config. Uses `NEXT_PUBLIC_NETWORK` env to toggle mainnet/testnet
- `src/lib/contracts.ts` - Contract addresses and ABI (validates env vars on import)
- `src/lib/types.ts` - Presentation type, type guards, error formatting
- `src/components/mint-card.tsx` - Minting logic with sponsored transactions via `useWriteContractSponsored`

### Smart Contracts
- `contracts/src/PresentationNFT.sol` - ERC1155 with per-presentation time windows and one-mint-per-wallet
- `contracts/src/PresentationPaymaster.sol` - Gas sponsorship for mints

### Deployed Contracts (Mainnet)
| Contract | Address | Abscan |
|----------|---------|--------|
| PresentationNFT | `0xEB72BAF34dfF2E3f92601D1da9AA5C611e56cE75` | [View](https://abscan.org/address/0xEB72BAF34dfF2E3f92601D1da9AA5C611e56cE75) |
| PresentationPaymaster | `0x8b4606476FdE49fe76249fE86dad6e94F1F99725` | [View](https://abscan.org/address/0x8b4606476FdE49fe76249fE86dad6e94F1F99725) |

Owner: `0x81956B7FB8858d9081aE5E85FA50E7032487eeCA`

### Environment Variables
```
NEXT_PUBLIC_NFT_CONTRACT      # PresentationNFT address
NEXT_PUBLIC_PAYMASTER_CONTRACT # Paymaster address
NEXT_PUBLIC_NETWORK           # "mainnet" or "testnet"
```

## Patterns

### Sponsored Transactions
Uses viem's `getGeneralPaymasterInput` with AGW's `useWriteContractSponsored`:
```typescript
writeContractSponsored({
  address: PRESENTATION_NFT_ADDRESS,
  abi: PRESENTATION_NFT_ABI,
  functionName: "mint",
  args: [BigInt(tokenId)],
  paymaster: PAYMASTER_ADDRESS,
  paymasterInput: getGeneralPaymasterInput({ innerInput: "0x" }),
});
```

### Query Invalidation
After tx confirmation, invalidate all read queries: `queryClient.invalidateQueries({ queryKey: ["readContract"] })`

### Path Aliases
`@/*` maps to `./src/*`
