import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { stonApiClient } from "@/lib/ston-api-client";

const REFETCH_DELAY = 1_000;

export type UseOutgoingTxHashResult =
  | { status: "loading" }
  | { status: "error"; error: Error }
  | { status: "success"; data: string };

export function useOutgoingTxHash(
  externalTxHash: string | null,
): UseOutgoingTxHashResult {
  const queryClient = useQueryClient();

  const queryKey = ["outgoingTxHash", externalTxHash];

  const result = useQuery({
    queryKey,
    queryFn: externalTxHash
      ? async () => {
          const response = await stonApiClient.queryTransactions({
            extMsgHash: externalTxHash,
          });

          if (!response.txId) {
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey });
            }, REFETCH_DELAY);

            return null;
          }

          return response.txId.hash;
        }
      : skipToken,
    enabled: !!externalTxHash,
    staleTime: Number.POSITIVE_INFINITY,
  });

  return useMemo(() => {
    if (result.error) {
      return { status: "error", error: result.error };
    } else if (result.data) {
      return { status: "success", data: result.data };
    } else {
      return { status: "loading" };
    }
  }, [result.data, result.error]);
}
