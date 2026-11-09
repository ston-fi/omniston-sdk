import { elysium } from "~/lib/evm/elysium";
import { memoizePromise } from "~/lib/utils/promise";
import type { Asset } from "~/models/asset";
import { Chain } from "~/models/chain";
import { resolveAssetsMock } from "~/queries/assets-mock";
import {
  createEvmAssetQueryFactory,
  evmAssetMockSchema,
  type EvmAssetMock,
} from "~/queries/evm-asset-factory";

import ELYSIUM_ASSETS_MOCK from "./elysium-assets-mock.json";

const ELYSIUM_ASSETS_QUERY_KEY = "elysium-assets";
const ELYSIUM_ASSETS_SEARCH_QUERY_KEY = "elysium-assets-search";

export const elysiumAssetQueryFactory = createEvmAssetQueryFactory({
  chain: Chain.ELYSIUM,
  wagmiChainId: elysium.id,
  queryKey: ELYSIUM_ASSETS_QUERY_KEY,
  searchQueryKey: ELYSIUM_ASSETS_SEARCH_QUERY_KEY,
  getAssets: memoizePromise(async () =>
    (
      await resolveAssetsMock(
        Chain.ELYSIUM,
        ELYSIUM_ASSETS_MOCK,
        evmAssetMockSchema,
      )
    ).map(transformToAsset),
  ),
});

function transformToAsset(elysiumAsset: EvmAssetMock): Asset {
  return {
    id: {
      chain: {
        $case: Chain.ELYSIUM,
        value: {
          kind:
            elysiumAsset.address === "native"
              ? { $case: "native", value: {} }
              : { $case: "erc20", value: elysiumAsset.address },
        },
      },
    },
    metadata: elysiumAsset.metadata,
    balance: elysiumAsset.balance,
    extra: {},
  };
}
