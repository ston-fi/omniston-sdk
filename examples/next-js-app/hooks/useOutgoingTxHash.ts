import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

interface TonApiSuccessResponse {
  success: true;
  transaction: {
    hash: string;
  };
  emulated?: boolean;
}

const REFETCH_DELAY = 5000;

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
    queryFn: async ({ signal }) => {
      const response = await fetch(
        `https://tonapi.io/v2/traces/${externalTxHash}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          signal,
        },
      );
      const result = (await response.json()) as TonApiSuccessResponse;
      if (!response.ok) {
        throw new Error("Error fetching transaction", { cause: result });
      }
      if (result.emulated) {
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey });
        }, REFETCH_DELAY);
        return null;
      }
      return result.transaction.hash;
    },
    enabled: externalTxHash !== null,
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
