// configuracion de vite del panel

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // compilado se sirve en d.iboardings.net/admin, en local en la raiz
  base: command === "build" ? "/admin/" : "/",
}))
