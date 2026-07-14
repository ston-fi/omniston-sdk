import type { AssetId, Quote } from "@ston-fi/omniston-sdk-react";
import { useMemo } from "react";

import { getNativeAssetIdForChain, serializeAssetId } from "~/models/asset-id";
import { useAssets } from "~/providers/assets";

function throwMissingAssetError(assetId: AssetId) {
  return new Error(`Can't display the quote. ${serializeAssetId(assetId)} is missing in store`);
}

export function useQuoteAssets(quote: Quote) {
  const { getAssetById } = useAssets();

  return useMemo(() => {
    const inputAssetId = quote.inputAsset;
    const inputAsset = getAssetById(inputAssetId);

    if (!inputAsset) {
      throw throwMissingAssetError(inputAssetId);
    }

    const inputNativeAssetId = getNativeAssetIdForChain(quote.inputAsset.chain.$case);
    const inputNativeAsset = getAssetById(inputNativeAssetId);

    if (!inputNativeAsset) {
      throw throwMissingAssetError(inputNativeAssetId);
    }

    const outputAssetId = quote.outputAsset;
    const outputAsset = getAssetById(outputAssetId);

    if (!outputAsset) {
      throw throwMissingAssetError(outputAssetId);
    }
    const outputNativeAssetId = getNativeAssetIdForChain(quote.outputAsset.chain.$case);
    const outputNativeAsset = getAssetById(outputNativeAssetId);

    if (!outputNativeAsset) {
      throw throwMissingAssetError(outputNativeAssetId);
    }

    return {
      inputAsset,
      inputNativeAsset,
      outputAsset,
      outputNativeAsset,
    };
  }, [quote.inputAsset, quote.outputAsset, getAssetById]);
}
