# Guía de estudio — cómo funciona PawFinder y cómo defender el frontend y el backend

Documento personal de preparación para la demostración. Está basado en el código real, en el
`README.md`, en `MASTER_PROMPT.md` y en `proyecto1-perritos.pdf`. Las rutas son relativas a la raíz del repo.

---

## Parte 1 — El sistema completo

### 1.1 En una frase

Una app web (celular primero) donde alguien registra un perrito de la calle con **foto, nombre, apariencia y un pin en el
mapa**; el registro aparece en un **mapa**, una **lista** y un **detalle**. Reenviar el formulario **no duplica** nada
(idempotencia).

### 1.2 Las 4 piezas y cómo se hablan

```
Celular/PC ──HTTPS──► FRONTEND (React+Vite, Vercel)
                          │  fetch("/api/...")
                          ▼
                     BACKEND (Express+TS, Render) ──SQL+TLS──► MySQL (local / Aiven)
                          │
                          └──guardar/leer binario──► Storage (carpeta RUTA_IMAGENES o bucket S3)
Frontend ─ - - ► OpenStreetMap (mosaicos del mapa, sin llave)
```

- El navegador **solo habla con `/api`**. En desarrollo, Vite reenvía `/api` al backend (proxy en
  `frontend/vite.config.ts`), por eso no hay problemas de CORS ni de mezclar http/https.
- El backend **no confía en el cliente**: valida todo otra vez con Zod.
- La base **no se expone a internet**; solo el backend le habla.
- Las fotos **no viven junto al código**: se guardan fuera del proyecto (o en S3 privado) y se sirven únicamente por
  `GET /api/perritos/{id}/foto`.

### 1.3 Ciclo de vida de un registro (de punta a punta)

1. Se abre `/registrar`. El frontend carga los **4 catálogos en paralelo** (razas, colores, colores de ojos, patrones) y
   **genera un UUID** = clave de idempotencia (una sola vez).
2. La persona toma/sube la foto → el frontend **detecta el tipo real por magic bytes**, y si pesa > 1.5 MB la **reduce a 1600 px
   y la recomprime a JPG 0.85** (`utils/imagen.ts`).
3. Llena el formulario y marca la ubicación. Al enviar, `validarRegistro` revisa todo. Si hay errores, no se envía y se
   lleva al usuario al primer campo con error.
4. Si pasa, se hace `POST /api/perritos` como `multipart/form-data` con el header `Idempotency-Key`.
5. **Backend** (`backend/src/routes/perritos.ts`): (a) exige la clave; (b) **busca si esa clave ya existe → si sí, devuelve
   el mismo perrito** con 201 sin validar ni guardar nada; (c) si no, valida con Zod; (d) valida la foto por magic bytes
   (`file-type`); (e) la comprime con `sharp` (quita EXIF/GPS) y la guarda con nombre generado por el backend; (f) en una
   **transacción** inserta `perros`, `perro_colores` (el principal con `es_dominante=1`) e `idempotencia`.
6. El frontend recibe el perrito y navega a `/perritos/:id?nuevo=1` con `replace: true` (no se puede volver al formulario
   con "atrás"). Aparece el cartel "¡Listo! X quedó registrado".
7. El mapa (`/`) y la lista (`/perritos`) piden `GET /api/perritos` y lo muestran.

### 1.4 Base de datos (resumen)

| Tabla | Para qué |
|---|---|
| `razas`, `colores`, `colores_ojos`, `patrones_pelaje` | Catálogos (26 razas, 12 colores, 6 ojos, 18 patrones) |
| `perros` | Entidad principal; `ruta_imagen` es UNIQUE; `fecha_registro` = `CURRENT_TIMESTAMP` (la pone MySQL) |
| `perro_colores` | N:M perro↔color; `es_dominante=1` marca el principal |
| `idempotencia` | PK `idempotency_key` → `id_perro`. La PK es lo que impide el duplicado incluso en carreras |

Hay 16 perritos de prueba (la consigna pide ≥ 15 con foto, ≥ 10 razas y ≥ 10 colores).

### 1.5 API (lo que consume el frontend)

Éxito `{ "data": ... }`; error `{ "error": { "message", "details": [{ "field", "message" }] } }`.

| Endpoint | Lo usa |
|---|---|
| `GET /api/perritos?busqueda=&colorId=&razaId=` | Mapa (sin filtros) y Lista (con filtros) |
| `GET /api/perritos/{id}` | Detalle |
| `POST /api/perritos` (+ `Idempotency-Key`) | Formulario |
| `GET /api/perritos/{id}/foto` | Todas las `<img>` |
| `GET /api/razas`, `/colores`, `/colores-ojos`, `/patrones-pelaje` | Formulario y filtros de la lista |

### 1.6 Los paradigmas (qué se revisa explícitamente)

| Paradigma | Backend | Frontend |
|---|---|---|
| **Declarativo** | SQL: `JOIN` en `SELECT_PERRITO`, `EXISTS` para el filtro por color, `ORDER BY`, `GROUP BY` en estadísticas | JSX + Tailwind: "si error → muestra error; si no hay datos → cargando; si no → cuadrícula" |
| **Imperativo** | `app.ts`, `index.ts` (orquestar el arranque) | `utils/imagen.ts` (pasos sobre un canvas), `utils/reintentos.ts` (ciclo `for`) |
| **Orientado a objetos** | `StorageDriver` (local/s3), `HttpError` | `class ErrorApi extends Error`, `class ErrorFoto`, `class ErrorUbicacion` |
| **Funcional** | `aPerritoApi` (find/filter/map), `agrupar` con `reduce` | `validarRegistro` (map→filter→reduce), `coordenadasDe`, `conHex`, `aQueryString`, `camposDesdeDetalles` |

### 1.7 Idempotencia (la explicación de 30 segundos)

> "Al abrir el formulario generamos un UUID y lo mandamos en el header `Idempotency-Key`. El backend lo guarda en la tabla
> `idempotencia` con la clave primaria. Si llega la misma clave otra vez, devuelve **el mismo perrito, el mismo id, con 201**;
> no crea nada y no responde 'duplicado'. Elegimos clave generada y no natural (nombre+ubicación) porque dos perritos distintos
> pueden llamarse igual y estar en el mismo lugar."

Prueba automatizada: `backend/tests/perritos.test.ts`, caso *"es idempotente…"*.

---

## Parte 2 — El frontend en detalle

### 2.1 Stack y versiones exactas

