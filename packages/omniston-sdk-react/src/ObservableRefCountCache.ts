import type { QueryKey } from "@tanstack/react-query";

import { ObservableRefCount } from "./ObservableRefCount";

export class ObservableRefCountCache {
  private readonly cache = new Map<string, ObservableRefCount>();

  getOrCreate(
    key: QueryKey,
    createObservable: ConstructorParameters<typeof ObservableRefCount>[0],
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
