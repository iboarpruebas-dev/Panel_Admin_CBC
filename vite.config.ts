// configuracion de vite del panel

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // compilado se sirve en d.iboardings.net/admin, en local en la raiz
  base: command === "build" ? "/admin/" : "/",
  // react-admin importa query-string con nombre y la 9 solo exporta por defecto, ver src/puentes/queryString.js
  resolve: {
    alias: [{ find: /^query-string$/, replacement: fileURLToPath(new URL('./src/puentes/queryString.js', import.meta.url)) }],
  },
}))
