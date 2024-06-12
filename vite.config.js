// vite.config.js
import { resolve } from "path";
import { defineConfig } from "vitest/config";
import { sync } from "glob";

export default defineConfig({
  root: resolve(__dirname, "src"),
  base: "/3js-experiments/",
  build: {
    outDir: resolve(__dirname, "dist"),
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
        ...Object.fromEntries(
          sync(resolve(__dirname, "src/views", "*.html")).map((path) => [
            path.split("/").at(-1).split(".html")[0],
            path,
          ])
        ),
      },
    },
  },
  test: {
    globals: true,
    // NB We have set the root as src as it needs to be where
    // index.html is to make `vite preview` work
    // important we reference relative to that here
    include: ["../**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    exclude: [],
  },
});