React 19.3.0 · React Router 8.4.0 · Vite 8.3.0 · TypeScript 6.0.3 · Tailwind 4.3.3 · Leaflet 1.9.4 + react-leaflet 5.0.0 ·
lucide-react 1.47.0 · Nunito (fuente local) · Vitest 5.0.2 · oxlint 1.85.0. Node ≥ 22.12. Versiones fijas (sin `^`).
**42 pruebas en 6 archivos** pasan (`npm run test --workspace @pawfinder/frontend`).

### 2.2 Mapa de archivos (qué hace cada uno)

```
src/
  main.tsx, App.tsx          Punto de entrada y rutas
  config.ts                  Lee variables VITE_ (centro/zoom del mapa, URL de la API, proveedor de mosaicos)
  api/
    tipos.ts                 Tipos: Perrito, NuevoPerrito, Catalogos, ApiPerritos (contrato con el backend)
    http.ts                  ÚNICO lugar con fetch: pedir(), normalizarPerrito(), crearPerrito() (multipart)
    errores.ts               ErrorApi + mensajes en español por código HTTP + esErrorReintentable
    index.ts                 Exporta `api`, lo único que usan las pantallas
  pages/
    MapaPage.tsx             "/"        mapa con un pin por perrito
    ListaPage.tsx            "/perritos" lista + filtros
    DetallePage.tsx          "/perritos/:id"
    RegistrarPage.tsx        "/registrar" formulario (el archivo más importante)
    NoEncontradaPage.tsx     "*" 404
  components/
    Layout.tsx               Encabezado, nav inferior (celular) / menú (PC)
    Estado.tsx               Cargando / MensajeError (con Reintentar) / Vacio
    TarjetaPerrito.tsx       Tarjeta de la lista
    Colores.tsx              Muestras y etiquetas de color
    mapa/MapaBase.tsx        Leaflet con OSM y respaldo automático
    mapa/iconos.ts           Pines (con miniatura) y gota de ubicación
    formulario/              SelectorFoto, SelectorUbicacion, SelectorColores, SelectorOpciones
  hooks/
    useAsync.ts              Pide datos: {datos, cargando, error, reintentar}
    useValorRetrasado.ts     Debounce (350 ms) para el buscador
  utils/
    validacion.ts            Reglas de validación (funcional)
    idempotencia.ts          generarClaveIdempotencia (UUID v4)
    reintentos.ts            conReintentos (imperativo)
    imagen.ts                Magic bytes + reducción de foto
    ubicacion.ts             Geolocalización con mensajes claros
    transformaciones.ts      Funciones puras para mostrar datos
    opciones.ts              Etiquetas en español de valores fijos
    formato.ts               Fechas y coordenadas (Intl, es-MX)
```

**Principio de diseño que conviene decir en voz alta:** *las pantallas nunca llaman a `fetch`; solo usan `api`.* Si el backend
cambia un campo o una ruta, se toca únicamente `src/api/`.

### 2.3 Rutas (React Router)

`App.tsx`: `Layout` envuelve todo con `<Outlet />`. Rutas: `/` (mapa, `index`), `/perritos`, `/perritos/:id`, `/registrar`, `*`.
`Layout` oculta la nav inferior en `/registrar` y le da al mapa el alto completo. En celular hay barra inferior con botón
"Registrar" destacado; en PC (`md:`) hay menú arriba.

### 2.4 Formulario de registro — pieza por pieza

Archivo: `pages/RegistrarPage.tsx`.

**Estado:** `datosEditados` (lo que la persona ha tocado), `claveIdempotencia`, `intentoEnviar`, `erroresServidor`, `enviando`,
`estadoEnvio`, `errorGeneral`.

**Campos (todos obligatorios salvo marcas):** foto, nombre (≤ 60), raza, sexo, edad, tamaño, largo de pelo, patrón, color principal,
0–2 colores adicionales, color de ojos, marcas (opcional, ≤ 500), ubicación. La fecha **no se envía**: la pone el backend.

**Trucos de UX que te pueden preguntar:**

- **Raza por defecto:** si no eligió, se usa "Sin raza definida / Criollo" (`idSinRaza`, buscado por `normalizar(nombre).startsWith('sin raza')`).
  Así cumple la consigna ("debe existir la opción…") y la base puede exigir raza.
- **Errores en vivo tras el primer intento:** `errores = { ...(intentoEnviar ? validarRegistro(...) : {}), ...erroresServidor }`.
  Antes del primer clic no se grita; después se recalcula a cada cambio.
- **`irAlPrimerError`:** busca el primer campo con error según `ORDEN_CAMPOS`, hace `scrollIntoView` y `focus`.
- **Resumen de errores** al final: lista clicable "Todavía no se puede guardar:".
- **Color principal ↔ adicionales:** al elegir principal, si ya estaba como adicional se quita (`elegirColorPrincipal`).
  `alternarColorAdicional` no deja pasar de 2. En `SelectorColores` el chip del principal aparece deshabilitado en adicionales.
- **Patrón "Sólido":** al elegirlo se vacían los adicionales y `soloPrincipal` deshabilita esa sección (pelaje sólido = un solo color).
  Se detecta con `esSolido` (compara nombre normalizado = `'solido'`), no con un id fijo, porque los ids vienen de la base.
- **Inputs:** `noValidate` en el `<form>` (la validación la hace nuestro código, no el navegador), `autoCapitalize="words"`,
  `enterKeyHint`, `aria-invalid`, `aria-describedby` (accesibilidad).

**Flujo de `enviar`:**

```
preventDefault → si enviando: return → setIntentoEnviar(true)
→ validarRegistro → si hay errores: irAlPrimerError y return
→ setEnviando(true)
→ conReintentos(() => api.crearPerrito(datos, foto, clave))   // 3 intentos, misma clave
→ navegar(`/perritos/${id}?nuevo=1`, { replace: true })
catch: si es ErrorApi con campos → mapear con erroresDelServidor y marcar campos; mostrar mensaje general
finally: setEnviando(false)
```

### 2.5 Foto (`SelectorFoto.tsx` + `utils/imagen.ts`)

- **Dos `<input type="file" hidden>`:** uno con `capture="environment"` (abre la cámara trasera en celular) y otro con
  `accept="image/jpeg,image/png,image/webp"` (galería/explorador). En PC ambos abren el explorador: `capture` solo aplica en móviles.
  Así se cumple "las dos opciones deben funcionar".
