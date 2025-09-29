import {
  useRfq as _useRfq,
  Blockchain,
  GaslessSettlement,
  type QuoteRequest,
} from "@ston-fi/omniston-sdk-react";

import { useDebounce } from "@/hooks/useDebounce";
import { floatToBigNumber, percentToPercentBps } from "@/lib/utils";
import { useAssets } from "@/providers/assets";
import { useSwapForm } from "@/providers/swap-form";
import { useSwapSettings } from "@/providers/swap-settings";
import { useTrackingQuoteState } from "@/providers/tracking-quote";

export const useRfq = () => {
  const { askAddress, bidAddress, askAmount, bidAmount } = useSwapForm();
  const {
    slippageTolerance,
    settlementMethods,
    referrerAddress,
    referrerFeeBps,
  } = useSwapSettings();
  const { quoteId } = useTrackingQuoteState();
  const { getAssetByAddress } = useAssets();

  const [debouncedQuoteRequest] = useDebounce<QuoteRequest>(
    {
      settlementMethods,
      askAssetAddress: askAddress
        ? { address: askAddress, blockchain: Blockchain.TON }
        : undefined,
      bidAssetAddress: bidAddress
        ? { address: bidAddress, blockchain: Blockchain.TON }
        : undefined,
      amount: {
        bidUnits:
          bidAddress && bidAmount
            ? floatToBigNumber(
                bidAmount,
                getAssetByAddress(bidAddress)!.meta.decimals,
              ).toString()
            : undefined,
        askUnits:
          askAddress && askAmount
            ? floatToBigNumber(
                askAmount,
                getAssetByAddress(askAddress)!.meta.decimals,
              ).toString()
            : undefined,
      },
      referrerAddress: referrerAddress
        ? { address: referrerAddress, blockchain: Blockchain.TON }
        : undefined,
      referrerFeeBps: referrerFeeBps,
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
