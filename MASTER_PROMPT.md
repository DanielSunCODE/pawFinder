# MASTER PROMPT — Proyecto 1: Registro de perritos de la calle

Este archivo es el **contexto completo de lineamientos** del proyecto. No es un
spec: las specs viven en `openspec/specs/` y cambian por cambio. Este documento
resume la consigna oficial (`proyecto1-perritos.pdf`) y las reglas de operación
para que cualquier persona o agente que trabaje aquí entienda el "por qué" y las
restricciones que no se negocian.

Léelo **antes** de proponer o implementar cualquier cosa. Si una instrucción de
una spec contradice este documento, gana este documento (o se corrige la spec).

**Documentación viva:** este documento y el `README.md` se actualizan junto con
el código. Si un cambio afecta algo documentado —versiones, endpoints, variables
de entorno, comandos, estructura de carpetas, diagramas, paradigmas o
despliegue—, la documentación se corrige **en el mismo cambio**. Documentación
desactualizada es un defecto, no un pendiente.

---

## 1. De qué se trata

En equipos de 3 se construye una aplicación para registrar perritos de la calle:
quien encuentra uno le toma una foto, le pone un nombre, anota cómo es y marca en
un mapa dónde lo vio. El registro sirve a rescatistas, vecinos y asociaciones
para saber qué perros hay, cómo identificarlos y en qué zona andan.

Es un problema real, con usuarios reales: **la app debe poder usarse desde un
celular en la calle**, no solo desde la computadora del laboratorio.

## 2. Equipo y roles (3 integrantes)

| Rol | Responsable de | Entrega visible en el repositorio |
|---|---|---|
| **Frontend** | Pantallas, formulario, captura/carga de foto, mapa con el pin, validaciones del cliente, uso correcto en celular | Capturas de pantalla en el README |
| **Backend** | API que recibe/entrega registros, validación del servidor, almacenamiento de imágenes, manejo de errores | Lista de endpoints en el README |
| **DBA** | Modelo de datos, script de creación, catálogos, datos de prueba, respaldo | Scripts o migraciones, diagrama entidad-relación |

Reglas del equipo:

- **Cada integrante debe tener commits propios** en su parte. El historial de Git
  es la evidencia de quién hizo qué.
- En la demostración, **cada quien responde únicamente por su rol**. Nadie
  contesta por otro.
- Si alguien deja de trabajar, se reporta al profesor **antes** de la entrega, no
  el día de la entrega.

## 3. Qué debe hacer la aplicación

### Campos de un registro

Lo obligatorio se valida **en el frontend y en el backend**; si alguien se salta
el formulario y llama la API directo, el backend rechaza el registro incompleto.

| Campo | ¿Obligatorio? | Regla |
|---|---|---|
| **Foto** | Sí | Se puede **tomar con la cámara** o **subir una imagen** existente. **Las dos opciones deben funcionar.** Formatos JPG, PNG o WEBP. |
| **Nombre** | Sí | Texto no vacío. Un nombre de puros espacios no cuenta. |
| **Raza** | No | Se elige de un catálogo. Debe existir la opción **"Sin raza definida / criollo"**. |
| **Color principal** | Sí | Exactamente uno, elegido de un catálogo. |
| **Colores adicionales** | No | De 0 a 2, del mismo catálogo: **máximo 3 colores en total** contando el principal. No se puede repetir el principal ni repetir un color. |
| **Ubicación** | Sí | Un pin en un mapa. El usuario puede usar su **ubicación actual** o mover el pin a mano. Se guardan **latitud y longitud**. |
| **Fecha de registro** | Automático | La pone el sistema, no el usuario. |

### Además del formulario, la app debe

1. Mostrar los perritos registrados **en un mapa**, con un pin por perrito. Al
   tocar el pin se ve su foto, nombre y colores.
