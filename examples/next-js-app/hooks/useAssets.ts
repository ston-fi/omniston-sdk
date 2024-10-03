import { useIsConnectionRestored } from "@tonconnect/ui-react";
import { AssetInfo, useAssetList } from "@ston-fi/omniston-sdk-react";

type UseAssetsParams = {
  select?: (data: AssetInfo[]) => AssetInfo[];
};

export const useAssets = ({ select }: UseAssetsParams = {}) => {
  const isConnectionRestored = useIsConnectionRestored();

  const result = useAssetList({
    enabled: isConnectionRestored,
  });

  let data: AssetInfo[] = [];
  if (result.data) {
    const assets = result.data.assets;
    data = select?.(assets) ?? assets;
  }

  return {
    ...result,
    data,
  };
};
