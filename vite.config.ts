import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'gsap', 'lucide-react'],
          'table-vendor': ['@tanstack/react-table', 'recharts'],
          'state-vendor': ['@reduxjs/toolkit', 'react-redux', 'redux-saga', 'redux-persist'],
          'xlsx-vendor': ['xlsx']
        }
      }
    }
  },
  server: {
    host: "::",
    port: 5173,
    strictPort: true,
    allowedHosts: true,
  },
  preview: {
    host: "::",
    port: 5173,
    strictPort: true,
  },
});
