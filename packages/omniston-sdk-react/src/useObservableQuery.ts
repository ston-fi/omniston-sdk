import type { Observable, OmnistonError } from "@ston-fi/omniston-sdk";
import {
  type UseQueryOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useContext, useEffect, useRef } from "react";

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
  queryKey,
  requestFn,
  enabled,
  ...queryOptions
}: UseObservableQueryOptions<TData>) {
  const queryClient = useQueryClient();

  const cache = useContext(ObservableRefCountCacheContext);

  const observableRefCount = cache.getOrCreate(queryKey, requestFn);

  const unsubscribeRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (enabled === false) return;

    observableRefCount.increaseRefCount();

    return () => {
      observableRefCount.decreaseRefCount();
    };
  }, [observableRefCount, enabled]);

  return {
    ...useQuery({
      ...queryOptions,
      queryKey,
      enabled,
      queryFn: () => {
        return new Promise<never>((_, reject) => {
          let isRejected = false;

          const subscription = observableRefCount.subscribe({
            next: (data) => {
              queryClient.setQueryData(queryKey, data);
            },
            error: (err) => {
              isRejected = true;
              reject(err);
            },
            finalizer: () => {
              if (!isRejected) {
                queryClient.cancelQueries({ queryKey });
                queryClient.invalidateQueries({
                  queryKey,
                  refetchType: "none",
                });
              }
            },
          });

          unsubscribeRef.current = () => {
            subscription.unsubscribe();
          };
        });
      },
      staleTime: Number.POSITIVE_INFINITY,
      retry: false,
    }),
    unsubscribe: unsubscribeRef.current,
  };
}
