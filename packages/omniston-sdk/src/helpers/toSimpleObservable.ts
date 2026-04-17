import type { Observable } from "rxjs";

import type { Observable as SimpleObservable } from "../types/observable";

/**
 * Converts RxJS Observable to SimpleObservable
 *
 * Narrows the RxJS Observable type to avoid exposing the whole RxJS API.
 * This allows us to change the implementation without breaking the public API in the future.
 */
export function toSimpleObservable<T, TArgs extends Array<unknown>, TReturn>(
  originalMethod: (this: T, ...args: TArgs) => Observable<TReturn>,
): (this: T, ...args: TArgs) => SimpleObservable<TReturn> {
  return function (this: T, ...args: TArgs): SimpleObservable<TReturn> {
    const observable = originalMethod.apply(this, args);

    return {
      subscribe(cb) {
        const subscription = observable.subscribe(cb);

        return {
          unsubscribe: subscription.unsubscribe.bind(subscription),
        };
      },
    };
  };
}
