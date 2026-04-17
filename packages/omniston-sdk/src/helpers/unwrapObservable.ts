import { catchError, from, type Observable, switchMap, throwError } from "rxjs";

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
    // Convert promise to observable, then flatten the inner observable
    return from(originalMethod.apply(this, args)).pipe(
      // Wrap promise rejection errors
      catchError((err) => throwError(() => wrapError(err))),
      // Flatten the inner observable and wrap its errors
      switchMap((inner) => inner.pipe(catchError((err) => throwError(() => wrapError(err))))),
    );
  };
}
