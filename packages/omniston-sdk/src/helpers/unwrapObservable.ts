import { catchError, Observable, type Subscription, throwError } from "rxjs";

import { wrapError } from "./wrapError";

/**
 * Helper to unwrap return type from Promise<Observable<T>> to Observable<T>
 *
 * Wraps all errors (both from promise rejection and inner observable) with wrapError.
 * Properly handles early unsubscription before the promise resolves.
 *
 * @returns RxJS Observable (use toSimpleObservable to convert to SimpleObservable)
 */
export function unwrapObservable<T, TArgs extends Array<unknown>, TReturn>(
  originalMethod: (this: T, ...args: TArgs) => Promise<Observable<TReturn>>,
): (this: T, ...args: TArgs) => Observable<TReturn> {
  return function (this: T, ...args: TArgs): Observable<TReturn> {
    return new Observable((subscriber) => {
      let isClosed = false;
      let innerSubscription: Subscription | undefined;

      void originalMethod.apply(this, args).then(
        (inner) => {
          const wrappedInner = inner.pipe(catchError((err) => throwError(() => wrapError(err))));

          if (isClosed) {
            // Preserve inner teardown side effects for early unsubscriptions.
            const cleanupSubscription = wrappedInner.subscribe({
              error: () => undefined,
            });
            cleanupSubscription.unsubscribe();
            return;
          }

          innerSubscription = wrappedInner.subscribe(subscriber);
        },
        (err) => {
          if (isClosed) {
            return;
          }

          subscriber.error(wrapError(err));
        },
      );

      return () => {
        isClosed = true;
        innerSubscription?.unsubscribe();
      };
    });
  };
}