2. Mostrar una **lista** de los registros con foto en miniatura.
3. Ver el **detalle** de un registro.
4. Mostrar **errores entendibles**: "Falta la foto" sí; "Error 400" no.

**No se pide inicio de sesión ni usuarios.** Si se agrega, es extra, no requisito.

### Cámara y ubicación

Los navegadores solo dan acceso a cámara y ubicación en **https o localhost**.
Hay que probarlo desde el celular **antes** de la entrega, no la noche anterior.

## 4. Los paradigmas en juego (se revisan explícitamente)

### 4.1 Declarativo e imperativo conviviendo

- Las consultas de datos se resuelven **en SQL, que es declarativo**: filtrar,
  ordenar y agrupar le toca al manejador.
- **Prohibido** traer todos los registros y filtrarlos con un ciclo en el lenguaje
  de la aplicación.
- Al menos **una consulta con JOIN** entre el perrito y sus colores, y **una con
  agregación** (por ejemplo, cuántos perritos hay por color o por zona).
- El README señala **qué parte es declarativa y cuál imperativa, y por qué**.
- La interfaz también declara: HTML y CSS describen qué debe verse, no cómo
  dibujarlo.

### 4.2 Idempotencia del registro

- El formulario sufre el problema del ejercicio 3: el usuario presiona **Enviar
  dos veces**, o el celular reintenta por mala señal, y quedan dos perritos
  idénticos.
- El guardado **debe ser idempotente**: el segundo envío devuelve **la misma
  respuesta y el mismo identificador**, y **no crea** un registro nuevo.
- Responder **"error: duplicado" NO es idempotencia**.
- Usar una **clave de idempotencia generada al abrir el formulario**, o una clave
  natural justificable. Documentar cuál se eligió y por qué.
- Debe existir una **prueba del doble envío**, y se demuestra en vivo.

### 4.3 Más de un paradigma

- En el README, una sección que diga **qué paradigma se usó en cada parte** y
  **dónde está ese código**: imperativo, orientado a objetos, funcional,
  declarativo.
- Al menos **una transformación de datos resuelta en estilo funcional** con
  `map`, `filter` o `reduce`, **sin mutar** la estructura original y **sin ciclos
  explícitos**. Señalar cuál es.
- No se trata de usar cuatro lenguajes, sino de **reconocer el paradigma** en el
  que se escribe en cada momento y **explicar por qué ahí conviene ése**.

## 5. Punto extra — acceso desde internet (opcional)

No afecta a quien no lo intente. Se divide en dos mitades que valen lo mismo:
explicar cómo se publica y lograr que se pueda entrar.

### Mitad 1 — Explicarlo

Una sección **Despliegue** en el README que conteste, se haya publicado o no:

- **Dónde correría cada pieza**: la aplicación, la base de datos y el directorio
  de las imágenes (**que sigue sin poder vivir junto al código**).
- **Cómo se obtiene el dominio y el certificado para HTTPS.** No es opcional: sin
  HTTPS el navegador no da cámara ni ubicación.
- **Qué cambia entre la configuración local y la de producción, variable por
  variable**, y **dónde se guardan las contraseñas del servidor**.
- **Qué puertos quedan abiertos hacia internet y cuáles no.** **La base de datos
  no se expone.**
- **Cómo se respalda la base y las imágenes, y cómo se restauran.**
- **No hay Docker**: la instalación es directa en el servidor, el servicio queda
  administrado por **systemd o equivalente** para que reviva solo, y al frente va
  un **proxy inverso como nginx o Caddy**.

### Mitad 2 — Lograrlo

- La app accesible desde una **URL pública** el día de la demostración, probada
  desde un **celular con datos móviles**, no desde la red del laboratorio.
- Vale cualquier opción: hospedaje gratuito, máquina virtual, o un túnel
  (Cloudflare Tunnel, ngrok, Tailscale Funnel), **siempre documentado** en el
  README junto con la URL.
