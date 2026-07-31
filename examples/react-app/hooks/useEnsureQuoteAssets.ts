import type { Quote } from "@ston-fi/omniston-sdk-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { collectQuoteAssets } from "~/lib/omniston/quote";
import { serializeAssetId } from "~/models/asset-id";
import { useAssets } from "~/providers/assets";

export function useEnsureQuoteAssets(quotes?: Quote | Quote[]) {
  const { populateAssets } = useAssets();

  const assetIds = useMemo(() => {
    const quoteList = Array.isArray(quotes) ? quotes : quotes ? [quotes] : [];
    const assetIdsByKey = new Map(
      quoteList.flatMap(collectQuoteAssets).map((assetId) => [serializeAssetId(assetId), assetId]),
    );

    return Array.from(assetIdsByKey.keys())
      .sort()
      .map((key) => assetIdsByKey.get(key)!);
  }, [quotes]);

  const populateAssetsQuery = useQuery({
    queryKey: ["quoteAssets", ...assetIds.map(serializeAssetId)],
    queryFn: () => populateAssets(assetIds).then(() => null),
    enabled: assetIds.length > 0,
  });

  return {
    error: populateAssetsQuery.error,
    isReady: assetIds.length === 0 || populateAssetsQuery.isSuccess,
  };
}
