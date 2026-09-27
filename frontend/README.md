# PawFinder · Frontend

Interfaz web para registrar perritos de la calle: foto, nombre, raza, colores y ubicación en el mapa.
Pensada primero para celular (se usa en la calle) y adaptada a computadora.

> Este documento cubre sólo el frontend. El `README.md` de la raíz del repositorio es el oficial
> del proyecto; de aquí se pueden copiar las secciones del frontend.
> El contrato con el backend está en [`../docs/contrato-api.md`](../docs/contrato-api.md).

## Tecnologías y versiones exactas

| Pieza | Versión | Para qué |
|---|---|---|
| Node.js | 22.22.2 (LTS; cualquier ≥ 22.12 funciona, también 24 LTS) | Correr las herramientas |
| npm | 10.9.7 (viene con Node) | Instalar dependencias |
| TypeScript | 6.0.3 | Lenguaje |
| React / React DOM | 19.3.0 | Interfaz |
| React Router | 8.4.0 | Pantallas y URLs |
| Vite | 8.3.0 | Servidor de desarrollo y compilación |
| Tailwind CSS (+ `@tailwindcss/vite`) | 4.3.3 | Estilos con clases utilitarias |
| Leaflet / React Leaflet | 1.9.4 / 5.0.0 | Mapa (mosaicos de OpenStreetMap con respaldo automático, **sin llave de API**) |
| lucide-react | 1.47.0 | Íconos |
| @fontsource-variable/nunito | 5.3.0 | Tipografía (incluida en el proyecto, no depende de internet) |
| Vitest | 5.0.1 | Pruebas |
| oxlint | 1.85.0 | Revisión de estilo de código |

Las versiones están fijas en `package.json` (sin `^`) y en `package-lock.json`. No se usa Docker.

## Instalación

Desde la raíz del repositorio:

```bash
cd frontend
npm ci
```

> **Windows con PowerShell:** si aparece *"npm.ps1 cannot be loaded because running scripts is disabled
> on this system"*, usar `npm.cmd` en lugar de `npm` (`npm.cmd ci`, `npm.cmd run dev`) o abrir la
> terminal **cmd** (Símbolo del sistema), donde `npm` funciona normal.

Copiar la configuración de ejemplo:

```bash
# Linux / macOS / Git Bash
cp .env.example .env.local
# Windows (cmd o PowerShell)
copy .env.example .env.local
```

## Ejecutar

```bash
npm run dev
```

Abre <http://localhost:5173>.

Con `VITE_USAR_MOCKS=true` (valor de ejemplo) la app usa **datos de prueba en memoria** y no necesita
backend. En el encabezado aparece la etiqueta "Datos de prueba" para que no se confunda con datos reales.

### Conectarlo con el backend

1. Levantar el backend (ver su sección del README).
2. En `.env.local`: `VITE_USAR_MOCKS=false` y `BACKEND_URL` con la dirección del backend
   (por ejemplo `http://localhost:3000`).
3. Reiniciar `npm run dev`.

El navegador siempre pide a `/api/...` y Vite reenvía esas peticiones a `BACKEND_URL` (proxy).
Por eso **el backend debe exponer todos sus endpoints bajo `/api`** y no hace falta configurar CORS
en desarrollo.

## Configuración

| Variable | Ejemplo | Qué hace |
|---|---|---|
| `VITE_API_URL` | `/api` | URL base de la API vista desde el navegador. Dejarla en `/api`. |
| `VITE_USAR_MOCKS` | `true` | `true` = datos de prueba en memoria; `false` = backend real. |
| `BACKEND_URL` | `http://localhost:3000` | A dónde reenvía el proxy de Vite las peticiones `/api`. Sólo lo lee `vite.config.ts`. |
| `VITE_MAPA_CENTRO` | `19.4326,-99.1332` | Centro inicial del mapa (latitud,longitud). |
| `VITE_MAPA_ZOOM` | `13` | Zoom inicial del mapa. |
| `VITE_MAPA_MOSAICOS_URL` | _(vacío)_ | Opcional. Otro proveedor de mapas; vacío = OpenStreetMap. |
| `VITE_MAPA_MOSAICOS_CREDITOS` | _(vacío)_ | Opcional. Créditos que exige ese proveedor. |

El frontend no guarda contraseñas ni llaves: todo lo que empieza con `VITE_` termina visible en el navegador.

## Probarlo desde un celular en la misma red

El navegador sólo da **cámara y ubicación** en `https` o en `localhost`. Desde el celular no es
`localhost`, así que hay un modo con HTTPS:

```bash
npm run dev:red
```

1. La terminal muestra algo como `Network: https://192.168.1.50:5173/`. Abrir esa dirección en el celular
   (celular y computadora en la **misma red Wi-Fi**).
2. El navegador avisará que el certificado no es de confianza (es autofirmado): elegir
   *Avanzado → Continuar*. Es normal en desarrollo.
3. Si no carga: en Windows, permitir a Node.js en el Firewall cuando lo pregunte (redes privadas).

El backend puede quedarse en `localhost` de la computadora: el celular sólo habla con Vite y Vite
le reenvía las peticiones.

## Mapa: de dónde salen las imágenes

| Proveedor | ¿Llave? | Uso en la app |
|---|---|---|
| OpenStreetMap (`tile.openstreetmap.org`) | No | Principal. Exige créditos visibles y que el navegador envíe de qué sitio viene la petición (ya configurado). |
| OSM Francia, estilo humanitario (`tile.openstreetmap.fr/hot`) | No | Respaldo automático: si el principal no carga (servidor caído o red que lo bloquea), el mapa cambia solo. |

