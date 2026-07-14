import { arbitrum } from "@reown/appkit/networks";

import { memoizePromise } from "~/lib/utils/promise";
import type { Asset } from "~/models/asset";
import { Chain } from "~/models/chain";
import { resolveAssetsMock } from "~/queries/assets-mock";
import {
  createEvmAssetQueryFactory,
  evmAssetMockSchema,
  type EvmAssetMock,
} from "~/queries/evm-asset-factory";

import ARBITRUM_ASSETS_MOCK from "./arbitrum-assets-mock.json";

const ARBITRUM_ASSETS_QUERY_KEY = "arbitrum-assets";
const ARBITRUM_ASSETS_SEARCH_QUERY_KEY = "arbitrum-assets-search";

export const arbitrumAssetQueryFactory = createEvmAssetQueryFactory({
  chain: Chain.ARBITRUM,
  wagmiChainId: arbitrum.id,
  queryKey: ARBITRUM_ASSETS_QUERY_KEY,
  searchQueryKey: ARBITRUM_ASSETS_SEARCH_QUERY_KEY,
  getAssets: memoizePromise(async () =>
    (await resolveAssetsMock(Chain.ARBITRUM, ARBITRUM_ASSETS_MOCK, evmAssetMockSchema)).map(
      transformToAsset,
    ),
  ),
});

function transformToAsset(arbitrumAsset: EvmAssetMock): Asset {
  return {
    id: {
      chain: {
        $case: Chain.ARBITRUM,
        value: {
          kind:
            arbitrumAsset.address === "native"
              ? { $case: "native", value: {} }
              : { $case: "erc20", value: arbitrumAsset.address },
        },
      },
    },
    metadata: arbitrumAsset.metadata,
    balance: arbitrumAsset.balance,
    extra: {},
  };
}
