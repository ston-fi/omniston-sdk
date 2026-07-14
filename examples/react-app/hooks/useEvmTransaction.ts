import {
  encodeAbiParameters,
  erc20Abi,
  hexToBytes,
  maxUint256,
  parseSignature,
  serializeCompactSignature,
  signatureToCompactSignature,
  type Address as EvmAddress,
} from "viem";
import { useConfig, useSignTypedData, useSwitchChain, useWriteContract } from "wagmi";
import { readContract, waitForTransactionReceipt } from "@wagmi/core";
import { useMemo } from "react";
import { isHtlcOrderQuote, BuildEvmOrderPayloadRequest } from "@ston-fi/omniston-sdk-react";

import { useOmniston } from "~/hooks/useOmniston";
import { useRfq } from "~/hooks/useRfq";
import { useQuoteWallets } from "~/hooks/useTraderQuoteWallets";
import { generateHtlcHashlock, generateHtlcSecret } from "~/lib/omniston/htlc";
import { mapChainToChainId } from "~/lib/evm/chain";
import {
  PERMIT2_ADDRESS,
  buildEip2612PermitTypedData,
  buildPermit2PermitTypedData,
  encodeEip2612PermitData,
  encodePermit2PermitData,
  resolveEvmPermitConfig,
} from "~/lib/evm/permits";
import { useSwapSettings } from "~/providers/swap-settings";
import { ChainFamily, isChainInFamily } from "~/models/chain-family";
import { getContractNonce, getPermit2Nonce } from "~/lib/evm/on-chain";

type TypedData = Parameters<ReturnType<typeof useSignTypedData>["mutateAsync"]>[0];

type SignTypedDataResult = Awaited<ReturnType<ReturnType<typeof useSignTypedData>["mutateAsync"]>>;

