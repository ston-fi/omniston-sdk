import {
  useRfq as _useRfq,
  Blockchain,
  GaslessSettlement,
  type QuoteRequest,
  SettlementMethod,
} from "@ston-fi/omniston-sdk-react";

import { useDebounce } from "@/hooks";
import { floatToBigNumber, percentToPercentBps } from "@/lib/utils";
import { useSwapForm } from "@/providers/swap-form";
import { useSwapSettings } from "@/providers/swap-settings";
import { useTrackingQuoteState } from "@/providers/tracking-quote";

export const useRfq = () => {
  const { askAsset, bidAsset, askAmount, bidAmount } = useSwapForm();
  const { slippageTolerance } = useSwapSettings();
  const { quoteId } = useTrackingQuoteState();

  const [debouncedQuoteRequest] = useDebounce<QuoteRequest>(
    {
      settlementMethods: [SettlementMethod.SETTLEMENT_METHOD_SWAP],
      askAssetAddress: askAsset
        ? { address: askAsset.address, blockchain: Blockchain.TON }
        : undefined,
      bidAssetAddress: bidAsset
        ? { address: bidAsset.address, blockchain: Blockchain.TON }
        : undefined,
      amount: {
        bidUnits:
          bidAsset && bidAmount
            ? floatToBigNumber(bidAmount, bidAsset.decimals).toString()
            : undefined,
        askUnits:
          askAsset && askAmount
            ? floatToBigNumber(askAmount, askAsset.decimals).toString()
            : undefined,
      },
      settlementParams: {
        maxPriceSlippageBps: percentToPercentBps(slippageTolerance),
        maxOutgoingMessages: 4,
        gaslessSettlement: GaslessSettlement.GASLESS_SETTLEMENT_POSSIBLE,
      },
    },
    300,
  );

  const isFormFilled =
    debouncedQuoteRequest.askAssetAddress !== undefined &&
    debouncedQuoteRequest.bidAssetAddress !== undefined &&
    (debouncedQuoteRequest.amount?.askUnits !== undefined ||
      debouncedQuoteRequest.amount?.bidUnits !== undefined);

  return _useRfq(debouncedQuoteRequest, {
    enabled: isFormFilled && !quoteId,
  });
};
