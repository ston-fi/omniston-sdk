// @ts-check

import { defineConfig } from "tsup";

export default defineConfig({
  entryPoints: ["src/index.ts"],
  format: ["cjs", "esm"],
  outDir: "dist",
  dts: true,
  clean: true,
  sourcemap: true,
});
