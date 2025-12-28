# Abstract NFT Onboarding Contracts

Smart contracts for the Abstract NFT Onboarding platform, enabling time-limited NFT drops with gasless minting via Account Abstraction.

## Contracts Overview

### PresentationNFT.sol
An ERC1155 contract that manages multiple NFT "presentations" or events. Each token ID represents a unique presentation with its own configuration.
- **Time-Windowed**: Mints are only available during a specified start and end time.
- **Fair Minting**: Restricted to one mint per wallet per presentation.
- **Metadata**: Supports both external base URI and on-chain JSON metadata fallback.
- **Supply Control**: Optional maximum supply limits per presentation.

### PresentationPaymaster.sol
A zkSync-native Paymaster contract that sponsors gas fees for users.
- **Targeted Sponsorship**: Only sponsors `mint(uint256)` transactions on the configured `PresentationNFT` contract.
- **Validation**: Uses bootloader-level validation to ensure transactions meet sponsorship criteria.
- **Configurable**: Admin can adjust maximum gas price and toggle sponsorship status.

## Key Functions (PresentationNFT)

| Function | Access | Description |
|----------|--------|-------------|
| `mint(uint256 tokenId)` | Public | Mints one NFT for the specified presentation if valid. |
| `createPresentation(...)` | Owner | Creates a new presentation with time and supply limits. |
| `setMintingActive(...)` | Owner | Manually enables or disables minting for a presentation. |
| `updateTimeWindow(...)` | Owner | Adjusts the start and end timestamps for a presentation. |
| `setBaseUri(string)` | Owner | Updates the base URI for metadata. |
| `canMint(uint256, address)` | View | Checks if a user is currently eligible to mint. |

## Deployment

Deployment scripts are located in `script/Deploy.s.sol`. Ensure you have your environment variables configured.

### Prerequisites
Set the following environment variables:
- `OWNER_ADDRESS`: The address that will own the deployed contracts.
- `NFT_BASE_URI`: (Optional) Base URI for NFT metadata.

### Commands

**Deploy both NFT and Paymaster:**
```bash
forge script script/Deploy.s.sol:DeployScript --rpc-url abstractTestnet --broadcast --verify
```

**Deploy NFT only:**
```bash
forge script script/Deploy.s.sol:DeployNFTOnly --rpc-url abstractTestnet --broadcast --verify
```

**Deploy Paymaster only:**
(Requires `NFT_CONTRACT` environment variable)
```bash
forge script script/Deploy.s.sol:DeployPaymasterOnly --rpc-url abstractTestnet --broadcast --verify
```

*Replace `abstractTestnet` with `abstractMainnet` for production deployment.*

## Testing

Run the test suite using Forge:
```bash
forge test
```

For verbose output:
```bash
forge test -vvv
```

## Security Considerations
- **Paymaster Funding**: The `PresentationPaymaster` must be funded with ETH to sponsor transactions. Monitor balances to prevent service interruption.
- **Admin Keys**: The `Owner` address has significant control over presentations and paymaster settings. Use a multisig for production environments.
- **Gas Price Spikes**: The paymaster has a `maxGasPrice` limit to protect against unexpected gas costs during network congestion.
