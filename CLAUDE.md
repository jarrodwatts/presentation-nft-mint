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

# Deploy (ADMIN_ADDRESS receives admin roles)
ADMIN_ADDRESS=<admin> forge script script/Deploy.s.sol --tc DeployScript --zksync --rpc-url https://api.testnet.abs.xyz --broadcast --account <keystore>
ADMIN_ADDRESS=<admin> forge script script/Deploy.s.sol --tc DeployScript --zksync --rpc-url https://api.mainnet.abs.xyz --broadcast --account <keystore>

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
- `contracts/src/PresentationNFT.sol` - ERC1155 with per-presentation time windows, one-mint-per-wallet, AccessControl (multi-admin)
- `contracts/src/PresentationPaymaster.sol` - Gas sponsorship for mints, AccessControl (multi-admin)

Both contracts use OpenZeppelin AccessControl. The deployer gets `DEFAULT_ADMIN_ROLE` (can manage admins) and `ADMIN_ROLE` (can call admin functions). Additional admins can be added via `grantRole(ADMIN_ROLE, address)`.

### Deployed Contracts

**Mainnet & Testnet** (same addresses via deterministic deployment)
| Contract | Address | Abscan |
|----------|---------|--------|
| PresentationNFT | `0x78Adb12c6b37AD7305204E342bD22cEFBEAdC39a` | [Mainnet](https://abscan.org/address/0x78Adb12c6b37AD7305204E342bD22cEFBEAdC39a) / [Testnet](https://sepolia.abscan.org/address/0x78Adb12c6b37AD7305204E342bD22cEFBEAdC39a) |
| PresentationPaymaster | `0x9F3752E89803d8cf79ab07CbE0668E5FbA2cFCbB` | [Mainnet](https://abscan.org/address/0x9F3752E89803d8cf79ab07CbE0668E5FbA2cFCbB) / [Testnet](https://sepolia.abscan.org/address/0x9F3752E89803d8cf79ab07CbE0668E5FbA2cFCbB) |

Default Admin: `0x81956B7FB8858d9081aE5E85FA50E7032487eeCA`

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
