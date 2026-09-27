// Punto de entrada: carga estilos globales y monta la aplicación en <div id="root">.
import '@fontsource-variable/nunito'
import 'leaflet/dist/leaflet.css'
import './styles/global.css'
import './components/mapa/mapa.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
