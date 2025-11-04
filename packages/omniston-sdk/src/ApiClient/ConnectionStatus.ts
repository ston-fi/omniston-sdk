/**
 * An event when a transport initiates connection to a server.
 */
export interface ConnectionConnectingEvent {
  status: "connecting";
}

/**
 * An event when a transport successfully connects to a server.
 */
export interface ConnectionConnectedEvent {
  status: "connected";
}

/**
 * An event when the client starts closing the connection.
 */
export interface ConnectionClosingEvent {
  status: "closing";
}

/**
 * An event when the connection is closed by the client.
 */
export interface ConnectionClosedEvent {
  status: "closed";
}

/**
 * An event when the server closes the connection or refuses the connection.
 */
export interface ConnectionErrorEvent {
  status: "error";
  errorMessage: string;
  isReconnecting?: boolean;
}

/**
 * An event when connection status has changed.
 */
export type ConnectionStatusEvent =
  | ConnectionConnectingEvent
  | ConnectionConnectedEvent
  | ConnectionClosingEvent
  | ConnectionClosedEvent
  | ConnectionErrorEvent;

/**
 * Connection status.
 *
 * - `ready`: The transport is ready to connect.
 * - `connecting`: The transport is connecting to a server.
 * - `connected`: The transport has connected to a server. Can send and receive messages.
 * - `closing`: The client is closing the connection.
 * - `closed`: The client has closed the connection.
 * - `error`: Could not connect to a server, or server closed the connection.
 */
export type ConnectionStatus = "ready" | ConnectionStatusEvent["status"];