export function useEvmTransaction() {
  const omniston = useOmniston();
  const wagmiConfig = useConfig();

  const { mutateAsync: signTypedData } = useSignTypedData();
  const { mutateAsync: switchChainAsync } = useSwitchChain();
  const { mutateAsync: writeContractAsync } = useWriteContract();

  const { data: quoteEvent } = useRfq();
  const quote = quoteEvent?.$case === "quoteUpdated" ? quoteEvent.value : undefined;

  const { htlcMaxExecutions } = useSwapSettings();

  const { inputWalletAddress, outputWalletAddress } = useQuoteWallets(quote);

  const buildAndSendTransaction = useMemo(() => {
    if (!quote) return;
    if (!inputWalletAddress || !outputWalletAddress) return;

    return async () => {
      if (!isHtlcOrderQuote(quote)) {
        throw new Error(`Expected HTLC order quote, got "${quote.settlementData.$case}"`);
      }

      const inputChain = quote.inputAsset.chain.$case;

      if (!isChainInFamily(inputChain, ChainFamily.EVM)) {
        throw new Error(`Expected EVM chain for order quote, got "${inputChain}"`);
      }

      const inputChainId = mapChainToChainId(inputChain);

      await switchChainAsync({ chainId: inputChainId });

      // --- permit

      let permitData:
        | Required<
            Pick<
              BuildEvmOrderPayloadRequest,
              "encodedPermitData" | "permitSignature" | "usePermit2"
            >
          >
        | undefined;

      // TODO: move to the setting for granular control over when to use Permit vs allowance?
      let shouldUsePermit = true;
      const permitConfig = resolveEvmPermitConfig(quote.inputAsset);

      if (shouldUsePermit && permitConfig) {
        const ownerAddress = inputWalletAddress.chain.value as EvmAddress;
        const tokenAddress = quote.inputAsset.chain.value.kind.value as EvmAddress;
        const spenderAddress = quote.settlementData.value.srcProtocolContractAddress.chain
          .value as EvmAddress;

        if (permitConfig.kind === "eip2612") {
          const nonce = await getContractNonce(wagmiConfig, {
            ownerAddress,
            contractAddress: tokenAddress,
          });

          const now = Math.floor(Date.now() / 1000);
          const deadline = BigInt(now + 3600);
          const permitMessage = {
            owner: ownerAddress,
            spender: spenderAddress,
            value: BigInt(quote.inputUnits),
            nonce,
            deadline,
          };

          const permitTypedData = buildEip2612PermitTypedData({
            domain: permitConfig.domain,
            message: permitMessage,
          });

          const permitSignature = await signTypedData({
            ...permitTypedData,
            account: ownerAddress,
          });

          permitData = {
            usePermit2: false,
            permitSignature: encodeRawSignature(permitSignature),
            encodedPermitData: encodeEip2612PermitData(permitMessage),
          };
        } else if (permitConfig.kind === "permit2") {
          const currentAllowance = await readContract(wagmiConfig, {
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "allowance",
            args: [ownerAddress, PERMIT2_ADDRESS],
            chainId: inputChainId,
          });

          const isAllowanceSufficient = currentAllowance >= BigInt(quote.inputUnits);

          if (!isAllowanceSufficient) {
            const approveHash = await writeContractAsync({
              address: tokenAddress,
              abi: erc20Abi,
              functionName: "approve",
              args: [PERMIT2_ADDRESS, maxUint256],
              chainId: inputChainId,
              account: ownerAddress,
            });

            await waitForTransactionReceipt(wagmiConfig, {
              hash: approveHash,
              chainId: inputChainId,
            });
          }

          const nonce = await getPermit2Nonce(wagmiConfig, {
            ownerAddress,
            permit2Address: permitConfig.domain.verifyingContract,
            tokenAddress,
            spenderAddress,
          });

          const now = Math.floor(Date.now() / 1000);
          const sigDeadline = BigInt(now + 3600);
          const permitMessage = {
            details: {
              token: tokenAddress,
              amount: BigInt(quote.inputUnits),
              expiration: now + 3600,
              nonce: Number(nonce),
            },
            spender: spenderAddress,
            sigDeadline,
          };

          const permitTypedData = buildPermit2PermitTypedData({
            domain: permitConfig.domain,
            message: permitMessage,
          });

          const permitSignature = await signTypedData({
            ...permitTypedData,
            account: ownerAddress,
          });

          permitData = {
            usePermit2: true,
            permitSignature: encodeRawSignature(permitSignature),
            encodedPermitData: encodePermit2PermitData(permitMessage),
          };
        }
      }

      // --- htlc

      let htlcSecrets: Uint8Array[] | undefined;
      let htlcSecretsData: Required<Pick<BuildEvmOrderPayloadRequest, "htlcSecrets">> | undefined;

      const shouldUseHtlc = true; // currently EVM order quotes are always HTLC

      if (shouldUseHtlc) {
        htlcSecrets = Array.from({ length: htlcMaxExecutions }, generateHtlcSecret);
        htlcSecretsData = {
          htlcSecrets: {
            secretMode: {
              $case: "provided",
              value: {
                hashes: htlcSecrets.map((secret) =>
                  generateHtlcHashlock(secret, quote.settlementData.value.htlcHashingFunction),
                ),
              },
            },
          },
        };
      }

      // --- order payload

      const evmOrderPayload = await omniston.evmBuildOrderPayload({
        quoteId: quote.quoteId,
        ownerSrcAddress: inputWalletAddress,
        traderDstAddress: outputWalletAddress,
        traderDstDiscloseAddress: outputWalletAddress,
        ...htlcSecretsData,
        ...permitData,
      });

      const orderTypedData = JSON.parse(evmOrderPayload.typedData) as Omit<TypedData, "domain"> & {
        domain: Required<NonNullable<TypedData["domain"]>>;
      };

      const ownerAddress = inputWalletAddress.chain.value as EvmAddress;
      const tokenAddress = orderTypedData.message.makerAsset as EvmAddress;
      const spenderAddress = orderTypedData.domain.verifyingContract;
      const chainId = Number(orderTypedData.domain.chainId);

      // --- approval check + request if needed

      const isAllowanceRequired = permitData
        ? false
        : isChainInFamily(quote.inputAsset.chain.$case, ChainFamily.EVM) &&
          quote.inputAsset.chain.value.kind.$case !== "native";

      if (isAllowanceRequired) {
        const currentAllowance = await readContract(wagmiConfig, {
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "allowance",
          args: [ownerAddress, spenderAddress],
          chainId,
        });

        const isAllowanceSufficient = currentAllowance >= BigInt(quote.inputUnits);

        if (!isAllowanceSufficient) {
          const approveHash = await writeContractAsync({
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "approve",
            args: [spenderAddress, maxUint256],
            chainId,
            account: ownerAddress,
          });

          await waitForTransactionReceipt(wagmiConfig, {
            hash: approveHash,
            chainId,
          });
        }
      }

      // --- sign order

      const orderSignature = await signTypedData({
        ...orderTypedData,
        account: inputWalletAddress.chain.value as EvmAddress,
      });

      await omniston.orderRegisterSignedOrder({
        quoteId: quote.quoteId,
        ownerSrcAddress: inputWalletAddress,
        signedOrder: {
          order: {
            $case: "evmV1",
            value: {
              encodedOrder: encodeTypedData(orderTypedData),
              signature: encodeCompactSignature(orderSignature),
              orderExtension: evmOrderPayload.orderExtension,
            },
          },
        },
        serializedOrderDetails: evmOrderPayload.serializedOrderDetails,
      });

      return {
        htlcSecrets,
      };
    };
  }, [
    htlcMaxExecutions,
    inputWalletAddress,
    omniston,
    outputWalletAddress,
    quote,
    signTypedData,
    switchChainAsync,
    wagmiConfig,
    writeContractAsync,
  ]);

  return buildAndSendTransaction;
}

function encodeCompactSignature(serializedSignature: SignTypedDataResult) {
  const signature = parseSignature(serializedSignature);
  const compactSignature = signatureToCompactSignature(signature);
  const serializedCompactSignature = serializeCompactSignature(compactSignature);
  const bytes = hexToBytes(serializedCompactSignature);

  return bytes;
}

function encodeRawSignature(serializedSignature: SignTypedDataResult) {
  return hexToBytes(serializedSignature);
}

function encodeTypedData(typedData: any) {
  return hexToBytes(
    encodeAbiParameters(
      typedData.types[typedData.primaryType],
      typedData.types[typedData.primaryType].map((type: any) => typedData.message[type.name]),
    ),
  );
}
