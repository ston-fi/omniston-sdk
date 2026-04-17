import {
  type ConnectionStatus,
  useConnectionStatus,
  useOmniston,
} from "@ston-fi/omniston-sdk-react";

import { Badge } from "@/components/ui/badge";

export function ConnectionStatus() {
  const connectionStatus = useConnectionStatus();
  const omniston = useOmniston();

  return (
    <Badge
      key={connectionStatus}
      role="button"
      variant={getBadgeVariant(connectionStatus)}
      className="animate-in fade-in-0 zoom-in-95 duration-200"
      onClick={() => omniston.transport.reconnect()}
    >
      {connectionStatus}
    </Badge>
  );
}

function getBadgeVariant(connectionStatus: ConnectionStatus) {
  switch (connectionStatus) {
    case "connected":
      return "default";
    case "error":
      return "destructive";
    default:
      return "secondary";
  }
}
