export interface Presentation {
  name: string;
  description: string;
  imageUri: string;
  startTime: bigint;
  endTime: bigint;
  isActive: boolean;
  maxSupply: bigint;
}

export function isPresentation(data: unknown): data is Presentation {
  if (typeof data !== "object" || data === null) return false;

  const p = data as Record<string, unknown>;

  return (
    typeof p.name === "string" &&
    typeof p.description === "string" &&
    typeof p.imageUri === "string" &&
    typeof p.isActive === "boolean" &&
    typeof p.startTime === "bigint" &&
    typeof p.endTime === "bigint" &&
    typeof p.maxSupply === "bigint"
  );
}

export function validateAddress(
  addr: string | undefined,
  name: string
): `0x${string}` {
  if (!addr) {
    throw new Error(`Missing environment variable for ${name}`);
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
    throw new Error(`Invalid ${name} address: ${addr}`);
  }

  return addr as `0x${string}`;
}

export const ERROR_PATTERNS: [RegExp, string][] = [
  [/user rejected|user denied/i, "Transaction cancelled"],
  [/insufficient funds/i, "Insufficient funds for gas"],
  [/already minted|AlreadyMinted/i, "You've already collected this NFT"],
  [/minting not active|MintingNotActive/i, "Minting is currently paused"],
  [/minting ended|MintingEnded/i, "This mint has ended"],
  [/minting not started|MintingNotStarted/i, "Minting hasn't started yet"],
  [/max supply|MaxSupplyReached/i, "Sold out!"],
  [/invalid presentation|InvalidPresentation/i, "This presentation doesn't exist"],
  [/ownable|not the owner|OwnableUnauthorizedAccount/i, "Only the contract owner can do this"],
  [/network|chain/i, "Please switch to the correct network"],
  [/timeout|timed out/i, "Request timed out. Please try again"],
  [/reverted|revert/i, "Transaction failed"],
];

export function formatError(error: Error | unknown): string {
  const msg = error instanceof Error ? error.message : String(error);

  for (const [pattern, friendlyMessage] of ERROR_PATTERNS) {
    if (pattern.test(msg)) return friendlyMessage;
  }

  const firstSentence = msg.split(/[.\n]/)[0];
  if (firstSentence.length > 80) {
    return "Transaction failed. Please try again.";
  }

  return firstSentence || "An unexpected error occurred";
}
