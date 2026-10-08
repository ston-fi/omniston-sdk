import { Chain } from "~/models/chain";
import type { EvmChain } from "~/models/chain-family";
import type { createEvmAssetQueryFactory } from "~/queries/evm-asset-factory";
import { arcAssetQueryFactory } from "~/queries/arc-assets";
import { arbitrumAssetQueryFactory } from "~/queries/arbitrum-assets";
import { avalancheAssetQueryFactory } from "~/queries/avalanche-assets";
import { baseAssetQueryFactory } from "~/queries/base-assets";
import { bnbAssetQueryFactory } from "~/queries/bnb-assets";
import { ethereumAssetQueryFactory } from "~/queries/ethereum-assets";
import { hyperEvmAssetQueryFactory } from "~/queries/hyperevm-assets";
import { monadAssetQueryFactory } from "~/queries/monad-assets";
import { plasmaAssetQueryFactory } from "~/queries/plasma-assets";
import { polygonAssetQueryFactory } from "~/queries/polygon-assets";
import { robinhoodAssetQueryFactory } from "~/queries/robinhood-assets";
import { xLayerAssetQueryFactory } from "~/queries/xlayer-assets";

export const EVM_ASSET_QUERY_FACTORIES = {
  [Chain.ARBITRUM]: arbitrumAssetQueryFactory,
  [Chain.ARC]: arcAssetQueryFactory,
  [Chain.AVALANCHE]: avalancheAssetQueryFactory,
  [Chain.BASE]: baseAssetQueryFactory,
  [Chain.BNB]: bnbAssetQueryFactory,
  [Chain.ETHEREUM]: ethereumAssetQueryFactory,
  [Chain.HYPEREVM]: hyperEvmAssetQueryFactory,
  [Chain.MONAD]: monadAssetQueryFactory,
  [Chain.PLASMA]: plasmaAssetQueryFactory,
  [Chain.POLYGON]: polygonAssetQueryFactory,
  [Chain.ROBINHOOD]: robinhoodAssetQueryFactory,
  [Chain.XLAYER]: xLayerAssetQueryFactory,
} satisfies Record<EvmChain, ReturnType<typeof createEvmAssetQueryFactory>>;
