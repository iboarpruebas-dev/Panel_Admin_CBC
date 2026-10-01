import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // compilado se sirve en d.iboardings.net/admin; en local sigue en la raiz
  base: command === "build" ? "/admin/" : "/",
}))
