## Purpose

Ofrece una especificación OpenAPI generada desde los esquemas Zod del backend y una interfaz Swagger UI para explorar, entender y probar los endpoints sin leer el código fuente.

## ADDED Requirements

### Requirement: Especificación OpenAPI generada desde los esquemas Zod
El backend SHALL generar su especificación OpenAPI a partir de los mismos esquemas Zod que usa para validar, de modo que cada esquema se defina una sola vez y la documentación no se desincronice.

#### Scenario: Un esquema cambia
- **WHEN** se modifica un esquema Zod registrado y se vuelve a levantar el backend
- **THEN** la especificación OpenAPI refleja el cambio sin editar ningún archivo de documentación por separado

### Requirement: Swagger UI disponible para explorar los endpoints
El backend SHALL servir una interfaz Swagger UI que permita ver y probar los endpoints, y SHALL estar disponible en todos los entornos (local y producción).

#### Scenario: Abrir la interfaz de documentación
- **WHEN** una persona abre la ruta de documentación en su navegador
- **THEN** ve la interfaz Swagger UI con los endpoints del API listados y puede ejecutarlos desde ahí

#### Scenario: Disponible en producción
- **WHEN** el backend corre en el entorno de producción
- **THEN** la interfaz de documentación sigue accesible en la misma ruta sin requerir autenticación

### Requirement: Documento OpenAPI servible para herramientas
El backend SHALL exponer el documento OpenAPI en formato JSON en una ruta estable, para consumo de herramientas y validadores.

#### Scenario: Descargar la especificación
- **WHEN** una herramienta solicita el documento OpenAPI en su ruta
- **THEN** recibe un JSON válido conforme a OpenAPI 3.1 que describe los endpoints registrados

### Requirement: La especificación no expone secretos
La especificación OpenAPI SHALL describir el contrato del API y MUST NOT incluir valores de variables de entorno, credenciales ni secretos.

#### Scenario: Revisión del documento generado
- **WHEN** se inspecciona el documento OpenAPI generado
- **THEN** no aparecen valores reales de configuración, contraseñas, llaves ni cadenas de conexión

### Requirement: El endpoint de salud queda documentado
La especificación SHALL documentar el endpoint de salud como ejemplo de referencia, con su respuesta esperada.

#### Scenario: Consultar el endpoint de salud en la documentación
- **WHEN** una persona revisa la documentación
- **THEN** encuentra el endpoint de salud descrito con su método, ruta y forma de la respuesta

### Requirement: Contrato uniforme de respuestas documentado
La especificación SHALL describir el contrato uniforme de éxito (`{ data }`) y de error (`{ error }`), reutilizándolo entre endpoints.

#### Scenario: Respuesta de error documentada
- **WHEN** una persona revisa la documentación de un endpoint que puede fallar
- **THEN** ve documentada la forma de la respuesta de error además de la respuesta exitosa

### Requirement: URL del servidor configurable
El backend SHALL permitir fijar por configuración la URL del servidor que muestra la documentación, para apuntarla a la URL pública en producción sin cambiar código.

#### Scenario: Apuntar a la URL pública
- **WHEN** se define la variable de configuración de la URL del servidor
- **THEN** la documentación usa esa URL como servidor del API en lugar del valor por defecto

### Requirement: La documentación no exige pasos extra de despliegue
Servir la documentación MUST NOT requerir Docker, un proceso aparte ni un paso de generación manual previo al arranque del backend.

#### Scenario: Levantar el backend desde cero
- **WHEN** una persona ejecuta el comando de arranque documentado del backend
- **THEN** la documentación queda disponible sin ejecutar ningún comando adicional de generación

### Requirement: Crecimiento sin duplicar definiciones
La estructura de documentación SHALL permitir que los endpoints de dominio se documenten registrando sus esquemas y rutas una sola vez, sin repetir definiciones ya existentes.

#### Scenario: Documentar un endpoint nuevo
- **WHEN** un integrante agrega un endpoint de dominio con su esquema Zod
- **THEN** puede registrarlo en la documentación reutilizando ese esquema, sin volver a escribir su estructura

### Requirement: Guía que mantiene Zod y OpenAPI sincronizados
El proyecto SHALL incluir un archivo markdown que funcione como system prompt o guía de trabajo para quien modifique el backend (persona o asistente de IA), estableciendo que toda alta, cambio o baja de endpoint MUST actualizar en el mismo cambio su esquema Zod y su registro en OpenAPI.

#### Scenario: Alta de un endpoint
- **WHEN** se agrega un endpoint al backend
- **THEN** la guía exige definir su esquema Zod, validar con él y registrarlo en OpenAPI dentro del mismo cambio, antes de fusionar

#### Scenario: Cambio de un endpoint
- **WHEN** se modifica la entrada, la salida o la ruta de un endpoint existente
- **THEN** la guía exige actualizar el esquema Zod y su registro en OpenAPI para que Swagger refleje el nuevo contrato

#### Scenario: Baja de un endpoint
- **WHEN** se elimina un endpoint
- **THEN** la guía exige eliminar también su registro en OpenAPI y retirar los esquemas que queden sin uso

#### Scenario: Revisión de un pull request
- **WHEN** se revisa un pull request que toca endpoints del backend
- **THEN** la guía sirve de lista de verificación para confirmar que la validación Zod y la documentación OpenAPI quedaron actualizadas
