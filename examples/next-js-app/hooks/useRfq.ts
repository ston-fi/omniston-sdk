import {
  type QuoteRequest,
  SettlementMethod,
  useRfq as _useRfq,
} from "@ston-fi/omniston-sdk-react";

import { useDebounce } from "@/hooks";
import { floatToBigNumber } from "@/lib/utils";
import { useSwapForm } from "@/providers/swap-form";
import { useTrackingQuoteState } from "@/providers/tracking-quote";

export const useRfq = () => {
  const { askAsset, offerAsset, askAmount, offerAmount } = useSwapForm();
  const { quoteId } = useTrackingQuoteState();

  const [debouncedQuoteRequest] = useDebounce<QuoteRequest>(
    {
      settlementMethods: [SettlementMethod.SETTLEMENT_METHOD_SWAP],
      askAssetAddress: askAsset?.address,
      offerAssetAddress: offerAsset?.address,
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
    },
    300,
  );

  const isFormFilled =
    debouncedQuoteRequest.amount?.askUnits !== undefined ||
    debouncedQuoteRequest.amount?.offerUnits !== undefined;

  return _useRfq(debouncedQuoteRequest, {
    enabled: isFormFilled && !quoteId,
  });
};
