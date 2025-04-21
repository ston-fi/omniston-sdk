import { type AssetInfo, STATIC_ASSETS } from "@/constants/assets";

type UseAssetsParams = {
  select?: (data: AssetInfo[]) => AssetInfo[];
};

export const useAssets = ({ select }: UseAssetsParams = {}) => {
  return { data: select ? select(STATIC_ASSETS) : STATIC_ASSETS };
};
