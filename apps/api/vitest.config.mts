import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    // esbuild can't emit decorator metadata — Nest DI needs it.
    // tsconfigFile: false — vite-tsconfig-paths owns "@/" alias resolution.
    swc.vite({
      tsconfigFile: false,
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
