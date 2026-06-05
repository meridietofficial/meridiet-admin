import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // The S3 upload endpoint used to be a Next.js API route. It now lives in
      // the small Express server under /server. Forward it during dev.
      "/api/upload-image": "http://localhost:5050",
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Use Sass's modern compiler API (silences the legacy-js-api warning).
        api: "modern-compiler",
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
      },
    },
  },
});
