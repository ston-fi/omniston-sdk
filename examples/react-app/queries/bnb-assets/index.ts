import { bsc } from "@reown/appkit/networks";

import type { Asset } from "@/models/asset";
import { Chain } from "@/models/chain";
import {
  createEvmAssetQueryFactory,
  resolveEvmAssetsMock,
  type EvmAssetMock,
} from "@/queries/evm-asset-factory";

import BNB_ASSETS_MOCK from "./bnb-assets-mock.json";

const BNB_ASSETS_QUERY_KEY = "bnb-assets";
const BNB_ASSETS_SEARCH_QUERY_KEY = "bnb-assets-search";

export const bnbAssetQueryFactory = createEvmAssetQueryFactory({
  chain: Chain.BNB,
  wagmiChainId: bsc.id,
  queryKey: BNB_ASSETS_QUERY_KEY,
  searchQueryKey: BNB_ASSETS_SEARCH_QUERY_KEY,
  getAssets: async () =>
    (await resolveEvmAssetsMock(Chain.BNB, BNB_ASSETS_MOCK)).map(transformToAsset),
});

function transformToAsset(bnbAsset: EvmAssetMock): Asset {
  return {
    id: {
      chain: {
        $case: Chain.BNB,
        value: {
          kind:
            bnbAsset.address === "native"
              ? { $case: "native", value: {} }
              : { $case: "erc20", value: bnbAsset.address },
        },
      },
    },
    metadata: bnbAsset.metadata,
    balance: bnbAsset.balance,
    extra: {},
  };
}