- También acepta **arrastrar y soltar**.
- `prepararFoto`: (1) `detectarTipoImagen` lee los **primeros 12 bytes** y compara la firma (JPEG `FF D8 FF`, PNG `89 'PNG'`,
  WEBP `'RIFF'…'WEBP'`); un `.jpg` falso se rechaza con "Ese archivo no es una foto JPG, PNG o WEBP". (2) Si ≤ 1.5 MB se sube tal cual;
  si no, `reducir()`: `createImageBitmap(..., {imageOrientation:'from-image'})` → canvas ≤ 1600 px → fondo blanco (por PNG
  transparentes) → `toBlob('image/jpeg', 0.85)`. Si falla y pesa ≤ 10 MB, se sube el original.
- **Por qué reducir en el cliente:** una foto de celular pesa 3–10 MB; reducida ~300 KB, y sube mucho mejor con mala señal.
  (El backend vuelve a validar y comprimir: **no confía en el cliente**.)
- `VistaPrevia` usa `URL.createObjectURL` y lo libera con `revokeObjectURL` en el cleanup del `useEffect` (evita fugas de memoria).
- `evento.target.value = ''` permite volver a elegir el mismo archivo.

### 2.6 Ubicación (`SelectorUbicacion.tsx` + `utils/ubicacion.ts`)

- Tres formas de poner el pin: **botón "Usar mi ubicación actual"** (GPS), **tocar el mapa**, **arrastrar el pin**. Guarda latitud y longitud.
- `obtenerUbicacionActual` verifica `window.isSecureContext` (https/localhost) y `'geolocation' in navigator`, y traduce los códigos de
  error 1/2/3 (permiso denegado / no disponible / tiempo agotado) a mensajes en español. Opciones: `enableHighAccuracy: true`,
  `timeout: 15 s`, `maximumAge: 30 s`.
- Si el permiso ya estaba concedido (`navigator.permissions.query`), usa el GPS automáticamente al abrir.
- `ZoomConRueda`: la rueda del mouse **no atrapa el scroll de la página** (solo hace zoom si la rueda estuvo quieta 350 ms). En el
  celular se usa pellizco.
- `CentrarEn` hace `flyTo` a zoom 17. Muestra "precisión aprox. X m" cuando viene del GPS.

### 2.7 Mapa principal (`MapaPage.tsx`, `mapa/MapaBase.tsx`, `mapa/iconos.ts`)

- **Un `<Marker>` por perrito** con ícono propio: círculo con la **miniatura** y borde del **color principal** (`iconoPerrito`).
  Al tocar → `<Popup>` con **foto, nombre, colores** y botón "Ver detalle" (esto es lo que pide la consigna).
- `iconos.ts` **escapa** (`escapar`) los valores que van a HTML porque Leaflet recibe el ícono como texto HTML → evita inyección de HTML/XSS.
- `useMemo` crea los íconos una sola vez por lista, no en cada render.
- `?perrito=<id>` en la URL (botón "Ver en el mapa" del detalle): centra en ese perrito (zoom 17) y abre su globo. Está en la URL para que
  funcione al recargar o compartir. `EncuadrarPerritos` usa un `useRef` (`yaEncuadrado`) para encuadrar solo la primera vez.
- Si no hay perritos: "Aún no hay perritos registrados" + botón. Si falla: `MensajeError` con Reintentar.
- Botón "Ir a mi ubicación" con `flyTo` y un `CircleMarker` azul.
- **`MapaBase` con respaldo:** mosaicos de OpenStreetMap (sin llave). Si fallan ≥ 4 imágenes **y ninguna había cargado**, cambia solo a
  OSM Francia (HOT). `referrerPolicy="strict-origin-when-cross-origin"` porque OSM exige saber el sitio de origen. Si defines
  `VITE_MAPA_MOSAICOS_URL`, se usa ese y no hay respaldo.

### 2.8 Lista y filtros (`ListaPage.tsx`)

- **El filtrado lo hace MySQL, no el navegador:** los filtros viajan como query params (`busqueda`, `colorId`, `razaId`) a
  `GET /api/perritos`. En el backend: `p.nombre LIKE ?`, `EXISTS (SELECT 1 FROM perro_colores ...)`, `p.id_raza = ?`,
  `ORDER BY p.fecha_registro DESC`. **Ningún `.filter()` sobre los registros** — eso es lo que pide el criterio "Declarativo e imperativo".
- Los filtros se guardan en la **URL** (`useSearchParams`, `replace: true`): al volver del detalle siguen puestos.
  En la URL se llaman `color` y `raza`; hacia la API `colorId` y `razaId`.
- **Debounce** (`useValorRetrasado`, 350 ms): no llama a la API por cada letra.
- Mientras llega la respuesta nueva se **conservan los datos anteriores** (opacidad 60 % + spinner) → la lista no parpadea (`useAsync`).
- Cuatro estados: error → `MensajeError`; sin datos → `Cargando`; 0 resultados → `Vacio` (con "Quitar filtros" o "Registrar el primero"); datos → cuadrícula 2/3/4 columnas.
- `TarjetaPerrito`: miniatura (`loading="lazy"`), nombre, "Raza · Sexo · Edad" (solo lo que se sabe), puntos de color, "hace X".

### 2.9 Detalle (`DetallePage.tsx`)

- `useParams` → id; si no es entero, se rechaza con un `ErrorApi` 404 ("No encontramos lo que buscabas…").
- `caracteristicasDe` arma pares `[título, valor]` y **descarta los `null`** con `filter` + type guard.
- Muestra foto, datos, colores con el principal marcado, fecha (`<time dateTime>` + "hace X"), coordenadas, mini-mapa, **"Ver en el mapa"**
  (`/?perrito=id`) y **"Cómo llegar"** (enlace a Google Maps con `rel="noopener noreferrer"`).
- `?nuevo=1` muestra el cartel de éxito. "Volver" hace `navigate(-1)` solo si hay historial de la app y no es recién registrado; si no, va a `/perritos`.

### 2.10 Capa de API (`api/http.ts`)

- `pedir<T>()`: `fetch` con `AbortSignal.timeout` (15 s consulta / **45 s envío**, porque subir foto con mala señal tarda). Si `fetch` lanza
  → `ErrorApi` con estado `SIN_CONEXION = 0`. Si `!ok` → `errorDesdeRespuesta`. Devuelve `cuerpo.data`.
