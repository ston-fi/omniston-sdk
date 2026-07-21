import {
  encodeAbiParameters,
  hashTypedData,
  hexToBytes,
  parseSignature,
  serializeCompactSignature,
  signatureToCompactSignature,
  type Hex,
} from "viem";
import type { useSignTypedData } from "wagmi";
import { useMemo } from "react";
import { isHtlcOrderQuote, BuildEvmOrderPayloadRequest } from "@ston-fi/omniston-sdk-react";
import type { TronWeb } from "tronweb";

import { useOmniston } from "~/hooks/useOmniston";
import { useRfq } from "~/hooks/useRfq";
import { useQuoteWallets } from "~/hooks/useTraderQuoteWallets";
import { generateHtlcHashlock, generateHtlcSecret } from "~/lib/omniston/htlc";
import { useSwapSettings } from "~/providers/swap-settings";
import { Chain } from "~/models/chain";
import type { TronAddress } from "~/lib/tron/address";
import { useTronWalletConnection } from "~/hooks/useTronWalletConnection";
import { useTronWebClient } from "~/hooks/useTronWebClient";

type TypedData = Parameters<ReturnType<typeof useSignTypedData>["mutateAsync"]>[0];

type SignTypedDataResult = Awaited<ReturnType<ReturnType<typeof useSignTypedData>["mutateAsync"]>>;

export function useTronTransaction() {
  const omniston = useOmniston();

  const { signMessage: signTronMessage, signTransaction: signTronTransaction } =
    useTronWalletConnection();
  const getTronWebClient = useTronWebClient();

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

      if (inputChain !== Chain.TRON) {
        throw new Error(`Expected TRON chain for order quote, got "${inputChain}"`);
      }

      // --- htlc

      let htlcSecrets: Uint8Array[] | undefined;
      let htlcSecretsData: Required<Pick<BuildEvmOrderPayloadRequest, "htlcSecrets">> | undefined;

      const shouldUseHtlc = true; // currently TRON order quotes are always HTLC

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
      });

      const orderTypedData = JSON.parse(evmOrderPayload.typedData) as Omit<TypedData, "domain"> & {
        domain: Required<NonNullable<TypedData["domain"]>>;
      };

      // --- approval check + request if needed

      const isAllowanceRequired = quote.inputAsset.chain.value.kind.$case !== "native";

      if (isAllowanceRequired) {
        const ownerAddress = inputWalletAddress.chain.value as TronAddress;
        const spenderAddress = quote.settlementData.value.srcProtocolContractAddress.chain
          .value as TronAddress;

        const tronWeb = getTronWebClient();

        tronWeb.setAddress(ownerAddress);

        const tokenAddress = quote.inputAsset.chain.value.kind.value as TronAddress;
        const token = await tronWeb.contract().at(tokenAddress);
        const allowance = await token.allowance(ownerAddress, spenderAddress).call();
        const currentAllowance = BigInt(allowance.toString());

        const isAllowanceSufficient = currentAllowance >= BigInt(quote.inputUnits);

        if (!isAllowanceSufficient) {
          const parameter = [
            { type: "address", value: spenderAddress },
            { type: "uint256", value: quote.inputUnits },
          ];
          const { transaction } = await tronWeb.transactionBuilder.triggerSmartContract(
            tokenAddress,
            "approve(address,uint256)",
            { feeLimit: 100_000_000, callValue: 0 },
            parameter,
          );

          const signedTransaction = await signTronTransaction({ ownerAddress, transaction });

          await tronWeb.trx.sendRawTransaction(signedTransaction as any);

          await waitForConfirmation(tronWeb, transaction.txID);
        }
      }

      // --- sign order

      const orderSignature = await signTronMessage({
        message: hashTypedData(orderTypedData),
        from: inputWalletAddress.chain.value as TronAddress,
      });

      await omniston.orderRegisterSignedOrder({
        quoteId: quote.quoteId,
        ownerSrcAddress: inputWalletAddress,
        signedOrder: {
          order: {
            $case: "evmV1",
            value: {
              encodedOrder: encodeTypedData(orderTypedData),
              signature: encodeCompactSignature(orderSignature as Hex),
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
    getTronWebClient,
    signTronMessage,
    signTronTransaction,
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

function encodeTypedData(typedData: any) {
  return hexToBytes(
    encodeAbiParameters(
      typedData.types[typedData.primaryType],
      typedData.types[typedData.primaryType].map((type: any) => typedData.message[type.name]),
    ),
  );
}

// https://tronweb.network/docu/docs/references/confirmed-vs-unconfirmed#best-practices
async function waitForConfirmation(tronWeb: TronWeb, txId: string, maxRetries: number = 20) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await tronWeb.trx.getConfirmedTransaction(txId);
      if (result && result.txID) {
        return result;
      }
    } catch {
      // Not confirmed yet
    }
    await new Promise((r) => setTimeout(r, 3000)); // Wait 3 seconds
  }
  throw new Error("Transaction not confirmed");
}
