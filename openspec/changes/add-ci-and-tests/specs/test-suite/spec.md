## Purpose

Define las pruebas que respaldan las reglas críticas del proyecto: unitarias para los módulos puros y de integración para el contrato HTTP del API, ejecutables sin base de datos ni Docker.

## ADDED Requirements

### Requirement: Pruebas unitarias de módulos puros
La suite SHALL incluir pruebas unitarias de los módulos sin efectos externos, al menos: configuración y validación de entorno, configuración de conexión, validación de imagen por contenido, mapeo funcional de respuestas y utilidades del frontend; SHALL ejecutarse sin red y sin base de datos.

#### Scenario: Ejecutar las pruebas unitarias
- **WHEN** se corre la suite del backend y del frontend
- **THEN** las pruebas unitarias se ejecutan sin conectar a base de datos ni a servicios externos

#### Scenario: Una regla pura cambia de comportamiento
- **WHEN** se rompe una regla cubierta (por ejemplo, la validación de imagen o el armado de la respuesta)
- **THEN** al menos una prueba unitaria falla

### Requirement: Pruebas integrales del API con dependencias simuladas
La suite SHALL incluir pruebas integrales que ejerciten el API por HTTP sobre la aplicación de Express, sustituyendo el repositorio y el almacenamiento por dobles, sin requerir base de datos ni Docker.

#### Scenario: Flujo de registro por HTTP
- **WHEN** se envía un registro válido con su clave de idempotencia y su foto
- **THEN** la respuesta respeta el contrato `{ data }` y la prueba no toca la base de datos

#### Scenario: Doble envío idempotente
- **WHEN** se repite el envío con la misma clave de idempotencia
- **THEN** la prueba verifica que se devuelve el mismo identificador y que no se crea un registro nuevo

#### Scenario: Errores entendibles
- **WHEN** se envían datos incompletos o inválidos
- **THEN** la prueba verifica que la respuesta es un error 4xx con un mensaje entendible, no un código crudo

### Requirement: Cobertura de las reglas críticas del dominio
La suite SHALL tener al menos una prueba por cada regla crítica: idempotencia del registro, validación de los campos del registro, validación de imagen por contenido, y exposición de foto, catálogos y estadísticas.

#### Scenario: Revisión de reglas cubiertas
- **WHEN** se compara la suite con la lista de reglas críticas
- **THEN** cada regla listada tiene al menos una prueba asociada

### Requirement: Suite determinista
Las pruebas SHALL ser deterministas, no depender de datos reales ni del orden de ejecución, y SHALL poder ejecutarse repetidamente con el mismo resultado sin limpieza manual de estado externo.

#### Scenario: Ejecución repetida
- **WHEN** la suite se ejecuta dos veces seguidas
- **THEN** produce el mismo resultado
