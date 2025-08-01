import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  base: '/nua/',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3001, // İstediğin başka bir port numarası
    host: "localhost", // veya 0.0.0.0 (başka cihazlardan erişim gerekiyorsa)
  },
})
