import type { IApiClient } from "../ApiClient/ApiClient.types";

/**
 * Dependencies used to construct an Omniston instance.
 *
 * {@see Omniston}
 */
export interface IOmnistonDependencies {
  /**
   * Optional. Provide this if you want to override the default API client.
   * By default, this will be an {@link ApiClient} using {@link ReconnectingTransport}
   */
  readonly client?: IApiClient;
  /**
   * Omniston WebSocket API URL.
   *
   * {@example `https://omni.ston.fi/ws`}
   */
  readonly apiUrl: URL | string;
}
