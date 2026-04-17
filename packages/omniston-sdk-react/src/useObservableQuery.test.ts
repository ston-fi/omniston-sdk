import type { Observable, OmnistonError } from "@ston-fi/omniston-sdk";
import type { QueryFunctionContext } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { observableQueryFnPromise } from "./useObservableQuery";

type Subscriber<T> = {
  next?: (value: T) => void;
  error?: (err: OmnistonError) => void;
  complete?: () => void;
};

function createControllableObservable<T>() {
  let subscriber: Subscriber<T> | null = null;
  const unsubscribe = vi.fn();

  const observable: Observable<T> = {
    subscribe(cb?: Subscriber<T> | ((value: T) => void)) {
      if (typeof cb === "function") {
        subscriber = { next: cb };
      } else {
        subscriber = cb ?? {};
      }
      return {
        unsubscribe,
      };
    },
  };

  return {
    observable,
    get subscriber() {
      return subscriber;
    },
    unsubscribe,
  };
}

function createQueryFnContext(
  queryKey: readonly unknown[],
  signal: AbortSignal,
): QueryFunctionContext {
  return {
    queryKey,
    signal,
    client: {} as QueryFunctionContext["client"],
    meta: undefined,
  } as QueryFunctionContext;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

test("updates query data on each observable next", () => {
  const controllable = createControllableObservable<string>();
  const setQueryData = vi.fn();
  const invalidateQueries = vi.fn();
  const controller = new AbortController();
  const requestCtx = createQueryFnContext(["rfq"], controller.signal);

  void observableQueryFnPromise({
    requestFn: () => controllable.observable,
    queryClient: { setQueryData, invalidateQueries },
    requestCtx,
    onData: (data) => setQueryData(["rfq"], data),
  });

  controllable.subscriber?.next?.("first");
  controllable.subscriber?.next?.("second");

  expect(setQueryData).toHaveBeenCalledTimes(2);
  expect(setQueryData).toHaveBeenNthCalledWith(1, ["rfq"], "first");
  expect(setQueryData).toHaveBeenNthCalledWith(2, ["rfq"], "second");
  expect(invalidateQueries).not.toHaveBeenCalled();
});

test("rejects on observable error and does not invalidate", async () => {
  const controllable = createControllableObservable<string>();
  const setQueryData = vi.fn();
  const invalidateQueries = vi.fn();
  const controller = new AbortController();
  const requestCtx = createQueryFnContext(["rfq"], controller.signal);
  const error = {
    name: "OmnistonError",
    message: "stream failed",
    code: 0,
  } as OmnistonError;

  const promise = observableQueryFnPromise({
    requestFn: () => controllable.observable,
    queryClient: { setQueryData, invalidateQueries },
    requestCtx,
    onData: (data) => setQueryData(["rfq"], data),
  });

  controllable.subscriber?.error?.(error);

  await expect(promise).rejects.toMatchObject({ message: "stream failed" });
  expect(invalidateQueries).not.toHaveBeenCalled();
});

test("unsubscribes and invalidates when aborted", async () => {
  const controllable = createControllableObservable<string>();
  const setQueryData = vi.fn();
  const invalidateQueries = vi.fn();
  const controller = new AbortController();
  const requestCtx = createQueryFnContext(["rfq"], controller.signal);

  void observableQueryFnPromise({
    requestFn: () => controllable.observable,
    queryClient: { setQueryData, invalidateQueries },
    requestCtx,
    onData: (data) => setQueryData(["rfq"], data),
  });

  controller.abort();
  await vi.runAllTimersAsync();

  expect(controllable.unsubscribe).toHaveBeenCalledTimes(1);
  expect(invalidateQueries).toHaveBeenCalledTimes(1);
  expect(invalidateQueries).toHaveBeenCalledWith({
    queryKey: ["rfq"],
    refetchType: "none",
  });
});

test("invalidates once on observable completion", () => {
  const controllable = createControllableObservable<string>();
  const setQueryData = vi.fn();
  const invalidateQueries = vi.fn();
  const controller = new AbortController();
  const requestCtx = createQueryFnContext(["rfq"], controller.signal);

  void observableQueryFnPromise({
    requestFn: () => controllable.observable,
    queryClient: { setQueryData, invalidateQueries },
    requestCtx,
    onData: (data) => setQueryData(["rfq"], data),
  });

  controllable.subscriber?.complete?.();
  controllable.subscriber?.complete?.();

  expect(invalidateQueries).toHaveBeenCalledTimes(1);
  expect(invalidateQueries).toHaveBeenCalledWith({
    queryKey: ["rfq"],
    refetchType: "none",
  });
});

test("rejects on error and ignores subsequent completion", async () => {
  const controllable = createControllableObservable<string>();
  const setQueryData = vi.fn();
  const invalidateQueries = vi.fn();
  const controller = new AbortController();
  const requestCtx = createQueryFnContext(["rfq"], controller.signal);
  const error = {
    name: "OmnistonError",
    message: "stream failed",
    code: 0,
  } as OmnistonError;

  const promise = observableQueryFnPromise({
    requestFn: () => controllable.observable,
    queryClient: { setQueryData, invalidateQueries },
    requestCtx,
    onData: (data) => setQueryData(["rfq"], data),
  });

  controllable.subscriber?.error?.(error);
  controllable.subscriber?.complete?.();

  await expect(promise).rejects.toMatchObject({ message: "stream failed" });
  expect(invalidateQueries).not.toHaveBeenCalled();
});

const { useQueryMock, useQueryClientMock } = vi.hoisted(() => ({
  useQueryMock: vi.fn(),
  useQueryClientMock: vi.fn(),
}));

type UseSyncExternalStoreLike = (
  subscribe: (callback: () => void) => () => void,
  getSnapshot: () => unknown,
  getServerSnapshot: () => unknown,
) => unknown;

async function importUseObservableQueryWithMocks(options?: {
  useSyncExternalStore?: UseSyncExternalStoreLike;
}) {
  vi.resetModules();
  vi.doMock("@tanstack/react-query", () => ({
    useQuery: useQueryMock,
    useQueryClient: useQueryClientMock,
  }));
  const useSyncExternalStoreMock = options?.useSyncExternalStore ?? (() => undefined);
  vi.doMock("react", () => ({
    useRef: <T>(value: T) => ({ current: value }),
    useSyncExternalStore: useSyncExternalStoreMock,
  }));
  return import("./useObservableQuery");
}

describe("useObservableQuery enabled behavior", () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    useQueryClientMock.mockReset();
    useQueryClientMock.mockReturnValue({
      getQueryData: vi.fn(),
      setQueryData: vi.fn(),
      invalidateQueries: vi.fn(),
    });
    useQueryMock.mockReturnValue({} as ReturnType<typeof useQueryMock>);
  });

  test("forwards enabled=false and does not call requestFn during hook setup", async () => {
    const { useObservableQuery } = await importUseObservableQueryWithMocks();
    const requestFn = vi.fn<(_: QueryFunctionContext) => Observable<string>>();

    useObservableQuery({
      queryKey: ["rfq"],
      enabled: false,
      requestFn,
    });

    expect(useQueryMock).toHaveBeenCalledTimes(1);
    expect(useQueryMock.mock.calls[0]?.[0]).toMatchObject({
      enabled: false,
      queryKey: ["rfq"],
    });
    expect(requestFn).not.toHaveBeenCalled();
  });

  test("calls requestFn when enabled changes from false to true", async () => {
    const { useObservableQuery } = await importUseObservableQueryWithMocks();
    const unsubscribe = vi.fn();
    const requestFn = vi.fn((_: QueryFunctionContext) => {
      const observable: Observable<string> = {
        subscribe: () => ({
          unsubscribe,
        }),
      };
      return observable;
    });

    useQueryMock.mockImplementation(
      (options: {
        enabled?: boolean;
        queryFn: (ctx: QueryFunctionContext) => Promise<never>;
        queryKey: readonly unknown[];
      }) => {
        if (options.enabled === false) return {};
        const controller = new AbortController();
        void options.queryFn({
          queryKey: options.queryKey,
          signal: controller.signal,
          client: {} as QueryFunctionContext["client"],
          meta: undefined,
        } as QueryFunctionContext);
        return {};
      },
    );

    useObservableQuery({
      queryKey: ["rfq"],
      enabled: false,
      requestFn,
    });

    expect(requestFn).not.toHaveBeenCalled();

    useObservableQuery({
      queryKey: ["rfq"],
      enabled: true,
      requestFn,
    });

    expect(requestFn).toHaveBeenCalledTimes(1);
    expect(requestFn.mock.calls[0]?.[0]).toMatchObject({
      queryKey: ["rfq"],
    });
  });

  test("uses stable query options contract", async () => {
    const { useObservableQuery } = await importUseObservableQueryWithMocks();
    const requestFn = vi.fn<(_: QueryFunctionContext) => Observable<string>>();

    useObservableQuery({
      queryKey: ["contract"],
      enabled: true,
      gcTime: 12_345,
      meta: { source: "test" },
      requestFn,
    });

    expect(useQueryMock).toHaveBeenCalledTimes(1);
    expect(useQueryMock.mock.calls[0]?.[0]).toMatchObject({
      queryKey: ["contract"],
      enabled: true,
      gcTime: 12_345,
      meta: { source: "test" },
      staleTime: Number.POSITIVE_INFINITY,
      retry: false,
    });
    expect(typeof useQueryMock.mock.calls[0]?.[0]?.queryFn).toBe("function");
  });

  test("triggers external-store update on each query next emission", async () => {
    const notifications = { count: 0 };
    const useSyncExternalStore = vi.fn((subscribe: (callback: () => void) => () => void) => {
      subscribe(() => {
        notifications.count++;
      });
      return undefined;
    });

    const { useObservableQuery } = await importUseObservableQueryWithMocks({
      useSyncExternalStore,
    });

    const controllable = createControllableObservable<string>();
    const setQueryData = vi.fn();
    const queryFnRef: {
      current?: (ctx: QueryFunctionContext) => Promise<never>;
    } = {};

    useQueryClientMock.mockReturnValue({
      getQueryData: vi.fn(),
      setQueryData,
      invalidateQueries: vi.fn(),
    });
    useQueryMock.mockImplementation(
      (options: {
        queryFn: (ctx: QueryFunctionContext) => Promise<never>;
        queryKey: readonly unknown[];
      }) => {
        queryFnRef.current = options.queryFn;
        return {};
      },
    );

    useObservableQuery({
      queryKey: ["rfq"],
      requestFn: () => controllable.observable,
    });

    const controller = new AbortController();
    void queryFnRef.current?.(createQueryFnContext(["rfq"], controller.signal));

    controllable.subscriber?.next?.("first");
    controllable.subscriber?.next?.("second");

    expect(setQueryData).toHaveBeenNthCalledWith(1, ["rfq"], "first");
    expect(setQueryData).toHaveBeenNthCalledWith(2, ["rfq"], "second");
    expect(notifications.count).toBe(2);
  });
});
