export function memoizePromise<T>(fn: () => Promise<T>): () => Promise<T> {
  let cache: Promise<T> | null = null;

  return () => {
    if (!cache) {
      cache = fn();
    }
    return cache;
  };
}
