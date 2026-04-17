import { useMemo } from "react";

import {
  useRfq as _useRfq,
  type SettlementParams,
  type SwapSettlementParams,
  type OrderSettlementParams,
  type QuoteRequest,
  SettlementMethod,
} from "@ston-fi/omniston-sdk-react";

import { useDebounce } from "@/hooks/useDebounce";
import { isValidAddress } from "@/lib/address";
import { floatToBigNumber } from "@/lib/utils";
import { percentToPips } from "@/lib/utils/percent";
import { useAssets } from "@/providers/assets";
import { useSwapForm } from "@/providers/swap-form";
import { useSwapSettings } from "@/providers/swap-settings";
import { useTradeTrackState } from "@/providers/trade-track";

export const useRfq = () => {
  const { getAssetById } = useAssets();

  const swapForm = useSwapForm();
  const swapSettings = useSwapSettings();

  const { quote: trackingQuote } = useTradeTrackState();

  const quoteRequest = useMemo<QuoteRequest | undefined>(() => {
    const inputAsset = swapForm.inputAssetId ? getAssetById(swapForm.inputAssetId) : undefined;
    const outputAsset = swapForm.outputAssetId ? getAssetById(swapForm.outputAssetId) : undefined;

    if (!inputAsset || !outputAsset) return undefined;

    let amount: QuoteRequest["amount"] | undefined;

    if (swapForm.inputUnits) {
      amount = {
        $case: "inputUnits",
        value: floatToBigNumber(swapForm.inputUnits, inputAsset.metadata.decimals).toString(),
      };
    } else if (swapForm.outputUnits) {
      amount = {
        $case: "outputUnits",
        value: floatToBigNumber(swapForm.outputUnits, outputAsset.metadata.decimals).toString(),
      };
    }

    if (!amount) return undefined;

    let integratorAddress: QuoteRequest["integratorAddress"] | undefined;

    if (
      swapSettings.integratorAddress &&
      isValidAddress(outputAsset.id.chain.$case, swapSettings.integratorAddress)
    ) {
      integratorAddress = {
        chain: {
          $case: outputAsset.id.chain.$case,
          value: swapSettings.integratorAddress,
        },
      };
    }

    const integratorFeePips =
      integratorAddress && swapSettings.integratorFeePips
        ? swapSettings.integratorFeePips
        : undefined;

    const settlementParams: SettlementParams[] = [];

    for (const settlementMethod of swapSettings.settlementMethods) {
      switch (settlementMethod) {
        case SettlementMethod.SWAP: {
          settlementParams.push({
            params: {
              $case: "swap",
              value: {
                flexibleIntegratorFee: swapSettings.flexibleIntegratorFee,
                maxPriceSlippagePips: percentToPips(swapSettings.slippageTolerancePercent),
              } satisfies SwapSettlementParams,
            },
          });
          break;
        }
        case SettlementMethod.ORDER: {
          settlementParams.push({
            params: {
              $case: "order",
              value: {} satisfies OrderSettlementParams,
            },
          });
          break;
        }
        default: {
          throw new Error(`Unsupported settlement method: ${settlementMethod}`);
        }
      }
    }

    if (settlementParams.length === 0) return undefined;

    return {
      inputAsset: inputAsset.id,
      outputAsset: outputAsset.id,
      amount,
      integratorAddress,
      integratorFeePips,
      settlementParams,
    };
  }, [swapForm, swapSettings, getAssetById]);

  const [debouncedQuoteRequest] = useDebounce(quoteRequest, 300);

  return _useRfq(
    // we are disabling the query when the quote request is undefined
    // so we can be sure that the quote request is always defined when the query is enabled
    debouncedQuoteRequest!,
    {
      enabled: !trackingQuote && debouncedQuoteRequest !== undefined,
    },
  );
};
