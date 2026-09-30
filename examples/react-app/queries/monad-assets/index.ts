import { monad } from "@reown/appkit/networks";

import { memoizePromise } from "~/lib/utils/promise";
import type { Asset } from "~/models/asset";
import { Chain } from "~/models/chain";
import { resolveAssetsMock } from "~/queries/assets-mock";
import {
  createEvmAssetQueryFactory,
  evmAssetMockSchema,
  type EvmAssetMock,
} from "~/queries/evm-asset-factory";

import MONAD_ASSETS_MOCK from "./monad-assets-mock.json";

const MONAD_ASSETS_QUERY_KEY = "monad-assets";
const MONAD_ASSETS_SEARCH_QUERY_KEY = "monad-assets-search";

export const monadAssetQueryFactory = createEvmAssetQueryFactory({
  chain: Chain.MONAD,
  wagmiChainId: monad.id,
  queryKey: MONAD_ASSETS_QUERY_KEY,
  searchQueryKey: MONAD_ASSETS_SEARCH_QUERY_KEY,
  getAssets: memoizePromise(async () =>
    (await resolveAssetsMock(Chain.MONAD, MONAD_ASSETS_MOCK, evmAssetMockSchema)).map(
      transformToAsset,
    ),
  ),
});

function transformToAsset(monadAsset: EvmAssetMock): Asset {
  return {
    id: {
      chain: {
        $case: Chain.MONAD,
        value: {
          kind:
            monadAsset.address === "native"
              ? { $case: "native", value: {} }
              : { $case: "erc20", value: monadAsset.address },
        },
      },
    },
    metadata: monadAsset.metadata,
    balance: monadAsset.balance,
    extra: {},
  };
}