- Si usan un túnel desde una laptop, la liga cambia o se cae al cerrar sesión:
  probar la URL desde otro dispositivo antes de presentar.
- **El servicio de hospedaje no puede exigir Docker para desplegar.**

## 6. Reglas técnicas

### 6.1 Tecnologías

- Lenguajes, frameworks y manejador de base de datos son **libres**, pero **deben
  correr sin Docker** y todo queda documentado en el README **con versiones
  exactas**.

### 6.2 Sin Docker

- **Ningún `Dockerfile`, ningún `docker-compose.yml`, ninguna instrucción del
  tipo "instale Docker".**
- El sistema se instala directamente en la máquina, como lo haría alguien que
  recibe el proyecto sin contenedores.

### 6.3 Almacenamiento de las imágenes

- Las fotos **no pueden guardarse en ninguna carpeta que alcance los binarios o
  el código**: ni dentro del código fuente, ni en `static/`, `public/`,
  `resources/`, `priv/static/` ni la carpeta de despliegue del servidor.
- La ruta se define en la configuración (por ejemplo **`RUTA_IMAGENES`**), apunta
  a un **directorio fuera del proyecto** y el README explica cómo crearlo.
- Las imágenes se sirven **a través de un endpoint del backend**, no exponiendo
  la carpeta directamente.
- El backend **genera el nombre del archivo**; nunca usa el nombre que mandó el
  usuario.
- Se valida que el archivo **realmente sea una imagen**, no solo que su extensión
  lo diga.
- Razón: un archivo subido por un usuario junto al código puede terminar
  ejecutándose o sobrescribiendo algo de la app. Separar datos subidos de los
  binarios es seguridad básica.

### 6.4 Git

- **Un solo repositorio** por equipo, público o compartido con el profesor desde
  el primer día.
- **Nada se entrega por correo ni en USB**: lo que no está en el repositorio no
  existe.
- Trabajo en **ramas** y fusión por **pull request**. **Al menos un PR revisado
  por otro integrante por cada rol.**
- Mensajes de commit que digan qué cambió. "cambios", "ya quedó" y "asdf" no son
  mensajes.
- **No se suben contraseñas, llaves de API, `node_modules/`, `target/`, entornos
  virtuales ni las fotos de prueba pesadas.** Usar `.gitignore` y un archivo de
  configuración de ejemplo (`.env.example` o equivalente).

### 6.5 Inteligencia artificial

- El uso de IA es **opcional** y **no suma ni resta** puntos.
- La única condición: **poder explicar línea por línea cualquier código
  entregado**, venga de donde venga. En la demostración se elige un fragmento al
  azar y quien lo escribió debe explicarlo.

## 7. README (parte de la calificación)

El `README.md` en la raíz es parte de la nota. La prueba: una persona que nunca
vio el proyecto, con una **computadora limpia**, debe poder **instalarlo y
ejecutarlo** siguiéndolo al pie de la letra. Debe incluir:

1. Nombre del proyecto, integrantes y rol de cada uno.
2. Requisitos previos con **versiones exactas** (lenguaje, runtime, manejador de
   base de datos, etc.).
3. Pasos de instalación **en orden**, con comandos listos para copiar.
4. Creación de la base de datos y **carga de catálogos y datos de prueba**.
5. Configuración: **qué variables** hay que definir y un ejemplo de cada una.
6. **Cómo ejecutar backend y frontend**, y en qué URL queda cada uno.
7. **Cómo probarlo desde un celular en la misma red.**
8. **Lista de endpoints** de la API.
9. **Capturas de pantalla.**
10. **Problemas comunes y cómo resolverlos.**
11. Sección **Paradigmas**: paradigma por parte, dónde está ese código y cómo se
    resolvió la idempotencia.
12. (Solo si van por el punto extra) Sección **Despliegue** con la URL pública.

