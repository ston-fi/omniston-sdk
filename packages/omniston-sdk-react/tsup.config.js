// @ts-check

import { defineConfig } from "tsup";

export default defineConfig({
  entryPoints: ["src/index.ts"],
  format: ["esm"],
  outDir: "dist",
  dts: true,
  clean: true,
  sourcemap: true,
});
