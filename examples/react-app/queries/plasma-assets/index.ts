import { plasma } from "@reown/appkit/networks";

import { memoizePromise } from "~/lib/utils/promise";
import type { Asset } from "~/models/asset";
import { Chain } from "~/models/chain";
import { resolveAssetsMock } from "~/queries/assets-mock";
import {
  createEvmAssetQueryFactory,
  evmAssetMockSchema,
  type EvmAssetMock,
} from "~/queries/evm-asset-factory";

import PLASMA_ASSETS_MOCK from "./plasma-assets-mock.json";

const PLASMA_ASSETS_QUERY_KEY = "plasma-assets";
const PLASMA_ASSETS_SEARCH_QUERY_KEY = "plasma-assets-search";

export const plasmaAssetQueryFactory = createEvmAssetQueryFactory({
  chain: Chain.PLASMA,
  wagmiChainId: plasma.id,
  queryKey: PLASMA_ASSETS_QUERY_KEY,
  searchQueryKey: PLASMA_ASSETS_SEARCH_QUERY_KEY,
  getAssets: memoizePromise(async () =>
    (await resolveAssetsMock(Chain.PLASMA, PLASMA_ASSETS_MOCK, evmAssetMockSchema)).map(
      transformToAsset,
    ),
  ),
});

function transformToAsset(plasmaAsset: EvmAssetMock): Asset {
  return {
    id: {
      chain: {
        $case: Chain.PLASMA,
        value: {
          kind:
            plasmaAsset.address === "native"
              ? { $case: "native", value: {} }
              : { $case: "erc20", value: plasmaAsset.address },
        },
      },
    },
    metadata: plasmaAsset.metadata,
    balance: plasmaAsset.balance,
    extra: {},
  };
}