> **Mantener al día:** las versiones exactas, la lista de endpoints, las variables
> de entorno, los comandos y las URLs deben reflejar el estado real del código. Al
> cambiar una dependencia, un endpoint, una variable o un comando, actualiza esta
> sección en el mismo cambio. Lo mismo aplica a `docs/architecture.md`,
> `docs/development.md` y `docs/deployment.md`.

## 8. Qué se entrega

- **Fecha de entrega y demostración: por confirmar.** Se entrega la liga al
  repositorio; se califica el **último commit de `main`** antes de la fecha
  límite.
- La organización de carpetas es libre y depende de las tecnologías elegidas. El
  README explica dónde está cada parte; es el **único archivo con ubicación
  fija**: la raíz del repositorio.
- Aplicación funcionando con todos los requisitos.
- **Base de datos con catálogo de al menos 10 razas y 10 colores, y al menos 15
  perritos de prueba con foto.**
- README completo con los 11 puntos obligatorios, incluida la sección de
  paradigmas.
- **Prueba del doble envío** que demuestre idempotencia.
- **Demostración en vivo de 10 minutos**: registrar un perrito desde un celular
  (con foto tomada en ese momento), verlo aparecer en el mapa, y mostrar que la
  validación rechaza un registro incompleto.
- **Instalación en vivo**: el profesor elige una máquina del laboratorio y el
  equipo sigue su propio README frente al grupo. Si el README falla, se corrige
  ahí mismo y se anota como observación.
- (Extra) URL pública funcionando, abierta desde un celular con datos móviles
  frente al grupo, y la sección de despliegue.

## 9. Cómo se califica (escala 0–100)

Calificación de equipo, con **ajuste individual** por evidencia en Git y
respuestas en la demostración.

| Criterio | Excelente (90–100) | Suficiente (70–79) | Insuficiente (<70) | Peso |
|---|---|---|---|---|
| **Trabajo en equipo con Git** | Ramas, PR revisados, commits claros y repartidos entre los 3 | Commits de todos, pero todo en `main` o mensajes vagos | Un solo integrante sube todo, o los commits el último día | 20% |
| **Declarativo e imperativo** | Filtrado, ordenamiento y agregación en SQL; README explica dónde está cada estilo y por qué | Usa SQL pero resuelve en código algo que tocaba a la base | Trae todo y filtra con ciclos; no distingue un estilo del otro | 15% |
| **Uso de distintos paradigmas** | Identifica los paradigmas en su propio código con ejemplos concretos; hay una transformación funcional sin mutación ni ciclos | Identifica los paradigmas, con ejemplos genéricos | Copia definiciones o no reconoce lo que escribió | 15% |
| **Idempotencia** | El doble envío no duplica, devuelve el mismo id y conserva el registro original; hay prueba que lo demuestra | Evita el duplicado pero cambia la respuesta o el registro | El segundo envío crea otro perrito o responde con error de duplicado | 15% |
| **Funcionalidad** | Todos los campos y reglas funcionan; cámara y carga de archivo, mapa y lista operan desde celular | Registra, pero falla alguna regla (colores, cámara, pin) | No registra o pierde datos | 20% |
| **README y ejecución sin Docker** | Otra persona lo instala y corre siguiéndolo sin ayuda | Se instala con ayuda del equipo | No se logra ejecutar | 15% |

- **Punto extra − acceso desde internet:** hasta **10 puntos** sobre la nota, sin
  pasar de 100. La mitad por explicar el despliegue y la otra por tenerlo en
  línea. Se puede sacar 100 sin intentarlo.
- **Ajuste individual:** un integrante sin commits propios en su rol, o que no
  pueda explicar el código de su parte, puede recibir menos que su equipo.

## 10. Preguntas frecuentes

- **¿App móvil nativa en vez de web?** Sí, si se instala y ejecuta sin Docker
  siguiendo el README y la demostración es en un teléfono real.
- **¿Servicio en la nube para base o imágenes?** Sí, pero el README explica cómo
  crear la cuenta y configurarla, y el sistema **debe funcionar también con una
  base local** para la instalación en vivo.
