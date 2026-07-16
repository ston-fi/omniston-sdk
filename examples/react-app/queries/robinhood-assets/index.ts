// TODO(refactor): replace with the chain from `@reown/appkit/networks` when will be added there
import { robinhood } from "~/lib/evm/custom-chains";
import { memoizePromise } from "~/lib/utils/promise";
import type { Asset } from "~/models/asset";
import { Chain } from "~/models/chain";
import { resolveAssetsMock } from "~/queries/assets-mock";
import {
  createEvmAssetQueryFactory,
  evmAssetMockSchema,
  type EvmAssetMock,
} from "~/queries/evm-asset-factory";

import ROBINHOOD_ASSETS_MOCK from "./robinhood-assets-mock.json";

const ROBINHOOD_ASSETS_QUERY_KEY = "robinhood-assets";
const ROBINHOOD_ASSETS_SEARCH_QUERY_KEY = "robinhood-assets-search";

export const robinhoodAssetQueryFactory = createEvmAssetQueryFactory({
  chain: Chain.ROBINHOOD,
  wagmiChainId: robinhood.id,
  queryKey: ROBINHOOD_ASSETS_QUERY_KEY,
  searchQueryKey: ROBINHOOD_ASSETS_SEARCH_QUERY_KEY,
  getAssets: memoizePromise(async () =>
    (await resolveAssetsMock(Chain.ROBINHOOD, ROBINHOOD_ASSETS_MOCK, evmAssetMockSchema)).map(
      transformToAsset,
    ),
  ),
});

function transformToAsset(robinhoodAsset: EvmAssetMock): Asset {
  return {
    id: {
      chain: {
        $case: Chain.ROBINHOOD,
        value: {
          kind:
            robinhoodAsset.address === "native"
              ? { $case: "native", value: {} }
              : { $case: "erc20", value: robinhoodAsset.address },
        },
      },
    },
    metadata: robinhoodAsset.metadata,
    balance: robinhoodAsset.balance,
    extra: {},
  };
}