- `errorDesdeRespuesta`: lee `{ error: { message, details } }`; si no viene JSON (p. ej. 502 del proxy), usa el mensaje por estado.
- `camposDesdeDetalles` convierte `[{field,message}]` → `{campo: mensaje}` con `filter` + `reduce` (funcional).
- `normalizarPerrito` **completa lo que el backend no manda**: `fotoUrl` (si falta, `/perritos/{id}/foto`), `miniaturaUrl` (= foto), `hex` de
  cada color (`conHex`), campos opcionales a `null`, y `Number()` a latitud/longitud porque el `DECIMAL` de MySQL puede llegar como texto.
- `crearPerrito`: arma `FormData` (campos individuales + `foto`), **no fija `Content-Type`** (el navegador agrega el `boundary`), envía el header
  `Idempotency-Key`. `coloresAdicionalesIds` se manda repetido (un `append` por id).
- `cargarCatalogos`: `Promise.all` de los 4 catálogos (en paralelo, no uno tras otro).

### 2.11 Manejo de errores (requisito: "Falta la foto" sí, "Error 400" no)

Tres capas:

1. **Cliente** (`validacion.ts`): mensajes propios — "Falta la foto del perrito.", "Falta el nombre (sólo espacios no cuenta).", "Marca en el mapa dónde viste al perrito."…
2. **Servidor** (`errores.ts`): si el backend responde con `details` por campo, se marcan los campos (`erroresDelServidor` traduce `latitud`/`longitud` → `ubicacion`).
   Si no, `mensajePorEstado` traduce el código: 0 = "No pudimos conectar…", 404, 413 = "La foto pesa demasiado", 415, 429, ≥ 500 = "El servidor tuvo un problema…".
3. **Pantalla** (`Estado.tsx`): `MensajeError` con botón **Reintentar**.

`esErrorReintentable`: solo `0, 502, 503, 504` (red caída o servidor saturado). Un 400 **nunca** se reintenta.

### 2.12 Idempotencia del lado del cliente (tres capas, en orden de importancia)

1. **Clave UUID** — `useState(generarClaveIdempotencia)`. Pasar la **función** (inicializador perezoso) hace que se ejecute **una sola vez**, no en cada render.
   `generarClaveIdempotencia` usa `crypto.randomUUID()` y, si no existe (solo existe en contextos seguros), arma un UUID v4 a mano con `getRandomValues`.
2. **Reintentos con la misma clave** — `conReintentos`: hasta 3 intentos, espera 1 s y 2 s. Es seguro reintentar **solo porque** cada intento lleva la misma clave.
3. **Botón deshabilitado** + `if (enviando) return`. Ojo con esta pregunta trampa: `enviando` es estado de React (asíncrono), así que dos clics muy rápidos en el
   mismo instante podrían pasar la guarda. **Por eso la garantía real es la clave, no el botón.** Lo dice el propio README.

### 2.13 Estilos y responsive

Tailwind 4: colores/radios/sombras en `styles/global.css` dentro de `@theme` (→ clases `bg-primario`, `text-texto-suave`, `rounded-tarjeta`…). Botones definidos una vez con
`@apply` (`boton`, `boton--primario`…). Clases largas del formulario en `formulario/estilos.ts`. Los pines/globos del mapa van en CSS normal (`mapa.css`) porque
Leaflet arma ese HTML. **Mobile-first:** estilos base para celular, `md:`/`lg:` para PC; `100dvh`, `env(safe-area-inset-bottom)` para la barra de gestos.
HTML/CSS/JSX son **declarativos**: describen qué se ve, no cómo dibujarlo.

### 2.14 Hooks propios

- `useAsync(pedirDatos, deps)`: `{datos, cargando, error, reintentar}`. Usa un flag `vigente` en el cleanup para **ignorar respuestas viejas** (si cambias el filtro antes
  de que llegue la respuesta anterior, no la pisa). `reintentar` incrementa un contador que está en las dependencias del efecto.
- `useValorRetrasado(valor, 350)`: debounce con `setTimeout` + `clearTimeout` en el cleanup.

### 2.15 Pruebas del frontend (42, Vitest)

| Archivo | Qué prueba |
|---|---|
| `validacion.test.ts` | Cada regla; que **no muta** la entrada; mapeo de errores del servidor |
| `idempotencia.test.ts` | Formato de UUID y que dos claves difieren |
| `reintentos.test.ts` | Éxito directo; reintenta red; **no reintenta 400**; se rinde tras N; avisa el intento (con timers falsos) |
| `transformaciones.test.ts` | Funciones puras |
| `ubicacion.test.ts`, `formato.test.ts` | Mensajes de geolocalización; fechas/coordenadas |

---

## Parte 3 — El backend en detalle

Todo está en `backend/src/`. Es una API REST con **Express + TypeScript** que valida con **Zod**, habla con **MySQL** por
`mysql2` (SQL escrito a mano, sin ORM) y guarda las fotos fuera de la base.

### 3.1 Stack

Node ≥ 22.12 (ESM: los imports llevan `.js`) · Express 4 · TypeScript 5 · Zod 3 + `@asteasolutions/zod-to-openapi` 7 · mysql2 3 ·
multer 2 · sharp 0.35 · file-type 22 · cors · swagger-ui-express · `@aws-sdk/client-s3` · Vitest 2 + Supertest. En
`backend/package.json` van con `^`; la versión exacta instalada está en `package-lock.json`.

### 3.2 Mapa de archivos

```
src/
  index.ts                  Arranque: carga .env local, valida config, createApp, listen
  app.ts                    createApp(config, deps?): cors, json, /api, Swagger, 404, manejador de errores
  config/env.ts             Zod sobre process.env: loadEnv (API) y loadDbEnv (scripts de BD)
  db/pool.ts                Pool mysql2, TLS con CA (Aiven), timezone 'Z', pingDB
  routes/
    index.ts                Monta health + perritos bajo /api
    health.ts               GET /api/health
    perritos.ts             Todos los endpoints del dominio (HTTP: leer, validar, orquestar)
  schemas/perrito.ts        Zod: datos nuevos, filtros, id, clave de idempotencia  ← fuente de verdad
  repositories/
    perritosRepository.ts   TODO el SQL: JOIN, EXISTS, GROUP BY, transacción; interfaz PerritosRepository
  mappers/perritoMapper.ts  Registro de BD → contrato de la API (funcional)
  storage/
    index.ts                Interfaz StorageDriver + createStorage (elige local o s3)
    localDriver.ts          Carpeta fuera del proyecto, nombre = UUID
    s3Driver.ts             Bucket S3 privado
    validateImage.ts        Magic bytes con file-type
    processImage.ts         sharp: rota, reduce, recomprime, quita EXIF/GPS
  middleware/
    errorHandler.ts         HttpError, notFoundHandler, errorHandler
    validate.ts             detallesDeZod (Zod → [{field, message}])
  docs/openapi.ts, schemas.ts   Swagger generado desde Zod
```

