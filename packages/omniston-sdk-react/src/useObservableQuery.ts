import type { Observable } from "@ston-fi/omniston-sdk";
import {
  type UseQueryOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useContext, useEffect } from "react";

import { ObservableRefCountCacheContext } from "./ObservableRefCountCacheContext";

export type UseObservableQueryOptions<TData> = Omit<
  UseQueryOptions<TData>,
  "queryFn" | "staleTime"
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
    observableRefCount.increaseRefCount();

    return () => {
      observableRefCount.decreaseRefCount();
    };
  }, [observableRefCount]);

  return useQuery({
    ...queryOptions,
    queryFn: () => {
      return new Promise<never>((_, reject) => {
        observableRefCount.subscribe({
          next: (data) => {
            queryClient.setQueryData(queryOptions.queryKey, data);
          },
          error: (err) => {
            reject(err);
          },
          finalizer: () => {
            queryClient.cancelQueries({ queryKey: queryOptions.queryKey });
            queryClient.invalidateQueries({
              queryKey: queryOptions.queryKey,
              refetchType: "none",
            });
          },
        });
      });
    },
    staleTime: Number.POSITIVE_INFINITY,
  });
}
