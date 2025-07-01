import type { ConnectionStatus } from "@ston-fi/omniston-sdk";
import { useSyncExternalStore } from "react";
import { useOmniston } from "./useOmniston";

export function useConnectionStatus(): ConnectionStatus {
  const omniston = useOmniston();

  return useSyncExternalStore(
    (onStoreChange) => {
      const subscription =
        omniston.connectionStatusEvents.subscribe(onStoreChange);

      return () => subscription.unsubscribe();
    },
    () => omniston.connectionStatus,
    () => "ready",
  );
}
