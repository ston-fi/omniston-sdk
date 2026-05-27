import { AssetId, matchQuoteByType, Quote } from "@ston-fi/omniston-sdk";

export function collectQuoteAssets(quote: Quote): AssetId[] {
  const assetIds = new Set<AssetId>();

  matchQuoteByType(quote, {
    swap: (swapQuote) => {
      assetIds.add(swapQuote.inputAsset);
      assetIds.add(swapQuote.outputAsset);

      swapQuote.settlementData.value.routes
        .flatMap((route) => route.steps)
        .forEach((step) => {
          assetIds.add(step.inputAsset);
          assetIds.add(step.outputAsset);
        });
    },
    order: (orderQuote) => {
      assetIds.add(orderQuote.inputAsset);
      assetIds.add(orderQuote.outputAsset);
    },
  });

  return Array.from(assetIds);
}
