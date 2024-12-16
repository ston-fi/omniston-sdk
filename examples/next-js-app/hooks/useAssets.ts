import { AssetInfo, useAssetList } from "@ston-fi/omniston-sdk-react";
import { useIsConnectionRestored } from "@tonconnect/ui-react";

type UseAssetsParams = {
  select?: (data: AssetInfo[]) => AssetInfo[];
};

export const useAssets = ({ select }: UseAssetsParams = {}) => {
  const isConnectionRestored = useIsConnectionRestored();

  return useAssetList({
    enabled: isConnectionRestored,
    select: ({ assets }) => (select ? select(assets) : assets),
  });
};
