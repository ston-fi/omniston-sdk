import type { OmnistonError } from "../omniston/OmnistonError";

type Unsubscribable = { unsubscribe: () => void };
type ObjSubscriber<T> = {
  next?: (value: T) => void;
  error?: (err: OmnistonError) => void;
  complete?: () => void;
};
type FnSubscriber<T> = (value: T) => void;

export interface Observable<T> {
  subscribe(cb?: ObjSubscriber<T>): Unsubscribable;
  subscribe(cb?: FnSubscriber<T>): Unsubscribable;
  subscribe(cb?: ObjSubscriber<T> | FnSubscriber<T>): Unsubscribable;
}
