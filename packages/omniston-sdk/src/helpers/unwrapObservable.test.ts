import { finalize, Observable, Subject } from "rxjs";
import { describe, expect, test, vi } from "vitest";

import { unwrapObservable } from "./unwrapObservable";

describe("unwrapObservable", () => {
  test("emits values from the resolved inner observable", async () => {
    const subject = new Subject<number>();
    const method = vi.fn(async () => subject.asObservable());
    const wrapped = unwrapObservable(method);

    const received: number[] = [];
    wrapped.call(undefined).subscribe((v) => received.push(v));
    await Promise.resolve();

    subject.next(1);
    subject.next(2);

    expect(received).toEqual([1, 2]);
  });

  test("propagates inner observable errors wrapped with wrapError", async () => {
    const subject = new Subject<number>();
    const method = vi.fn(async () => subject.asObservable());
    const wrapped = unwrapObservable(method);

    let caughtError: unknown;
    wrapped.call(undefined).subscribe({ error: (e) => (caughtError = e) });
    await Promise.resolve();

    subject.error(new Error("inner error"));

    expect(caughtError).toBeInstanceOf(Error);
  });

  test("propagates promise rejection wrapped with wrapError", async () => {
    const method = vi.fn(() => Promise.reject(new Error("promise rejection")));
    const wrapped = unwrapObservable(method);

    let caughtError: unknown;
    wrapped.call(undefined).subscribe({ error: (e) => (caughtError = e) });
    await Promise.resolve();

    expect(caughtError).toBeInstanceOf(Error);
  });

  test("runs finalize on the inner observable when unsubscribed normally", async () => {
    const subject = new Subject<number>();
    const finalizeSpy = vi.fn();
    const method = vi.fn(async () => subject.pipe(finalize(finalizeSpy)));
    const wrapped = unwrapObservable(method);

    const subscription = wrapped.call(undefined).subscribe();
    await Promise.resolve();

    subscription.unsubscribe();

    expect(finalizeSpy).toHaveBeenCalledTimes(1);
  });

  test("runs finalize on the inner observable when unsubscribed before promise resolves (early teardown)", async () => {
    let resolveInner!: (obs: Observable<number>) => void;

    const innerPromise = new Promise<Observable<number>>((resolve) => {
      resolveInner = resolve;
    });

    const finalizeSpy = vi.fn();
    const subject = new Subject<number>();
    const method = vi.fn(() => innerPromise);
    const wrapped = unwrapObservable(method);

    // Subscribe then immediately unsubscribe — promise has not resolved yet.
    const subscription = wrapped.call(undefined).subscribe();
    subscription.unsubscribe();

    // Now let the promise resolve with an inner observable that has finalize.
    resolveInner(subject.pipe(finalize(finalizeSpy)));
    await Promise.resolve(); // allow .then() microtask to run

    // finalize must have been called even though the caller already unsubscribed.
    expect(finalizeSpy).toHaveBeenCalledTimes(1);
  });
});
