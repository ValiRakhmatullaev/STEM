import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Доступ с телефона в той же Wi‑Fi сети: http://<LAN-IP>:5173
    host: true,
    proxy: {
      "/api": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/admin": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/media": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/checkin": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/checkins-simple": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/health": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/ckeditor": { target: "http://127.0.0.1:8000", changeOrigin: true },
    },
  },
});
