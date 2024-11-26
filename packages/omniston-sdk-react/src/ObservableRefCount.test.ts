import { Observable } from "rxjs";
import { expect, test } from "vitest";

import { ObservableRefCount } from "./ObservableRefCount";

test("ObservableRefCount propagates errors", () => {
  const obs = new Observable((subscriber) => {
    subscriber.error("error");
  });
  const refCount = new ObservableRefCount(() => obs);
  let lastError: unknown;
  refCount.subscribe({
    next: () => {},
    error: (err) => {
      lastError = err;
    },
    finalizer: () => {},
  });
  expect(lastError).toBe("error");
});

test("ObservableRefCount triggers finalizer for original Observable", async () => {
  let finalizerCalled = false;
  const obs = new Observable(() => {
    return () => {
      finalizerCalled = true;
    };
  });
  const refCount = new ObservableRefCount(() => obs);
  refCount.subscribe({
    next: () => {},
    error: () => {},
    finalizer: () => {},
  });
  expect(finalizerCalled).toBe(false);
  refCount.increaseRefCount();
  refCount.decreaseRefCount();
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(finalizerCalled).toBe(true);
});
