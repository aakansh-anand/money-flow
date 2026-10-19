import swc from "unplugin-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    // esbuild can't emit decorator metadata — Nest DI needs it.
    // tsconfigFile: false — stop swc rewriting "@/" paths itself;
    // vite-tsconfig-paths owns alias resolution.
    swc.vite({
      tsconfigFile: false,
      // ESM output — CJS require() would bypass vite's alias resolution.
      module: { type: "es6" },
      jsc: {
        parser: { syntax: "typescript", decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
      },
    }),
  ],
  test: {
    include: ["test/**/*.e2e-spec.ts"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
