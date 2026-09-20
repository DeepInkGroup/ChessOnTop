import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? "/ChessOnTop/" : "/",
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const path = id.replaceAll("\\", "/");
          const volume = path.match(/src\/data\/openings-([a-e])\.json$/);
          if (volume) return `catalog-${volume[1]}`;
          if (path.includes("node_modules")) return "vendor";
        },
      },
    },
  },
});
