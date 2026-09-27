import basicSsl from '@vitejs/plugin-basic-ssl'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Lee .env, .env.local, etc. (incluye variables sin el prefijo VITE_, sólo aquí en Node).
  const env = loadEnv(mode, process.cwd(), '')
  const urlBackend = env.BACKEND_URL || 'http://localhost:3000'

  // Todo lo que empiece con /api se reenvía al backend. Así el navegador sólo habla con
  // un origen (el de Vite): no hay problemas de CORS ni de mezclar http con https.
  const proxy = {
    '/api': { target: urlBackend, changeOrigin: true },
  }

  return {
    // En modo "red" (npm run dev:red) se sirve con HTTPS para que el celular permita
    // usar la ubicación. El certificado es autofirmado: el navegador mostrará una advertencia.
    plugins: [react(), tailwindcss(), ...(mode === 'red' ? [basicSsl()] : [])],
    server: { proxy },
    preview: { proxy },
  }
})