### 3.3 Capas (quién puede hablar con quién)

```
Petición ─► app.ts (cors, json) ─► routes/perritos.ts ─┬─► schemas (Zod)         valida entrada
                                                       ├─► storage/*             valida y guarda la foto
                                                       ├─► repositories/*        SQL (única capa que toca MySQL)
                                                       └─► mappers/*             da forma a la respuesta
                     cualquier error ─► errorHandler ─► { error: { message, details? } }
```

- **La ruta no escribe SQL** y **el repositorio no sabe de HTTP** (solo lanza `HttpError` para errores de datos).
- **Inyección de dependencias:** `createApp(config, deps)` recibe `pool`, `storage` y `repository` (opcionales). Las pruebas
  inyectan un repositorio y un storage falsos, por eso corren sin MySQL. `PerritosRepository` y `StorageDriver` son **interfaces**.

### 3.4 Configuración y arranque

- `index.ts` → `cargarEnvLocal()` (usa `process.loadEnvFile` si existe `backend/.env`; en Render las variables vienen del servicio) →
  `loadEnv()` → `createApp` → `listen`. Si algo falla, imprime "No se pudo iniciar el backend: …" y sale con código 1.
- **Falla rápido y sin filtrar secretos:** `loadEnv` valida con Zod y el mensaje nombra las **variables** malas, nunca sus valores.
- Validaciones cruzadas con `superRefine`: `STORAGE_DRIVER=local` exige `RUTA_IMAGENES`; `s3` exige las 4 variables de AWS.
- Valores por defecto: `PORT` 3000, `CORS_ORIGIN` `http://localhost:5173` (varios separados por coma), `IMAGE_MAX_BYTES` 5 MB,
  `IMAGE_MAX_DIMENSION` 1600, `IMAGE_QUALITY` 80, `IMAGE_OUTPUT_FORMAT` webp, `DB_CONNECTION_LIMIT` 10.
- `dbEnvSchema` lo comparten el backend y `database/scripts`: **una sola fuente de verdad** para la conexión.
- `db/pool.ts`: `timezone: 'Z'` (MySQL guarda TIMESTAMP en UTC; sin esto el driver desfasa `fecha_registro`), TLS con
  `rejectUnauthorized: true` cuando `DB_SSL=true` (el CA puede ser ruta a `.pem` o el PEM pegado), y el pool **no conecta hasta la primera consulta**.

### 3.5 Endpoints (`routes/perritos.ts`)

| Endpoint | Qué hace |
|---|---|
| `GET /api/health` | `{ data: { status, uptime, timestamp } }` (no toca la base) |
| `GET /api/perritos?busqueda=&colorId=&razaId=` | Valida filtros con Zod (400 si son inválidos) → `repository.listar` → `aPerritosApi` |
| `POST /api/perritos` | Registro con foto e idempotencia (ver 3.6) |
| `GET /api/perritos/:id` | 400 si el id no es entero positivo, 404 si no existe |
| `GET /api/perritos/:id/foto` | Lee la foto del storage; `Content-Type` según la extensión guardada; `Cache-Control: public, max-age=86400` |
| `GET /api/razas`, `/colores`, `/colores-ojos`, `/patrones-pelaje` | Catálogos ordenados por nombre en SQL (colores llevan `hex: null`) |
| `GET /api/estadisticas` | `{ total, porColor }`: dos consultas en paralelo con `Promise.all` |
| `GET /api/openapi.json`, `/api/docs` | Especificación y Swagger UI |

Detalle de orden: `/perritos/:id/foto` está declarada **antes** de `/perritos/:id`.

### 3.6 `POST /api/perritos` paso a paso

1. **multer** con `memoryStorage` (la foto queda en un `Buffer`, no en disco) y límite `IMAGE_MAX_BYTES`, campo `foto`.
   `LIMIT_FILE_SIZE` → 400 "La foto supera el tamaño máximo permitido."
2. **`Idempotency-Key`** obligatorio (`idempotencyKeySchema`: 8 a 64 caracteres) → si no, 400.
3. **Idempotencia primero:** `buscarPorIdempotencia(clave)`. Si existe → **201 con el mismo perrito**, sin validar ni guardar nada.
4. **`leerDatosDelCuerpo`:** acepta campos individuales de multipart (lo que manda el frontend y documenta Swagger) o un campo
   `datos` con JSON. Convierte los strings del multipart a números/`null`/arreglos.
5. **Zod `datosPerritoNuevoSchema`:** nombre 1–60; `sexo`, `etapaVida`, `tamano`, `longitudPelaje` como `enum`; ids enteros positivos;
   `latitud` −90..90, `longitud` −180..180; `coloresAdicionalesIds` máx. 2. Con `superRefine`: sin repetidos y ninguno igual al principal.
   `marcasDistintivas` es el único opcional. **La fecha no se recibe:** si el cliente la manda, se ignora.
6. Sin `req.file` → 400 "Falta la foto."
7. **`validarImagenReal`:** vacío, más grande que el máximo, y **tipo por contenido** con `fileTypeFromBuffer`; solo JPG/PNG/WEBP.
8. **`comprimirImagen`** (sharp): `rotate()` (respeta EXIF), `resize` a ≤ 1600 px lado mayor sin agrandar, recodifica a webp calidad 80.
   Al recodificar se **pierden los metadatos, incluido el GPS**. Si sharp falla, guarda el original ya validado para no perder un registro válido.
9. **`storage.guardar`** → nombre `randomUUID().ext` generado por el backend (el del usuario nunca se usa). En la base solo se guarda ese nombre.
10. **`repository.crear`** (transacción, ver 3.8) → **201** con `aPerritoApi`.

### 3.7 Idempotencia en el backend (dos capas)

1. **Consulta previa** (paso 3): respuesta rápida al reintento normal.
2. **Clave primaria de `idempotencia`:** protege en carrera. Si dos peticiones con la misma clave pasan la consulta a la vez, la segunda
   `INSERT` falla con `ER_DUP_ENTRY`; `crear` hace `rollback` (tampoco queda el segundo perro) y **devuelve el perrito existente**
   (`replay: true`). Resultado: mismo id, mismo cuerpo, mismo 201.

