import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteCompression from "vite-plugin-compression";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  base: "/energy-grid/",
  plugins: [
    react(),
    viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 1024,
    }),
    visualizer({
      open: true,
      filename: "dist/stats.html",
    }),
  ],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "apollo-client": ["@apollo/client"],
          "chart-js": ["chart.js", "chartjs-plugin-annotation"],
        },
      },
    },
  },
});
