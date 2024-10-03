"use client";

import { useContext } from "react";

import { OmnistonContext } from "./OmnistonProvider";

/**
 * @returns an {@link Omniston} instance.
 */
export function useOmniston() {
  const Omniston = useContext(OmnistonContext);

  if (!Omniston) {
    throw new Error("useOmniston hook must be used within an OmnistonProvider");
  }

  return Omniston;
}
