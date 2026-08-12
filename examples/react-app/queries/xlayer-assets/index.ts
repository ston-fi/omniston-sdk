import { xLayer } from "@reown/appkit/networks";

import { memoizePromise } from "~/lib/utils/promise";
import type { Asset } from "~/models/asset";
import { Chain } from "~/models/chain";
import { resolveAssetsMock } from "~/queries/assets-mock";
import {
  createEvmAssetQueryFactory,
  evmAssetMockSchema,
  type EvmAssetMock,
} from "~/queries/evm-asset-factory";

import XLAYER_ASSETS_MOCK from "./xlayer-assets-mock.json";

const XLAYER_ASSETS_QUERY_KEY = "xlayer-assets";
const XLAYER_ASSETS_SEARCH_QUERY_KEY = "xlayer-assets-search";

export const xLayerAssetQueryFactory = createEvmAssetQueryFactory({
  chain: Chain.XLAYER,
  wagmiChainId: xLayer.id,
  queryKey: XLAYER_ASSETS_QUERY_KEY,
  searchQueryKey: XLAYER_ASSETS_SEARCH_QUERY_KEY,
  getAssets: memoizePromise(async () =>
    (await resolveAssetsMock(Chain.XLAYER, XLAYER_ASSETS_MOCK, evmAssetMockSchema)).map(
      transformToAsset,
    ),
  ),
});

function transformToAsset(xLayerAsset: EvmAssetMock): Asset {
  return {
    id: {
      chain: {
        $case: Chain.XLAYER,
        value: {
          kind:
            xLayerAsset.address === "native"
              ? { $case: "native", value: {} }
              : { $case: "erc20", value: xLayerAsset.address },
        },
      },
    },
    metadata: xLayerAsset.metadata,
    balance: xLayerAsset.balance,
    extra: {},
  };
}
