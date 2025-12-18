import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ['aframe'],
  },
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  build: {
    rollupOptions: {
      external: (id) => {
        // Externalize aframe dependencies that cause issues
        if (id.includes('three-dev') || id.includes('aframe-core/lib/three.js')) {
          return true;
        }
        return false;
      },
    },
  },
});
