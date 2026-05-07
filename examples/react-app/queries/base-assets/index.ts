import { base } from "@reown/appkit/networks";

import type { Asset } from "@/models/asset";
import { Chain } from "@/models/chain";
import {
  createEvmAssetQueryFactory,
  evmAssetMockSchema,
  type EvmAssetMock,
} from "@/queries/evm-asset-factory";

import BASE_ASSETS_MOCK from "./base-assets-mock.json";

const BASE_ASSETS_QUERY_KEY = "base-assets";
const BASE_ASSETS_SEARCH_QUERY_KEY = "base-assets-search";

export const baseAssetQueryFactory = createEvmAssetQueryFactory({
  chain: Chain.BASE,
  wagmiChainId: base.id,
  queryKey: BASE_ASSETS_QUERY_KEY,
  searchQueryKey: BASE_ASSETS_SEARCH_QUERY_KEY,
  getAssets: () => evmAssetMockSchema.array().parse(BASE_ASSETS_MOCK).map(transformToAsset),
});

function transformToAsset(baseAsset: EvmAssetMock): Asset {
  return {
    id: {
      chain: {
        $case: Chain.BASE,
        value: {
          kind:
            baseAsset.address === "native"
              ? { $case: "native", value: {} }
              : { $case: "erc20", value: baseAsset.address },
        },
      },
    },
    metadata: baseAsset.metadata,
    balance: baseAsset.balance,
    extra: {},
  };
}