`perros.ruta_imagen` es `UNIQUE` y el nombre es un UUID, así que dos registros distintos nunca comparten archivo.

### 3.8 Base de datos desde el backend (`perritosRepository.ts`)

- **`SELECT_PERRITO`:** un `SELECT` con `LEFT JOIN` a `razas`, `patrones_pelaje`, `colores_ojos`, `perro_colores` y `colores`.
  Cada perrito sale en varias filas (una por color); **`agrupar`** las junta en un objeto con `colores[]`.
- **`listar`:** arma el `WHERE` según los filtros — `p.nombre LIKE ?`, `EXISTS (SELECT 1 FROM perro_colores …)` para el color,
  `p.id_raza = ?` — y `ORDER BY p.fecha_registro DESC, p.id_perro DESC`. **Todo el filtrado y el orden ocurren en MySQL.**
  Los valores van con `?` (consultas parametrizadas): no hay concatenación de datos del usuario → sin inyección SQL.
- **Agregación:** `estadisticasPorColor` = `JOIN` + `GROUP BY c.id_color` + `COUNT(*)` + `ORDER BY total DESC`; `contarPerritos` = `COUNT(*)`.
- **`crear` en transacción** (`getConnection` → `beginTransaction` → `commit`/`rollback` → `release` en `finally`):
  `INSERT perros` (sin `fecha_registro`: la pone `CURRENT_TIMESTAMP`) → `INSERT perro_colores` (principal con `es_dominante=1`, adicionales con 0)
  → `INSERT idempotencia`. O queda todo o no queda nada.
- **Errores de MySQL traducidos** a mensajes claros: `ER_DUP_ENTRY` (idempotencia), `ER_NO_REFERENCED_ROW_2` (raza/color/patrón que no existe → 400),
  `ER_BAD_NULL_ERROR`, `ER_DATA_TOO_LONG`. Cualquier otro se relanza y termina en 500.
- Números: `latitud`/`longitud` son `DECIMAL` y mysql2 los puede devolver como texto → se convierten con `Number()`. La fecha sale en ISO (UTC).

### 3.9 Almacenamiento de fotos (`storage/`)

- `StorageDriver` = `guardar(buffer, extension)` y `leer(ruta)`. `createStorage` elige según `STORAGE_DRIVER`; el `default` del `switch` usa `never`,
  así que TypeScript avisa si se agrega un driver y se olvida el caso.
- **Local:** carpeta `RUTA_IMAGENES` **fuera del repo**, creada perezosamente en el primer guardado. `leer` aplica `path.basename` → un `../../` guardado en la
  base no puede escapar de la carpeta (hay prueba de *path traversal*).
- **S3:** bucket privado; el navegador nunca lo ve, todo pasa por `GET /api/perritos/:id/foto`.

### 3.10 Errores

Contrato único: éxito `{ data }`, error `{ error: { message, details? } }`. `HttpError(status, message, details?)` es la excepción propia; las rutas hacen
`next(error)` y **un solo** `errorHandler` responde. `detallesDeZod` convierte los issues en `[{ field, message }]` (el frontend los pinta en cada campo).
Un error no previsto responde 500 con mensaje genérico y solo se detalla en el log del servidor. `notFoundHandler` cubre rutas inexistentes con 404 legible.

### 3.11 Documentación OpenAPI

Se **genera desde Zod** (`docs/openapi.ts` + `docs/schemas.ts`), nunca a mano. Regla de `backend/AGENTS.md`: un cambio de endpoint no está terminado
si no actualiza su esquema Zod **y** su `registerPath`. Swagger UI en `/api/docs`, JSON en `/api/openapi.json`.

### 3.12 Pruebas del backend (Vitest + Supertest, `backend/tests/`)

| Archivo | Qué prueba |
|---|---|
| `perritos.test.ts` | Todos los endpoints; 400 por falta de clave, foto, campos o valores fuera de lista; foto falsa; **idempotencia**; multipart con campos individuales; ignora la fecha del cliente |
| `perritoMapper.test.ts` | El mapeo funcional: color dominante, sin dominante, sin colores, doble barra en `PUBLIC_BASE_URL` |
| `storage.test.ts` | Magic bytes (acepta/rechaza), driver local, *path traversal* |
| `processImage.test.ts` | Reduce, webp/jpeg, no agranda, respaldo si falla |
| `env.test.ts`, `db.test.ts` | Configuración, TLS/CA |
| `health.test.ts`, `openapi.test.ts` | Salud, 404, documento OpenAPI sin secretos |

### 3.13 Dónde se aplica cada paradigma (backend)

**Declarativo — dices *qué* quieres, no *cómo* obtenerlo**

| Dónde | Qué muestra |
|---|---|
| `SELECT_PERRITO` (`perritosRepository.ts`) | `LEFT JOIN` de 5 tablas: describes la relación, MySQL decide cómo recorrerla |
| `listar` | `WHERE … LIKE`, `EXISTS`, `ORDER BY`: filtro y orden en SQL, no en un ciclo |
| `estadisticasPorColor` | `GROUP BY` + `COUNT(*)` + `ORDER BY`: la agregación la hace la base |
| `schemas/perrito.ts` | Zod describe **cómo debe ser** un dato válido (`z.enum`, `.min`, `.max`), no los `if` para revisarlo |
| `docs/openapi.ts` | El contrato se declara y Swagger se genera solo |
| Migraciones (`database/`) | `CREATE TABLE`, `CHECK`, `UNIQUE`, `FOREIGN KEY`: las reglas viven en el esquema |

**Imperativo — pasos en orden, con efectos**

| Dónde | Qué muestra |
|---|---|
| `POST /perritos` en `routes/perritos.ts` | Secuencia: clave → buscar → validar → foto → comprimir → guardar → insertar. El orden importa |
| `repository.crear` | `beginTransaction` → `INSERT`s en un `for…of` con `await` → `commit`/`rollback`. Es un flujo con efectos y control de errores |
| `index.ts` (`main`) | Orquesta el arranque: cargar env, validar, crear app, escuchar |
| `localDriver.guardar` | Crear carpeta → generar nombre → escribir archivo |
| `listar` (armado del `WHERE`) | `condiciones.push(...)` / `valores.push(...)` (imperativo local; el filtrado sigue siendo SQL) |

**Orientado a objetos — encapsulación, polimorfismo, abstracción**

