import { arc } from "@reown/appkit/networks";

import { memoizePromise } from "~/lib/utils/promise";
import type { Asset } from "~/models/asset";
import { Chain } from "~/models/chain";
import { resolveAssetsMock } from "~/queries/assets-mock";
import {
  createEvmAssetQueryFactory,
  evmAssetMockSchema,
  type EvmAssetMock,
} from "~/queries/evm-asset-factory";

import ARC_ASSETS_MOCK from "./arc-assets-mock.json";

const ARC_ASSETS_QUERY_KEY = "arc-assets";
const ARC_ASSETS_SEARCH_QUERY_KEY = "arc-assets-search";

export const arcAssetQueryFactory = createEvmAssetQueryFactory({
  chain: Chain.ARC,
  wagmiChainId: arc.id,
  queryKey: ARC_ASSETS_QUERY_KEY,
  searchQueryKey: ARC_ASSETS_SEARCH_QUERY_KEY,
  getAssets: memoizePromise(async () =>
    (await resolveAssetsMock(Chain.ARC, ARC_ASSETS_MOCK, evmAssetMockSchema)).map(transformToAsset),
  ),
});

function transformToAsset(arcAsset: EvmAssetMock): Asset {
  return {
    id: {
      chain: {
        $case: Chain.ARC,
        value: {
          kind:
            arcAsset.address === "native"
              ? { $case: "native", value: {} }
              : { $case: "erc20", value: arcAsset.address },
        },
      },
    },
    metadata: arcAsset.metadata,
    balance: arcAsset.balance,
    extra: {},
  };
}
