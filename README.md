# Abstract NFT Onboarding

A time-limited NFT drop platform built on Abstract (zkSync L2), designed for seamless event attendance and onboarding experiences.

## Features

*   Gasless Minting: Paymaster sponsors gas fees for all mint transactions, providing a frictionless user experience.
*   Time-Windowed Drops: Organizers can create NFT presentations with specific start and end times.
*   One Per Wallet: Ensures unique attendance by limiting each address to one mint per presentation.
*   Supply Limits: Optional maximum supply control for each NFT drop.
*   Admin Panel: Dedicated interface for owners to manage presentations and toggle minting status.
*   Abstract Global Wallet: Integrated with AGW for a native account abstraction experience.

## Tech Stack

### Frontend
*   Next.js 16 (App Router)
*   React 19
*   Wagmi v3 & viem
*   @abstract-foundation/agw-react (Abstract Global Wallet SDK)
*   TailwindCSS v4
*   shadcn/ui components

### Smart Contracts
*   Solidity 0.8.24
*   Foundry
*   ERC1155 (PresentationNFT) with metadata extensions
*   zkSync Paymaster (PresentationPaymaster) for gas sponsorship
*   OpenZeppelin Contracts

## Prerequisites

*   Node.js (v20 or later)
*   pnpm
*   Foundry (forge, cast)
*   An Abstract wallet with testnet/mainnet ETH (for deployment)

## Getting Started

### 1. Smart Contracts

Navigate to the contracts directory and install dependencies:

```bash
cd contracts
forge install
```

Build the contracts:

```bash
forge build
```

Run tests:

```bash
forge test
```

### 2. Frontend

From the project root, install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Environment Variables

Create a `.env.local` file in the root directory based on `.env.example`:

```env
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_NFT_CONTRACT=0x...
NEXT_PUBLIC_PAYMASTER_CONTRACT=0x...
ABSCAN_API_KEY=your_abscan_api_key
```

*   `NEXT_PUBLIC_NETWORK`: Either `testnet` or `mainnet`.
*   `NEXT_PUBLIC_NFT_CONTRACT`: Deployed `PresentationNFT` contract address.
*   `NEXT_PUBLIC_PAYMASTER_CONTRACT`: Deployed `PresentationPaymaster` contract address.
*   `ABSCAN_API_KEY`: API key for verifying contracts on Abstract.

## Deployment

### Smart Contracts

Deploy the NFT and Paymaster contracts to Abstract Testnet:

```bash
cd contracts
forge script script/Deploy.s.sol --rpc-url abstractTestnet --broadcast --verify
```

Note: Ensure your private key is configured in your environment or passed to the script.

### Frontend

The frontend is optimized for deployment on Vercel:

1.  Push your code to a GitHub repository.
2.  Import the project to Vercel.
3.  Configure the environment variables in the Vercel dashboard.
4.  Deploy.

## Project Structure

*   `/contracts/`: Foundry project containing Solidity smart contracts.
    *   `src/PresentationNFT.sol`: Main ERC1155 contract for presentations.
    *   `src/PresentationPaymaster.sol`: Gas sponsorship logic for minting.
    *   `script/Deploy.s.sol`: Deployment and initialization scripts.
*   `/src/`: Next.js frontend application.
    *   `app/admin/`: Admin dashboard for managing NFT drops.
    *   `components/`: Reusable UI components and minting cards.
    *   `lib/`: Contract configurations, providers, and utility functions.
*   `.env.example`: Template for required environment variables.

## License

This project is licensed under the MIT License.