| Dónde | Qué muestra |
|---|---|
| `class HttpError extends Error` | Herencia: lleva `status` y `details`; el `errorHandler` la reconoce con `instanceof` |
| `interface StorageDriver` + `localDriver` / `s3Driver` | **Polimorfismo:** la ruta llama `storage.guardar()` sin saber si es disco o S3; `createStorage` es la fábrica |
| `interface PerritosRepository` + `createPerritosRepository(pool)` | Abstracción del acceso a datos; los detalles (SQL, `pool`) quedan encapsulados en el cierre; se sustituye en pruebas |
| `createApp(config, deps)` | **Inyección de dependencias** (bajo acoplamiento) |

Ojo al defenderlo: en el backend solo hay **una `class`** (`HttpError`). Lo demás es OO por **interfaces + fábricas** (módulos con estado
encapsulado). Dilo así; es honesto y es válido. Las clases "de verdad" más visibles están en el frontend (`ErrorApi`, `ErrorFoto`, `ErrorUbicacion`).

**Funcional — funciones puras, `map`/`filter`/`reduce`, sin mutar, sin ciclos**

| Dónde | Qué muestra |
|---|---|
| **`aPerritoApi` (`mappers/perritoMapper.ts`)** ← la que debes señalar | `find` (principal) + `filter` (adicionales) + `map` (formato de color): función pura, no muta el registro, sin ciclos. Tiene pruebas |
| `aPerritosApi` | `registros.map(aPerritoApi)` |
| `agrupar` (`perritosRepository.ts`) | `reduce` que convierte filas del JOIN en perritos con `colores[]`, usando spread (`[...existente.colores, color]`). No muta las filas de entrada |
| `aArrayDeIds` (`routes/perritos.ts`) | `map` → `filter` para limpiar los ids que llegan del multipart |
| `crear` (armado de `colores`) | `[principal, ...adicionales.map(...)]` |
| `mensajeDeErrores` (`config/env.ts`), `detallesDeZod` | `map` (+ `Set`) para dar formato a errores |
| Catálogos y `estadisticasPorColor` | `filas.map(...)` para tipar/convertir cada fila |
| `Promise.all` en `/estadisticas` | Composición de dos consultas independientes |

**Qué decir en la demo (30 segundos):** *"En SQL filtramos, ordenamos, unimos y agrupamos (declarativo). El registro con foto es un flujo paso a paso
con transacción (imperativo). El almacenamiento y el repositorio son interfaces con implementaciones intercambiables e inyectadas (orientado a objetos).
Y la transformación de un registro de base de datos al contrato de la API es `find`/`filter`/`map` sin mutar (funcional), en `aPerritoApi`."*

### 3.14 Puntos débiles del backend (mejor que los conozcas tú)

1. **Foto huérfana en una carrera de idempotencia.** Si dos peticiones con la misma clave llegan a la vez, ambas pasan la consulta previa y ambas **guardan la foto**
   antes del `INSERT`. La segunda falla por `ER_DUP_ENTRY` y devuelve el perrito existente (correcto), pero su archivo queda en el storage sin fila que lo use.
   No duplica registros, solo deja un archivo sobrante. Lo mismo pasa si el `INSERT` falla por cualquier otro motivo después de guardar.
2. **`agrupar` usa `reduce` pero el acumulador es un `Map` que se modifica con `set`.** No muta las filas de entrada ni los objetos, pero el `Map` sí cambia.
   Por eso el ejemplo "limpio" para el criterio de "sin mutar" es `aPerritoApi`, no `agrupar`.
3. **Hay ciclos explícitos** en `crear` (`for…of`) y `env.ts` (`for…of` sobre las variables de AWS). La consigna pide "sin ciclos" **en la transformación funcional que señalas**, no en todo el código.
4. **`miniaturaUrl` = `fotoUrl`:** no se genera una miniatura real (la foto ya va a ≤ 1600 px).
5. **`hex` de colores siempre `null`:** el catálogo no guarda hex; el frontend lo completa con `conHex`.
6. **201 también en el reintento idempotente** (no 200): es intencional y está documentado; "duplicado" nunca se responde.
7. **Raza obligatoria en la API** (`razaId` entero positivo), aunque la persona pueda dejarla en "Sin raza definida" en el formulario: es una opción del catálogo, no un `NULL`.
8. **Sin autenticación ni límite de peticiones:** el proyecto no lo pide, pero si te preguntan por seguridad, la defensa actual es validación de entrada, magic bytes,
   consultas parametrizadas, nombres de archivo generados, `basename` contra path traversal, CORS por lista y BD no expuesta.

---

## Parte 4 — Preguntas probables y respuestas cortas

**¿Dónde está la transformación funcional (map/filter/reduce sin mutar ni ciclos)?**
`validarRegistro` en `utils/validacion.ts`: `REGLAS.map(...)` → `.filter(...)` (quita los `null`) → `.reduce(...)` (arma el objeto de errores con spread, quedándose con
el **primer** error de cada campo). Cada regla es una función pura. Hay pruebas que verifican que no muta. Otros: `coordenadasDe`, `conHex`, `camposDesdeDetalles`, `aQueryString`, `caracteristicasDe`.

**¿Dónde hay imperativo y por qué ahí?**
`utils/imagen.ts → reducir` (secuencia de pasos con efectos sobre un canvas: crear, dibujar, exportar) y `utils/reintentos.ts` (ciclo `for` con espera). Son secuencias de efectos donde el orden importa.

**¿Dónde hay orientado a objetos?**
`class ErrorApi extends Error` (`api/errores.ts`): guarda `estado` y `campos`, se distingue con `instanceof`. También `ErrorFoto` y `ErrorUbicacion`. Los componentes de React.

**¿Filtran en el frontend?**
No. Los filtros van como query params y los resuelve MySQL. El único `.find`/`.filter` del frontend es sobre datos **ya recibidos** para dibujar (p. ej. encontrar el perrito enfocado, quitar `null` de la ficha), nunca para filtrar la lista.

**¿Cómo se valida la foto?**
Cliente: magic bytes (`detectarTipoImagen`) + tipo permitido en `validacion.ts`. Servidor: `file-type` por contenido + compresión con `sharp`. Ninguno confía en la extensión ni en el `Content-Type`.

**¿Qué pasa si el celular pierde señal a mitad del envío?**
`fetch` falla → `ErrorApi` (estado 0) → `conReintentos` espera 1 s y reintenta con la **misma clave** (hasta 3 intentos, mensaje "Conexión inestable. Reintentando (2 de 3)…"). Si el primer POST sí llegó al servidor, el reintento devuelve el mismo perrito.

