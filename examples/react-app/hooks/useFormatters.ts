import type { AssetId, ChainAddress } from "@ston-fi/omniston-sdk-react";
import { useMemo } from "react";

import { trimStringWithEllipsis } from "~/lib/utils";
import { addressFromAssetId } from "~/models/address";
import type { Asset } from "~/models/asset";
import { isNativeAssetKind, serializeAssetId } from "~/models/asset-id";

type NumericValue = string | number | bigint;

export function useFormatters() {
  const locale = "en-US";

  return useMemo(() => {
    const unitFormatters = new Map<number, Intl.NumberFormat>();

    const formatUnits = (units: NumericValue, decimals: number): string => {
      let formatter = unitFormatters.get(decimals);

      if (!formatter) {
        formatter = new Intl.NumberFormat(locale, {
          maximumFractionDigits: decimals,
        });

        unitFormatters.set(decimals, formatter);
      }

      // Scale integer units exactly without converting them to a number.
      const value =
        `${BigInt(units)}e-${decimals}` as Intl.StringNumericLiteral;

      return formatter.format(value);
    };

    const formatAssetAmount = (units: NumericValue, asset: Asset): string => {
      const amount = formatUnits(units, asset.metadata.decimals);

      return asset.metadata.symbol
        ? `${amount} ${asset.metadata.symbol}`
        : amount;
    };

    const formatAddressString = (address: string): string => {
      return trimStringWithEllipsis(address, 6, 4);
    };

    const formatAddress = (address: ChainAddress): string => {
      return formatAddressString(address.chain.value);
    };

    const formatAssetId = (assetId: AssetId): string => {
      const assetAddress = addressFromAssetId(assetId);

      if (assetAddress) {
        return formatAddress(assetAddress);
      }

      if (isNativeAssetKind(assetId)) {
        return "Native";
      }

      throw new Error(
        `Unexpected asset-id to format "${serializeAssetId(assetId)}"`,
      );
    };

    return {
      formatUnits,
      formatAssetAmount,
      formatAddress,
      formatAddressString,
      formatAssetId,
    };
  }, [locale]);
}