Funciona igual en computadora y en celular, incluido el modo `npm run dev:red` con HTTPS.

Si algún día se necesita otro proveedor (por ejemplo MapTiler o Stadia Maps, que piden cuenta gratuita),
se pone su URL en `VITE_MAPA_MOSAICOS_URL` y sus créditos en `VITE_MAPA_MOSAICOS_CREDITOS` dentro de
`.env.local`; si la URL lleva llave, **no se sube al repositorio**. No se recomienda CARTO: sus mapas de este
tipo ahora piden llave y los están retirando.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en <http://localhost:5173> |
| `npm run dev:red` | Igual, con HTTPS y accesible desde otros dispositivos de la red |
| `npm run build` | Revisa tipos y genera la versión de producción en `dist/` |
| `npm run preview` | Sirve `dist/` para probar la versión de producción |
| `npm test` | Pruebas automáticas (se agregan con el formulario) |
| `npm run lint` | Revisión de código |
| `npm run typecheck` | Sólo revisión de tipos |

## Producción

`npm run build` genera archivos estáticos en `dist/`. En el servidor, el proxy inverso (nginx o Caddy)
sirve `dist/` y reenvía `/api` al backend en el mismo dominio. Ejemplo con Caddy:

```
perritos.ejemplo.com {
    handle /api/* {
        reverse_proxy localhost:3000
    }
    handle {
        root * /srv/perritosdb/frontend/dist
        try_files {path} /index.html
        file_server
    }
}
```

`try_files ... /index.html` es necesario porque las rutas como `/perritos/7` las resuelve React en el
navegador. Caddy obtiene el certificado HTTPS automáticamente.

## Estilos (Tailwind CSS)

- Los colores, la tipografía, los radios y las sombras están en `src/styles/global.css`, dentro de `@theme`.
  De ahí salen clases como `bg-primario`, `text-texto-suave`, `rounded-tarjeta` o `shadow-tarjeta`.
- Los botones (`boton`, `boton--primario`, `boton--secundario`…) se definen una vez con `@apply`.

## Estructura

```
frontend/
├── index.html                Viewport responsivo, título
├── vite.config.ts            Proxy /api y modo HTTPS para celular
├── .env.example              Variables de configuración (copiar a .env.local)
└── src/
    ├── main.tsx              Punto de entrada
    ├── App.tsx               Rutas: qué pantalla va en cada URL
    ├── config.ts             Lee las variables de entorno
    ├── api/
    │   ├── tipos.ts          Contrato con el backend (tipos de datos)
    │   ├── http.ts           Cliente real (fetch) con URL base VITE_API_URL
    │   ├── errores.ts        Errores → mensajes entendibles ("Falta la foto", no "Error 400")
    │   ├── mock/             Datos de prueba en memoria
    │   └── index.ts          Elige real o prueba según VITE_USAR_MOCKS
    ├── pages/                Una pantalla por archivo (por ahora, esqueletos)
    │   ├── MapaPage.tsx      /             Mapa con un pin por perrito
    │   ├── ListaPage.tsx     /perritos     Lista con miniaturas
    │   ├── DetallePage.tsx   /perritos/:id Detalle de un registro
    │   └── RegistrarPage.tsx /registrar    Formulario
    ├── components/           Encabezado, navegación y mensajes de estado
    └── styles/global.css     Tailwind: colores del tema (@theme), botones y medidas compartidas
```

Las pantallas nunca llaman a `fetch` directamente: usan `api` de `src/api`. Cuando el backend cambie
algo del contrato, sólo se toca `src/api/`.

## Problemas comunes

| Síntoma | Causa y solución |
|---|---|
| "No pudimos conectar con el servidor" | El backend no está corriendo, `BACKEND_URL` está mal, o `VITE_USAR_MOCKS=false` sin backend. |
| "La ubicación sólo funciona si la página se abre con https" | Se abrió por `http://IP:5173`. Usar `npm run dev:red` y la dirección `https://`. |
| El celular no abre la página | Misma red Wi-Fi; permitir Node.js en el firewall; usar la IP que muestra la terminal. |
| El mapa se ve gris | No hay internet o la red bloquea `tile.openstreetmap.org`. |
| El mapa dice "API KEY REQUIRED" | Se está usando un proveedor que pide llave (por ejemplo CARTO). Dejar `VITE_MAPA_MOSAICOS_URL` vacía para usar OpenStreetMap. |
| "No diste permiso para usar tu ubicación" | Permitirla en el candado de la barra de direcciones → Ubicación. En Windows, además: Configuración → Privacidad y seguridad → Ubicación, activada para el navegador. |
| "Tomar foto" abre el explorador en la computadora | Normal: el atributo `capture` sólo abre la cámara en celulares. |
| PowerShell: *"npm.ps1 cannot be loaded… running scripts is disabled"* | Windows bloquea scripts `.ps1`. Usar `npm.cmd ci` / `npm.cmd run dev`, o la terminal cmd. Para quitarlo en tu usuario: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`. |
| `npm ci` falla por versión de Node | Instalar Node 22.12 o más nuevo (`node -v` para revisar). |
| Puerto 5173 ocupado | Vite usará el siguiente libre (5174…); revisar la URL que imprime. |

## Capturas de pantalla

_Pendiente: agregar capturas en celular con datos reales (mapa, lista, detalle, formulario con errores)._
