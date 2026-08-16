import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ mode }) => {
  // GitHub Pages serves the site from https://<user>.github.io/<repo>/, not the
  // domain root, so the static build needs that repo name as its base path.
  // GITHUB_REPOSITORY (owner/repo) is set automatically by GitHub Actions.
  const repo = process.env.GITHUB_REPOSITORY?.split("/")[1];
  const base = mode === "static" && repo ? `/${repo}/` : "/";

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      visualizer({
        open: mode !== "static",
        filename: "dist/stats.html",
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    server: {
      proxy: {
        "/api": "http://127.0.0.1:5000",
      },
    },
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  };
});
