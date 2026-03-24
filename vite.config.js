import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  server: {
    host: "127.0.0.1",
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        qubitCircuitBuilder: resolve(
          __dirname,
          "projects/qubit-circuit-builder/index.html"
        ),
      },
    },
  },
});
