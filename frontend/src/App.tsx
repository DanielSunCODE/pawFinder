// Rutas de la aplicación: qué pantalla se muestra en cada URL.
import { BrowserRouter, Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { DetallePage } from './pages/DetallePage'
import { ListaPage } from './pages/ListaPage'
import { MapaPage } from './pages/MapaPage'
import { NoEncontradaPage } from './pages/NoEncontradaPage'
import { RegistrarPage } from './pages/RegistrarPage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<MapaPage />} />
          <Route path="perritos" element={<ListaPage />} />
          <Route path="perritos/:id" element={<DetallePage />} />
          <Route path="registrar" element={<RegistrarPage />} />
          <Route path="*" element={<NoEncontradaPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
