import { polygon } from "@reown/appkit/networks";

import { memoizePromise } from "~/lib/utils/promise";
import type { Asset } from "~/models/asset";
import { Chain } from "~/models/chain";
import { resolveAssetsMock } from "~/queries/assets-mock";
import {
  createEvmAssetQueryFactory,
  evmAssetMockSchema,
  type EvmAssetMock,
} from "~/queries/evm-asset-factory";

import POLYGON_ASSETS_MOCK from "./polygon-assets-mock.json";

const POLYGON_ASSETS_QUERY_KEY = "polygon-assets";
const POLYGON_ASSETS_SEARCH_QUERY_KEY = "polygon-assets-search";

export const polygonAssetQueryFactory = createEvmAssetQueryFactory({
  chain: Chain.POLYGON,
  wagmiChainId: polygon.id,
  queryKey: POLYGON_ASSETS_QUERY_KEY,
  searchQueryKey: POLYGON_ASSETS_SEARCH_QUERY_KEY,
  getAssets: memoizePromise(async () =>
    (await resolveAssetsMock(Chain.POLYGON, POLYGON_ASSETS_MOCK, evmAssetMockSchema)).map(
      transformToAsset,
    ),
  ),
});

function transformToAsset(polygonAsset: EvmAssetMock): Asset {
  return {
    id: {
      chain: {
        $case: Chain.POLYGON,
        value: {
          kind:
            polygonAsset.address === "native"
              ? { $case: "native", value: {} }
              : { $case: "erc20", value: polygonAsset.address },
        },
      },
    },
    metadata: polygonAsset.metadata,
    balance: polygonAsset.balance,
    extra: {},
  };
}
