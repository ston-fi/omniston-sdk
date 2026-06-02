import { readContract, type Config as WagmiConfig } from "@wagmi/core";
import { parseAbi, type Address as ViemAddress } from "viem";

const ERC20_NONCES_ABI = parseAbi(["function nonces(address owner) view returns (uint256)"]);

const PERMIT2_ALLOWANCE_ABI = parseAbi([
  "function allowance(address user, address token, address spender) view returns (uint160 amount, uint48 expiration, uint48 nonce)",
]);

export async function getContractNonce(
  wagmiConfig: WagmiConfig,
  args: {
    ownerAddress: ViemAddress;
    contractAddress: ViemAddress;
  },
): Promise<bigint> {
  return readContract(wagmiConfig, {
    address: args.contractAddress,
    abi: ERC20_NONCES_ABI,
    functionName: "nonces",
    args: [args.ownerAddress],
  });
}

export async function getPermit2Nonce(
  wagmiConfig: WagmiConfig,
  args: {
    ownerAddress: ViemAddress;
    permit2Address: ViemAddress;
    tokenAddress: ViemAddress;
    spenderAddress: ViemAddress;
  },
): Promise<bigint> {
  const [, , nonce] = await readContract(wagmiConfig, {
    address: args.permit2Address,
    abi: PERMIT2_ALLOWANCE_ABI,
    functionName: "allowance",
    args: [args.ownerAddress, args.tokenAddress, args.spenderAddress],
  });

  return BigInt(nonce);
}
