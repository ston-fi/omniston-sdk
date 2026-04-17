import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts"],
  platform: "browser",
  format: ["cjs", "esm"],
  dts: true,
  exports: true,
  publint: true,
  attw: true,
  banner: {
    /**
     * Marks the entire bundle as a React Client Module.
     * This satisfies Next.js App Router (RSC) requirements without scattering
     * "use client" across individual source files, ensuring uniform coverage
     * of all hooks and providers that rely on client-only React APIs.
     */
    js: '"use client";',
  },
});
