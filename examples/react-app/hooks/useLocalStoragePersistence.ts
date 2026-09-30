"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { z } from "zod";

type LocalStoragePersistenceOptions<T> = {
  key: string;
  schema: z.ZodType<T>;
  value: T;
  onRestore: (value: T) => void;
};

export function useLocalStoragePersistence<T>({
  key,
  schema,
  value,
  onRestore,
}: LocalStoragePersistenceOptions<T>) {
  const [hydrated, setHydrated] = useState<{
    key: string;
    schema: z.ZodType<T>;
  } | null>(null);

  const restore = useEffectEvent(onRestore);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        const parsed = schema.safeParse(JSON.parse(stored));
        if (parsed.success) restore(parsed.data);
      }
    } catch {
      // Keep the current value when storage is unavailable or corrupt.
    } finally {
      setHydrated({ key, schema });
    }
  }, [key, schema]);

  useEffect(() => {
    // Wait for the render containing the restored value before saving.
    if (hydrated?.key !== key || hydrated.schema !== schema) return;

    try {
      localStorage.setItem(key, JSON.stringify(z.encode(schema, value)));
    } catch {
      // State remains usable when validation or storage writes fail.
    }
  }, [key, schema, value, hydrated]);
}
