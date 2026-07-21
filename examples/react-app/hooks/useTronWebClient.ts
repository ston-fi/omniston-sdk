import { useCallback, useRef } from "react";
import { TronWeb } from "tronweb";

import { useAppConfig } from "~/providers/config";

export function useTronWebClient() {
  const { tronConfig } = useAppConfig();
  const clientRef = useRef<TronWeb | undefined>(undefined);

  const getTronWebClient = useCallback(() => {
    if (!clientRef.current) {
      clientRef.current = new TronWeb({
        fullHost: tronConfig.rpcUrl,
      });
    }

    return clientRef.current;
  }, [tronConfig]);

  return getTronWebClient;
}
