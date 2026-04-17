import type { InferObservableData, Observable } from "@ston-fi/omniston-sdk";
import {
  type QueryClient,
  type QueryFunctionContext,
  type UseQueryOptions,
  type UseQueryResult,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRef, useSyncExternalStore } from "react";

export type UseObservableQueryOptions<
  TObservable extends Observable<unknown>,
  TError = unknown,
> = Omit<
  UseQueryOptions<InferObservableData<TObservable>, TError>,
  "queryFn" | "staleTime" | "retry"
> & {
  /**
   * Use instead of queryFn to define the query function.
   *
   * @param ctx see {@link https://tanstack.com/query/latest/docs/framework/react/guides/query-functions#queryfunctioncontext}
   *
   * @returns An Observable that emits query results. Each emission will update the query data and trigger a re-render.
   */
  requestFn: (ctx: QueryFunctionContext) => TObservable;
};

export type ObservableQueryResult<
  TObservable extends Observable<unknown>,
  TError = unknown,
> = UseQueryResult<InferObservableData<TObservable>, TError>;

const forceUpdateEventName = "force-update";

type ObservableQueryFnDeps<TObservable extends Observable<unknown>> = {
  requestFn: (ctx: QueryFunctionContext) => TObservable;
  queryClient: Pick<QueryClient, "setQueryData" | "invalidateQueries">;
  requestCtx: QueryFunctionContext;
  onData: (data: InferObservableData<TObservable>) => void;
};

export function observableQueryFnPromise<TObservable extends Observable<unknown>>(
  deps: ObservableQueryFnDeps<TObservable>,
): Promise<never> {
  const { requestFn, queryClient, requestCtx, onData } = deps;
  const { queryKey, signal } = requestCtx;

  return new Promise<never>((_, reject) => {
    let isSettled = false;

    const invalidateWithoutRefetch = () => {
      queryClient.invalidateQueries({
        queryKey,
        refetchType: "none",
      });
    };

    const settleCompleted = () => {
      if (isSettled) return;
      isSettled = true;
      invalidateWithoutRefetch();
    };

    const settleError = (err: unknown) => {
      if (isSettled) return;
      isSettled = true;
      reject(err);
    };

    const subscription = requestFn(requestCtx).subscribe({
      next: (data) => {
        onData(data as InferObservableData<TObservable>);
      },
      error: settleError,
      complete: settleCompleted,
    });

    signal.addEventListener(
      "abort",
      () => {
        // Keep previous next-tick behavior to avoid immediate dev-mode unmount/remount churn.
        setTimeout(() => {
          if (isSettled) return;
          subscription.unsubscribe();
          settleCompleted();
        }, 0);
      },
      { once: true },
    );
  });
}

/**
 * A wrapper for data fetching functions that return an Observable to use with react-query.
 */
export function useObservableQuery<TObservable extends Observable<unknown>, TError = unknown>({
  queryKey,
  requestFn,
  enabled,
  ...queryOptions
}: UseObservableQueryOptions<TObservable, TError>): ObservableQueryResult<TObservable, TError> {
  const queryClient = useQueryClient();

  // Prevents React from batching synchronous updates that would skip intermediate states.
  // Event emitter to force React re-renders on each observable emission.
  const updateEmitterRef = useRef(new EventTarget());

  // Use useSyncExternalStore to ensure React doesn't batch synchronous observable emissions
  // This forces each emission to trigger a separate render
  useSyncExternalStore(
    (callback) => {
      updateEmitterRef.current.addEventListener(forceUpdateEventName, callback);

      return () => updateEmitterRef.current.removeEventListener(forceUpdateEventName, callback);
    },
    () => queryClient.getQueryData(queryKey),
    () => queryClient.getQueryData(queryKey),
  );

  return useQuery<InferObservableData<TObservable>, TError>({
    ...queryOptions,
    queryKey,
    enabled,
    queryFn: (ctx: QueryFunctionContext) => {
      return observableQueryFnPromise({
        requestFn,
        queryClient,
        requestCtx: ctx,
        onData: (data) => {
          queryClient.setQueryData(queryKey, data);
          updateEmitterRef.current.dispatchEvent(new Event(forceUpdateEventName));
        },
      });
    },
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });
}