- **¿Qué mapa?** El que quieran. Si pide llave de API, **la llave no se sube** y
  el README explica cómo obtenerla.
- **¿Foto en la base o en disco?** Cualquiera si se justifica. Si es en disco,
  aplica la regla de almacenamiento: **fuera de cualquier carpeta de la app**.
- **¿Se puede editar o borrar un registro?** No es obligatorio; si se agrega,
  cuenta como extra.
- **¿Hay que usar IA?** No. Lo que se revisa es que entiendan lo que entregaron.

---

## 11. Nuestro stack y decisiones (mapeo a la consigna)

| Pieza | Decisión |
|---|---|
| Frontend | React + Vite + TypeScript, Tailwind; mapas con Leaflet + OpenStreetMap (sin llave de API) |
| Backend | Node 22 + Express + TypeScript; validación con **Zod**; documentación **OpenAPI generada desde Zod** (Swagger UI en `/api/docs`) |
| Base de datos | MySQL 8; local para la instalación en vivo y **Aiven** en producción (TLS) |
| Imágenes | Abstracción `local` (`RUTA_IMAGENES` fuera del proyecto) o `s3` (bucket privado); el backend genera el nombre y valida la imagen real; se sirven por `GET /api/perritos/{id}/foto` |
| Idempotencia | Clave de idempotencia (UUID) generada al abrir el formulario; tabla `idempotencia` con clave única |
| Despliegue | Frontend en Vercel, backend en Render, base en Aiven, imágenes en S3 (opcional); **sin Docker** en ningún punto |

## 12. Reglas de operación para agentes

1. **Nada de Docker** ni instrucciones que lo requieran. La instalación es directa
   y reproducible siguiendo el README.
2. **Nunca versionar secretos** (`.env`, llaves, `ca.pem`), dependencias ni fotos
   pesadas. Usar `.env.example`.
3. **Validación doble**: todo campo obligatorio se valida en frontend y backend.
   El backend nunca confía en el cliente.
4. **Zod ↔ OpenAPI**: al crear, cambiar o eliminar un endpoint, actualizar su
   esquema Zod y su registro OpenAPI en el mismo cambio (ver
   [`backend/AGENTS.md`](backend/AGENTS.md)).
5. **SQL declarativo**: filtrar/ordenar/agrupar en SQL, nunca trayendo todo y
   filtrando en un ciclo. Mantener al menos un JOIN y una agregación.
6. **Funcional**: al menos una transformación con `map`/`filter`/`reduce`, sin
   mutar y sin ciclos explícitos.
7. **Idempotencia real**: el doble envío devuelve el mismo id y el mismo
   resultado; no responder "duplicado".
8. **Imágenes fuera del código**, nombre generado por el backend y validación por
   contenido (magic bytes).
9. **Trabajo en ramas + PR** por rol, con commits claros y propios.
10. **Todo lo que no esté en el repositorio no existe**: documentar en el README.
11. **Documentación viva**: al hacer un cambio, guarda o actualiza la información
    afectada en el mismo cambio —versiones exactas, endpoints, variables de
    entorno, comandos, estructura, diagramas, mapeo de paradigmas y despliegue—.
    Revisa `README.md`, `docs/` y, si aplica, este `MASTER_PROMPT.md`. Si dudas de
    si algo cambió, compáralo con el código real (por ejemplo, `npm ls` o los
    `package.json`) antes de dar el cambio por terminado.

## 13. Mapa del repositorio

- `frontend/` — app web; ver `frontend/README.md`.
- `backend/` — API REST; ver `backend/README.md` y `backend/AGENTS.md`.
- `database/` — migraciones, seeds y scripts; ver `docs/database-schema.md`.
- `docs/` — arquitectura, esquema de BD y despliegue.
- `openspec/` — specs y cambios (spec-driven).
