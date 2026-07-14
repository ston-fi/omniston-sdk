import { avalanche } from "@reown/appkit/networks";

import { memoizePromise } from "~/lib/utils/promise";
import type { Asset } from "~/models/asset";
import { Chain } from "~/models/chain";
import { resolveAssetsMock } from "~/queries/assets-mock";
import {
  createEvmAssetQueryFactory,
  evmAssetMockSchema,
  type EvmAssetMock,
} from "~/queries/evm-asset-factory";

import AVALANCHE_ASSETS_MOCK from "./avalanche-assets-mock.json";

const AVALANCHE_ASSETS_QUERY_KEY = "avalanche-assets";
const AVALANCHE_ASSETS_SEARCH_QUERY_KEY = "avalanche-assets-search";

export const avalancheAssetQueryFactory = createEvmAssetQueryFactory({
  chain: Chain.AVALANCHE,
  wagmiChainId: avalanche.id,
  queryKey: AVALANCHE_ASSETS_QUERY_KEY,
  searchQueryKey: AVALANCHE_ASSETS_SEARCH_QUERY_KEY,
  getAssets: memoizePromise(async () =>
    (await resolveAssetsMock(Chain.AVALANCHE, AVALANCHE_ASSETS_MOCK, evmAssetMockSchema)).map(
      transformToAsset,
    ),
  ),
});

function transformToAsset(avalancheAsset: EvmAssetMock): Asset {
  return {
    id: {
      chain: {
        $case: Chain.AVALANCHE,
        value: {
          kind:
            avalancheAsset.address === "native"
              ? { $case: "native", value: {} }
              : { $case: "erc20", value: avalancheAsset.address },
        },
      },
    },
    metadata: avalancheAsset.metadata,
    balance: avalancheAsset.balance,
    extra: {},
  };
}
