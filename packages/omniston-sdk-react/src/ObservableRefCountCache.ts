import type { QueryKey } from "@tanstack/react-query";
import { ObservableRefCount } from "./ObservableRefCount";
import type { Observable } from "rxjs";

export class ObservableRefCountCache {
  private readonly cache = new Map<string, ObservableRefCount>();

  getOrCreate(
    key: QueryKey,
    createObservable: () => Observable<unknown>,
  ): ObservableRefCount {
    const keyStr = JSON.stringify(key);
    let result = this.cache.get(keyStr);
    if (!result) {
      result = new ObservableRefCount(createObservable);
      this.cache.set(keyStr, result);
    }
    return result;
  }
}
