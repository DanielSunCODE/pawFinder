## Purpose

Define el contrato REST del registro de perritos de la calle: consultar y filtrar registros, ver su detalle y foto, registrar de forma idempotente con validación en el servidor, y exponer los catálogos y las estadísticas.

## ADDED Requirements

### Requirement: Listar y filtrar perritos
El API SHALL devolver el listado de perritos con sus colores, permitiendo filtrar por texto del nombre, por color y por raza, resolviendo el filtrado y el orden en SQL.

#### Scenario: Listado completo
- **WHEN** se solicita `GET /api/perritos` sin filtros
- **THEN** devuelve los perritos registrados (puede ser una lista vacía), cada uno con su raza, color principal y colores adicionales

#### Scenario: Filtro por color
- **WHEN** se solicita el listado con un `colorId`
- **THEN** solo se devuelven los perritos que tienen ese color, y el filtro se aplica en la consulta SQL (no en el navegador)

### Requirement: Ver el detalle de un perrito
El API SHALL devolver un perrito por su identificador, incluyendo raza, color principal, hasta dos colores adicionales y los campos descriptivos del esquema (sexo, etapa de vida, tamaño, longitud de pelaje, patrón de pelaje, color de ojos y marcas distintivas), usando `null` cuando no se conocen; SHALL responder con un error entendible cuando no existe.

#### Scenario: Perrito existente
- **WHEN** se solicita `GET /api/perritos/{id}` con un id válido que existe
- **THEN** devuelve el perrito con su foto y sus colores

#### Scenario: Perrito inexistente
- **WHEN** se solicita un id que no existe
- **THEN** responde 404 con un mensaje entendible, no con un identificador de error

#### Scenario: Identificador inválido
- **WHEN** se solicita un id que no es un número
- **THEN** responde 400 con un mensaje entendible

### Requirement: Registrar un perrito con validación en el servidor
El registro SHALL recibir multipart con los datos y la foto, y SHALL validar en el servidor que el nombre no esté vacío, que haya exactamente un color principal, que los colores adicionales sean de 0 a 2 sin repetir ni incluir el principal, y que latitud y longitud estén en rango; la raza es opcional. Además SHALL aceptar los campos descriptivos opcionales del esquema (sexo, etapa de vida, tamaño, longitud de pelaje, patrón de pelaje, color de ojos y marcas distintivas), validándolos contra sus listas fijas, y SHALL guardarlos y devolverlos en la respuesta.

#### Scenario: Registro válido
- **WHEN** se envía un registro con nombre, un color principal, 0 a 2 colores adicionales válidos, latitud/longitud y una foto JPG, PNG o WEBP
- **THEN** responde 201 con el perrito creado

#### Scenario: Registro con campos descriptivos
- **WHEN** se envían sexo, etapa de vida, tamaño, longitud de pelaje, patrón de pelaje, color de ojos o marcas distintivas válidos
- **THEN** responde 201 y el perrito guardado y devuelto incluye esos campos

#### Scenario: Campo descriptivo fuera de las listas
- **WHEN** un campo descriptivo trae un valor que no está en su lista fija (por ejemplo, un sexo distinto de macho/hembra)
- **THEN** responde 400 con el detalle del campo inválido

#### Scenario: Nombre vacío
- **WHEN** el nombre está vacío o son solo espacios
- **THEN** responde 400 indicando que el nombre no puede estar vacío

#### Scenario: Colores inválidos
- **WHEN** no hay color principal, o los adicionales repiten el principal o pasan de dos
- **THEN** responde 400 con el detalle del color inválido

#### Scenario: Falta la foto
- **WHEN** no se envía la foto
- **THEN** responde 400 indicando que falta la foto

#### Scenario: La foto no es una imagen válida
- **WHEN** se envía un archivo que no es una imagen JPG, PNG o WEBP
- **THEN** responde 400 indicando los formatos permitidos, y no almacena el archivo

### Requirement: Registro idempotente
El registro SHALL usar la clave del encabezado `Idempotency-Key` y SHALL devolver el mismo perrito y el mismo identificador ante un segundo envío con la misma clave, sin crear otro registro y sin responder con un error de duplicado.

#### Scenario: Doble envío de la misma clave
- **WHEN** se envía dos veces el registro con la misma `Idempotency-Key`
- **THEN** el segundo envío devuelve el mismo `id` y el mismo resultado, y no se crea un perrito nuevo

#### Scenario: Falta la clave de idempotencia
- **WHEN** se envía un registro sin el encabezado `Idempotency-Key`
- **THEN** responde 400 explicando que falta la clave

#### Scenario: Envíos concurrentes con la misma clave
- **WHEN** dos envíos concurrentes comparten la misma clave
- **THEN** solo se crea un perrito y el otro envío devuelve el registro existente

### Requirement: Servir la foto por el backend
El API SHALL entregar la foto de un perrito a través de un endpoint propio, sin exponer la carpeta local ni el bucket, con el tipo de contenido correspondiente.

#### Scenario: Foto existente
- **WHEN** se solicita `GET /api/perritos/{id}/foto` de un perrito con foto
- **THEN** devuelve la imagen con su `Content-Type`

#### Scenario: Foto no encontrada
- **WHEN** se solicita la foto de un perrito que no existe o cuya imagen no se puede leer
- **THEN** responde 404 con un mensaje entendible

### Requirement: Catálogos del formulario
El API SHALL exponer los catálogos que llena el formulario: razas (incluyendo "Sin raza definida / Criollo"), colores de pelo, colores de ojos y patrones de pelaje.

#### Scenario: Consultar catálogos
- **WHEN** se solicitan `GET /api/razas`, `GET /api/colores`, `GET /api/colores-ojos` y `GET /api/patrones-pelaje`
- **THEN** devuelve las listas de razas, colores de pelo, colores de ojos y patrones de pelaje disponibles

### Requirement: Estadísticas agregadas
El API SHALL exponer un resumen calculado con una consulta de agregación en SQL, con el total de perritos y el conteo por color.

#### Scenario: Consultar estadísticas
- **WHEN** se solicita `GET /api/estadisticas`
- **THEN** devuelve el total de perritos y el conteo por color, calculado con `GROUP BY` en la base de datos

### Requirement: Registro documentado en OpenAPI
Los endpoints del dominio SHALL estar documentados en OpenAPI generado desde los esquemas Zod, con el body del registro mostrando sus campos estructurados y la `Idempotency-Key` como encabezado.

#### Scenario: Revisar el registro en Swagger UI
- **WHEN** se abre `/api/docs` y se expande `POST /api/perritos`
- **THEN** el cuerpo muestra los campos `nombre`, `razaId`, `colorPrincipalId`, `coloresAdicionalesIds`, los descriptivos opcionales (`sexo`, `etapaVida`, `tamano`, `longitudPelaje`, `patronPelajeId`, `colorOjosId`, `marcasDistintivas`), `latitud`, `longitud` y `foto` (binaria), además del encabezado `Idempotency-Key`
