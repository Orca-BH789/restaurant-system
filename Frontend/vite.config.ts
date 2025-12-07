import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'



// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    https: false,
    port: 5173,
    host: true,
    allowedHosts: ["webdemocuahangtraicay.io.vn"]
  }
})
