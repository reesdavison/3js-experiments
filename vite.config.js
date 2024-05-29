// vite.config.js
import { resolve } from "path";
import { defineConfig } from "vite";
import { sync } from "glob";

export default defineConfig({
  root: resolve(__dirname, "src"),
  base: "/3js-experiments/",
  // base: "/",
  // optimizeDeps: {
  //   include: ["three"],
  // },
  build: {
    outDir: resolve(__dirname, "dist"),
    // commonjsOptions: {
    //   include: ["three", "/node_modules/"],
    // },
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
        // multiBall: resolve(__dirname, "src/views/multiBall.html"),
        // multiBall2: resolve(__dirname, "src/views/multiBall2.html"),
        ...Object.fromEntries(
          sync(resolve(__dirname, "src/views", "*.html")).map((path) => [
            path.split("/").at(-1).split(".html")[0],
            path,
          ])
        ),
      },
      // input: {
      //   main: resolve(__dirname, "src/index.html"),
      // input: Object.fromEntries(sync(resolve(__dirname, "src/views", "*.html")),

      // },
      // output: {
      // format: "es",
      // dir: "dist",
      // },
      // output: {
      //   main: resolve(__dirname, "dist"),
      // },
    },
  },
  // resolve: {
  //   alias: {
  //     three: 'web3/dist/web3.min.js',
  //   },
  // }
});
