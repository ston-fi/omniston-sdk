import {
  encodeAbiParameters,
  hexToBytes,
  parseAbiParameters,
  type Address as ViemAddress,
} from "viem";

import type { AssetId } from "@ston-fi/omniston-sdk";

export interface Eip2612PermitDomain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: ViemAddress;
}

export interface Permit2Domain {
  name: string;
  chainId: number;
  verifyingContract: ViemAddress;
}

export interface Eip2612PermitMessage {
  owner: ViemAddress;
  spender: ViemAddress;
  value: bigint;
  nonce: bigint;
  deadline: bigint;
}

export interface Permit2PermitDetails {
  token: ViemAddress;
  amount: bigint;
  expiration: number;
  nonce: number;
}

export interface Permit2PermitSingleMessage {
  details: Permit2PermitDetails;
  spender: ViemAddress;
  sigDeadline: bigint;
}

export type EvmPermitConfig =
  | {
      kind: "eip2612";
      domain: Eip2612PermitDomain;
    }
  | {
      kind: "permit2";
      domain: Permit2Domain;
    };

export const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3";

const EIP2612_PERMIT_TYPES = {
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

const PERMIT2_PERMIT_TYPES = {
  PermitDetails: [
    { name: "token", type: "address" },
    { name: "amount", type: "uint160" },
    { name: "expiration", type: "uint48" },
    { name: "nonce", type: "uint48" },
  ],
  PermitSingle: [
    { name: "details", type: "PermitDetails" },
    { name: "spender", type: "address" },
    { name: "sigDeadline", type: "uint256" },
  ],
} as const;

const EIP2612_PERMIT_PARAMETERS = parseAbiParameters(
  "address owner, address spender, uint256 value, uint256 nonce, uint256 deadline",
);

const PERMIT2_PERMIT_PARAMETERS = parseAbiParameters(
  "((address token, uint160 amount, uint48 expiration, uint48 nonce) details, address spender, uint256 sigDeadline) permitSingle",
);

// In production, permit typed data should be collected with the on-chain
// requests and then cached by asset id. This hardcoded map is for
// demonstration purposes only.
const PERMIT_CONFIG_MAP: Record<ViemAddress, EvmPermitConfig> = {
  "0xC011a7E12a19f7B1f670d46F03B03f3342E82DFB": {
    kind: "eip2612",
    domain: {
      name: "Polymarket USD",
      version: "1",
      chainId: 137,
      verifyingContract: "0xC011a7E12a19f7B1f670d46F03B03f3342E82DFB",
    },
  },
  // "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913": {
  //   kind: "permit2",
  //   domain: {
  //     name: "Permit2",
  //     chainId: 8453,
  //     verifyingContract: PERMIT2_ADDRESS,
  //   },
  // },
};

export function resolveEvmPermitConfig(assetId: AssetId) {
  return PERMIT_CONFIG_MAP[assetId.chain.value.kind.value as ViemAddress];
}

export function buildEip2612PermitTypedData({
  domain,
  message,
}: {
  domain: Eip2612PermitDomain;
  message: Eip2612PermitMessage;
}) {
  return {
    domain,
    types: EIP2612_PERMIT_TYPES,
    primaryType: "Permit" as const,
    message,
  };
}

export function buildPermit2PermitTypedData({
  domain,
  message,
}: {
  domain: Permit2Domain;
  message: Permit2PermitSingleMessage;
}) {
  return {
    domain,
    types: PERMIT2_PERMIT_TYPES,
    primaryType: "PermitSingle" as const,
    message,
  };
}

export function encodeEip2612PermitData(message: Eip2612PermitMessage) {
  return hexToBytes(
    encodeAbiParameters(EIP2612_PERMIT_PARAMETERS, [
      message.owner,
      message.spender,
      message.value,
      message.nonce,
      message.deadline,
    ]),
  );
}

export function encodePermit2PermitData(message: Permit2PermitSingleMessage) {
  return hexToBytes(encodeAbiParameters(PERMIT2_PERMIT_PARAMETERS, [message]));
}
