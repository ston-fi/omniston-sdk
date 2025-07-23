import {
  type ConnectionStatus,
  useConnectionStatus,
} from "@ston-fi/omniston-sdk-react";

import { Badge } from "@/components/ui/badge";

export function ConnectionStatus() {
  const connectionStatus = useConnectionStatus();

  return (
    <Badge variant={getBadgeVariant(connectionStatus)}>
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
