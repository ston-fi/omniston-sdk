import { hyperEvm } from "@reown/appkit/networks";

import { memoizePromise } from "~/lib/utils/promise";
import type { Asset } from "~/models/asset";
import { Chain } from "~/models/chain";
import { resolveAssetsMock } from "~/queries/assets-mock";
import {
  createEvmAssetQueryFactory,
  evmAssetMockSchema,
  type EvmAssetMock,
} from "~/queries/evm-asset-factory";

import HYPEREVM_ASSETS_MOCK from "./hyperevm-assets-mock.json";

const HYPEREVM_ASSETS_QUERY_KEY = "hyperevm-assets";
const HYPEREVM_ASSETS_SEARCH_QUERY_KEY = "hyperevm-assets-search";

export const hyperEvmAssetQueryFactory = createEvmAssetQueryFactory({
  chain: Chain.HYPEREVM,
  wagmiChainId: hyperEvm.id,
  queryKey: HYPEREVM_ASSETS_QUERY_KEY,
  searchQueryKey: HYPEREVM_ASSETS_SEARCH_QUERY_KEY,
  getAssets: memoizePromise(async () =>
    (await resolveAssetsMock(Chain.HYPEREVM, HYPEREVM_ASSETS_MOCK, evmAssetMockSchema)).map(
      transformToAsset,
    ),
  ),
});

function transformToAsset(hyperEvmAsset: EvmAssetMock): Asset {
  return {
    id: {
      chain: {
        $case: Chain.HYPEREVM,
        value: {
          kind:
            hyperEvmAsset.address === "native"
              ? { $case: "native", value: {} }
              : { $case: "erc20", value: hyperEvmAsset.address },
        },
      },
    },
    metadata: hyperEvmAsset.metadata,
    balance: hyperEvmAsset.balance,
    extra: {},
  };
}
