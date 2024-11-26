import { createContext } from "react";

import type { ObservableRefCountCache } from "./ObservableRefCountCache";

export const ObservableRefCountCacheContext =
  createContext<ObservableRefCountCache>({} as ObservableRefCountCache);
