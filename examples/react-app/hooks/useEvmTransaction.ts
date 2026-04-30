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
import { useConfig, useSignTypedData, useWriteContract } from "wagmi";
import { readContract, waitForTransactionReceipt } from "@wagmi/core";
import { useMemo } from "react";
import { isHtlcOrderQuote, matchQuoteByType } from "@ston-fi/omniston-sdk-react";

import { useOmniston } from "@/hooks/useOmniston";
import { useRfq } from "@/hooks/useRfq";
import { useQuoteWallets } from "@/hooks/useTraderQuoteWallets";
import { generateHashlock, generateHtlcSecret } from "@/lib/utils/htlc";
import { useSwapSettings } from "@/providers/swap-settings";
import { isEvmChain } from "@/models/chain";

export function useEvmTransaction() {
  const omniston = useOmniston();

  const wagmiConfig = useConfig();
  const { mutateAsync: signTypedData } = useSignTypedData();
  const { mutateAsync: writeContractAsync } = useWriteContract();

  const { data: quoteEvent } = useRfq();
  const quote = quoteEvent?.$case === "quoteUpdated" ? quoteEvent.value : undefined;

  const { htlcMaxExecutions } = useSwapSettings();

  const { inputWalletAddress, outputWalletAddress } = useQuoteWallets(quote);

  const buildAndSendTransaction = useMemo(() => {
    if (!quote) return;
    if (!inputWalletAddress || !outputWalletAddress) return;
    if (!isHtlcOrderQuote(quote)) return;

    return async () => {
      let htlcSecrets: Uint8Array<ArrayBufferLike>[] | undefined;

      const buildTxFn = matchQuoteByType(quote, {
        swap: () => {
          throw new Error("swap quote is only for TON blockchain");
        },
        order: (orderQuote) => async () => {
          const secrets = Array.from({ length: htlcMaxExecutions }, generateHtlcSecret);
          const hashlocks = secrets.map((secret) =>
            generateHashlock(secret, orderQuote.settlementData.value.htlcHashingFunction),
          );

          htlcSecrets = secrets;

          return omniston.evmBuildOrderPayload({
            quoteId: quote.quoteId,
            ownerSrcAddress: inputWalletAddress,
            traderDstAddress: outputWalletAddress,
            htlcSecrets: {
              secretMode: {
                $case: "provided",
                value: {
                  hashes: hashlocks,
                },
              },
            },
            traderDstDiscloseAddress: outputWalletAddress,
          });
        },
      });

      const evmHtlcPayload = await buildTxFn();

      type TypedData = Parameters<typeof signTypedData>[0];
      const rawTypedData = JSON.parse(evmHtlcPayload.typedData) as any;
      const typedData = rawTypedData as Omit<TypedData, "domain"> & {
        domain: Required<NonNullable<TypedData["domain"]>>;
      };

      const isAllowanceRequired =
        isEvmChain(quote.inputAsset.chain.$case) &&
        quote.inputAsset.chain.value.kind.$case !== "native";

      if (isAllowanceRequired) {
        const tokenAddress = typedData.message.makerAsset as EvmAddress;
        const spenderAddress = typedData.domain.verifyingContract;
        const ownerAddress = inputWalletAddress.chain.value as EvmAddress;

        const currentAllowance = await readContract(wagmiConfig, {
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "allowance",
          args: [ownerAddress, spenderAddress],
        });

        const isAllowanceSufficient = currentAllowance >= BigInt(quote.inputUnits);

        if (!isAllowanceSufficient) {
          const approveHash = await writeContractAsync({
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "approve",
            args: [spenderAddress, maxUint256],
          });

          await waitForTransactionReceipt(wagmiConfig, { hash: approveHash });
        }
      }

      const serializedSignature = await signTypedData(typedData);

      const signature = parseSignature(serializedSignature);
      const compactSignature = signatureToCompactSignature(signature);
      const serializedCompactSignature = serializeCompactSignature(compactSignature);

      await omniston.orderRegisterSignedOrder({
        quoteId: quote.quoteId,
        ownerSrcAddress: inputWalletAddress,
        signedOrder: {
          order: {
            $case: "evmV1",
            value: {
              encodedOrder: hexToBytes(
                encodeAbiParameters(
                  rawTypedData.types[rawTypedData.primaryType],
                  rawTypedData.types[rawTypedData.primaryType].map(
                    (type: any) => rawTypedData.message[type.name],
                  ),
                ),
              ),
              signature: hexToBytes(serializedCompactSignature),
              orderExtension: evmHtlcPayload.orderExtension,
            },
          },
        },
        serializedOrderDetails: evmHtlcPayload.serializedOrderDetails,
      });

      return {
        htlcSecrets,
      };
    };
  }, [inputWalletAddress, outputWalletAddress, quote?.quoteId]);

  return buildAndSendTransaction;
}