**¿Y si el backend responde 400?**
No se reintenta. Si trae `details` por campo, se marcan esos campos y se hace scroll al primero; si no, se muestra el mensaje general. Como el 400 no guardó nada, la clave sigue sirviendo para el siguiente intento.

**¿Por qué el formulario usa `noValidate`?**
Para que la validación y los mensajes sean los nuestros (en español, iguales en frontend y consistentes con backend), no los del navegador.

**¿Por qué la cámara solo funciona en HTTPS?**
Los navegadores solo dan cámara y ubicación en contextos seguros (https o localhost). Por eso existe `npm run dev:red` (Vite con certificado autofirmado vía `@vitejs/plugin-basic-ssl`) para probar desde el celular, y en producción Vercel/Render dan TLS automático.

**¿Qué hace `capture="environment"`?**
En celular abre directamente la cámara trasera. En PC se ignora y abre el explorador.

**¿Por qué guardan el filtro en la URL?**
Para que al volver del detalle sigan puestos, y para que el enlace sea compartible. `replace: true` evita llenar el historial con cada letra.

**¿Qué es el proxy de Vite y para qué sirve?**
Reenvía `/api/*` a `BACKEND_URL`. El navegador solo ve un origen → sin CORS y sin mezclar http/https. En producción el mismo efecto lo da `VITE_API_URL` apuntando al backend público (y `CORS_ORIGIN` en el backend).

**¿Cómo se ve algo en el frontend si el backend no manda `hex` de colores?**
`conHex` en `transformaciones.ts`: tabla `HEX_POR_NOMBRE` por nombre normalizado (`normalizar` quita acentos y mayúsculas); `colorCss` valida con regex y usa gris de respaldo.

**¿Qué variables tiene el frontend?**
`VITE_API_URL` (`/api`), `BACKEND_URL` (solo la lee `vite.config.ts` en Node), `VITE_MAPA_CENTRO` (`19.4326,-99.1332`), `VITE_MAPA_ZOOM` (13), `VITE_MAPA_MOSAICOS_URL` y `_CREDITOS` (opcionales). Todo lo `VITE_*` queda **visible en el navegador**: nunca van secretos ahí.

**¿Cómo demuestro el doble envío en vivo?**
Opción 1 (limpia): DevTools → Network → "Slow 3G", presiona "Registrar perrito" y luego, sin esperar, repite la petición desde la pestaña Network con "Replay XHR"; o con `curl` dos veces con la misma `Idempotency-Key` (ejemplo en el README §11) y muestra que el `id` es el mismo. Antes y después: `SELECT COUNT(*) FROM perros;` → mismo número.
Opción 2: `npm run test:backend` y señala el caso de idempotencia.

**Demo de 10 minutos (lo que pide la consigna):**
1. Desde el **celular** (HTTPS: la URL pública o `dev:red`), abrir `/registrar`.
2. Tomar una **foto en ese momento** con "Tomar foto".
3. Mostrar que **rechaza un registro incompleto** (enviar vacío → resumen de errores y "Falta la foto del perrito.").
4. Completar, marcar ubicación (GPS o pin), enviar → ir al **mapa** y ver el pin nuevo.
5. Mostrar el doble envío (idempotencia) y la lista con filtro.

---

## Parte 5 — Puntos débiles del frontend / cosas que conviene saber antes de que te las pregunten

Estas son inconsistencias reales que encontré leyendo el código. Mejor conocerlas tú que descubrirlas frente al profesor.

1. **Raza: la consigna dice "No" es obligatoria; el proyecto la hace obligatoria.** Es defendible: el formulario la rellena por defecto con "Sin raza definida / Criollo",
   que es justo la opción que pide la consigna. Explícalo así: *"la raza es opcional para la persona, obligatoria en la base, y el valor por defecto es 'Sin raza definida'"*.
2. **Comentarios desactualizados.** `RegistrarPage.tsx` (líneas 3–5) y `validacion.ts` (interfaz `DatosFormulario`, "Opcionales: null = No sé") dicen que la apariencia es opcional,
   pero el código y las reglas **la exigen** (sexo, edad, tamaño, largo, patrón, ojos). `SelectorOpciones` todavía soporta la opción "No sé" pero se usa con `opcional={false}`.
   Si te preguntan, la verdad es el código: **son obligatorios**. Conviene corregir esos comentarios (la doc desactualizada es un defecto según `AGENTS.md`).
3. **Miniaturas = foto completa.** El backend no manda `miniaturaUrl`, así que el frontend usa la misma foto (ya comprimida a ≤ 1600 px). Funciona y la lista usa `loading="lazy"`,
   pero no es una miniatura real. Si preguntan por rendimiento, dilo con franqueza.
4. **Hay un `for…of` en `crearPerrito`** (`http.ts`, para los `append` de colores adicionales) y un `for` en `reintentos.ts`. El requisito de "sin ciclos" aplica **a la transformación funcional que
   señalas**, no a todo el código; por eso señala `validarRegistro`, no `crearPerrito`.
5. **El backend responde 201 también en el reintento idempotente** (no 200). Es intencional y lo documenta el README; no es un error.
6. **"Fecha de registro"**: el cliente no la envía; la pone MySQL en UTC y el frontend la formatea a `es-MX` (`Intl.DateTimeFormat`).
7. **El PDF pide que "cada quien responda solo por su rol".** En el README el frontend es de Luis Sáenz Jiménez. Si te preguntan del frontend, esta guía te cubre, pero recuerda que en la
   demo cada integrante responde por su parte.
8. **Render (plan gratis) duerme el servicio.** La primera petición tras inactividad puede tardar segundos: por eso el timeout de consulta es 15 s y hay botón Reintentar. Abre la URL antes de presentar.

---

## Parte 6 — Comandos de repaso rápido

```bash
npm install              # una sola vez, desde la raíz (monorepo con workspaces)
npm run db:migrate       # tablas (la base debe existir: CREATE DATABASE pawfinder ...)
npm run db:seed          # catálogos + 16 perritos con foto
npm run dev              # backend :3000 + frontend :5173
npm run dev:red --workspace @pawfinder/frontend   # HTTPS para probar desde el celular
npm run test --workspace @pawfinder/frontend      # 42 pruebas
npm run test:backend     # incluye la prueba de idempotencia
npm run ci               # lint + tipos + pruebas + build de todo
```

URLs de producción (confirmar que sigan activas antes de la demo): app <https://paw-finder-frontend.vercel.app>, API <https://pawfinder-hq2o.onrender.com> (`/api/docs`).
