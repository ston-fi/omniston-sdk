import { StonApiClient } from "@ston-fi/api";

export const stonApiClient = new StonApiClient({
  baseURL: process.env.OMNIDEMO__STON_API ?? "https://api.ston.fi",
});

export type { StonApiClient } from "@ston-fi/api";
