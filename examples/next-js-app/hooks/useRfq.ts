import {
  Blockchain,
  type QuoteRequest,
  SettlementMethod,
  useRfq as _useRfq,
} from "@ston-fi/omniston-sdk-react";

import { useDebounce } from "@/hooks";
import { floatToBigNumber, percentToPercentBps } from "@/lib/utils";
import { useSwapForm } from "@/providers/swap-form";
import { useTrackingQuoteState } from "@/providers/tracking-quote";
import { useSwapSettings } from "@/providers/swap-settings";

export const useRfq = () => {
  const { askAsset, offerAsset, askAmount, offerAmount } = useSwapForm();
  const { slippageTolerance } = useSwapSettings();
  const { quoteId } = useTrackingQuoteState();

  const [debouncedQuoteRequest] = useDebounce<QuoteRequest>(
    {
      settlementMethods: [SettlementMethod.SETTLEMENT_METHOD_SWAP],
      askAssetAddress: askAsset
        ? { address: askAsset.address, blockchain: Blockchain.TON }
        : undefined,
      offerAssetAddress: offerAsset
        ? { address: offerAsset.address, blockchain: Blockchain.TON }
        : undefined,
      amount: {
        offerUnits:
          offerAsset && offerAmount
            ? floatToBigNumber(offerAmount, offerAsset.decimals).toString()
            : undefined,
        askUnits:
          askAsset && askAmount
            ? floatToBigNumber(askAmount, askAsset.decimals).toString()
            : undefined,
      },
      settlementParams: {
        maxPriceSlippageBps: percentToPercentBps(slippageTolerance),
        maxOutgoingMessages: 4,
      },
    },
    300,
  );

  const isFormFilled =
    debouncedQuoteRequest.askAssetAddress !== undefined &&
    debouncedQuoteRequest.offerAssetAddress !== undefined &&
    (debouncedQuoteRequest.amount?.askUnits !== undefined ||
      debouncedQuoteRequest.amount?.offerUnits !== undefined);

  return _useRfq(debouncedQuoteRequest, {
    enabled: isFormFilled && !quoteId,
  });
};
