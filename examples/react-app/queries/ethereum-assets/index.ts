import { mainnet } from "@reown/appkit/networks";

import { memoizePromise } from "~/lib/utils/promise";
import type { Asset } from "~/models/asset";
import { Chain } from "~/models/chain";
import { resolveAssetsMock } from "~/queries/assets-mock";
import {
  createEvmAssetQueryFactory,
  evmAssetMockSchema,
  type EvmAssetMock,
} from "~/queries/evm-asset-factory";

import ETHEREUM_ASSETS_MOCK from "./ethereum-assets-mock.json";

const ETHEREUM_ASSETS_QUERY_KEY = "ethereum-assets";
const ETHEREUM_ASSETS_SEARCH_QUERY_KEY = "ethereum-assets-search";

export const ethereumAssetQueryFactory = createEvmAssetQueryFactory({
  chain: Chain.ETHEREUM,
  wagmiChainId: mainnet.id,
  queryKey: ETHEREUM_ASSETS_QUERY_KEY,
  searchQueryKey: ETHEREUM_ASSETS_SEARCH_QUERY_KEY,
  getAssets: memoizePromise(async () =>
    (await resolveAssetsMock(Chain.ETHEREUM, ETHEREUM_ASSETS_MOCK, evmAssetMockSchema)).map(
      transformToAsset,
    ),
  ),
});

function transformToAsset(ethereumAsset: EvmAssetMock): Asset {
  return {
    id: {
      chain: {
        $case: Chain.ETHEREUM,
        value: {
          kind:
            ethereumAsset.address === "native"
              ? { $case: "native", value: {} }
              : { $case: "erc20", value: ethereumAsset.address },
        },
      },
    },
    metadata: ethereumAsset.metadata,
    balance: ethereumAsset.balance,
    extra: {},
  };
}
