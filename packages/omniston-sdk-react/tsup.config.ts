// @ts-ignore - esbuild-analyzer package is not typed
import AnalyzerPlugin from "esbuild-analyzer";
import { defineConfig } from "tsup";

export default defineConfig({
  entryPoints: ["src/index.ts"],
  format: ["esm"],
  outDir: "dist",
  dts: true,
  clean: true,
  sourcemap: true,
  esbuildPlugins: [
    AnalyzerPlugin({
      outfile: "./build-report.html",
    }),
  ],
});
