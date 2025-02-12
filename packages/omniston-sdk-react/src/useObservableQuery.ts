import type { Observable, OmnistonError } from "@ston-fi/omniston-sdk";
import {
  type UseQueryOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useContext, useEffect } from "react";

import { ObservableRefCountCacheContext } from "./ObservableRefCountCacheContext";

export type UseObservableQueryOptions<TData> = Omit<
  UseQueryOptions<TData, OmnistonError>,
  "queryFn" | "staleTime" | "retry"
> & {
  /**
   * Use instead of queryFn to define the query function.
   * @param ctx see {@link https://tanstack.com/query/latest/docs/framework/react/guides/query-functions#queryfunctioncontext}
   * @returns
   */
  requestFn: () => Observable<TData>;
};

/**
 * A wrapper for data fetching functions that return an Observable to use with react-query.
 */
export function useObservableQuery<TData>({
  requestFn,
  ...queryOptions
}: UseObservableQueryOptions<TData>) {
  const queryClient = useQueryClient();

  const cache = useContext(ObservableRefCountCacheContext);

  const observableRefCount = cache.getOrCreate(
    queryOptions.queryKey,
    requestFn,
  );

  useEffect(() => {
    if (queryOptions.enabled === false) {
      return;
    }

    observableRefCount.increaseRefCount();

    return () => {
      observableRefCount.decreaseRefCount();
    };
  }, [observableRefCount, queryOptions.enabled]);

  return useQuery({
    ...queryOptions,
    queryFn: () => {
      return new Promise<never>((_, reject) => {
        let isRejected = false;

        observableRefCount.subscribe({
          next: (data) => {
            queryClient.setQueryData(queryOptions.queryKey, data);
          },
          error: (err) => {
            isRejected = true;
            reject(err);
          },
          finalizer: () => {
            if (!isRejected) {
              queryClient.cancelQueries({ queryKey: queryOptions.queryKey });
              queryClient.invalidateQueries({
                queryKey: queryOptions.queryKey,
                refetchType: "none",
              });
            }
          },
        });
      });
    },
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });
}
