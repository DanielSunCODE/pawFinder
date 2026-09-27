## Purpose

Define la base de datos del proyecto: conexión MySQL con doble modo (local para la instalación en vivo y Aiven para producción), esquema versionado con catálogos y datos de prueba, y las reglas de seguridad que exige la consigna.

## ADDED Requirements

### Requirement: Doble modo de conexión a MySQL
El backend SHALL conectarse a MySQL tomando los parámetros de conexión desde variables de entorno y SHALL funcionar tanto con una base local como con Aiven, sin cambios de código entre ambos entornos.

#### Scenario: Instalación en vivo con base local
- **WHEN** se levanta el sistema en una máquina limpia apuntando a una base MySQL local
- **THEN** el backend se conecta correctamente y las operaciones contra la base funcionan

#### Scenario: Ejecución con Aiven
- **WHEN** el sistema se ejecuta apuntando a Aiven en producción
- **THEN** el backend se conecta usando la configuración de producción, incluyendo el cifrado TLS requerido

### Requirement: La base de datos no se expone a internet
El despliegue de producción SHALL mantener la base de datos accesible solo desde el backend y MUST NOT quedar expuesta públicamente a internet.

#### Scenario: Revisión de puertos abiertos
- **WHEN** se revisa la configuración de red del despliegue
- **THEN** el puerto de la base de datos solo es alcanzable por el backend y no está abierto al público

### Requirement: Migraciones versionadas del esquema
El esquema de base de datos SHALL crearse mediante migraciones versionadas y ordenadas que puedan aplicarse desde cero en una máquina limpia y documentarse en el README.

#### Scenario: Aplicar migraciones desde cero
- **WHEN** una persona ejecuta el procedimiento de creación de la base en una máquina limpia
- **THEN** el esquema queda creado en el orden correcto y las migraciones aplicadas quedan registradas

### Requirement: Esquema con catálogos y relación de colores
El esquema SHALL incluir tablas de catálogo de razas y de colores, una tabla de perritos y una relación que permita un color principal y hasta dos colores adicionales por perrito, con las restricciones que eviten repetir colores en un mismo perrito.

#### Scenario: Consulta con JOIN de perrito y colores
- **WHEN** se consulta un perrito junto con sus colores
- **THEN** el resultado se obtiene mediante una sola consulta con JOIN entre las tablas de perrito y colores

#### Scenario: Consulta con agregación
- **WHEN** se solicita un conteo agrupado, por ejemplo perritos por color o por zona
- **THEN** el conteo se resuelve mediante una consulta con agregación en SQL, no con un ciclo en la aplicación

### Requirement: Catálogos y datos de prueba mínimos
El proyecto SHALL incluir scripts de carga que inserten al menos 10 razas, al menos 10 colores y al menos 15 perritos de prueba con foto, e SHALL incluir la opción de raza "Sin raza definida / criollo".

#### Scenario: Carga de catálogos y datos de prueba
- **WHEN** se ejecuta el script de datos de prueba sobre una base recién creada
- **THEN** quedan cargados al menos 10 razas, 10 colores y 15 perritos con foto, y la raza "Sin raza definida / criollo" está disponible

### Requirement: Soporte de idempotencia en base de datos
El esquema SHALL permitir almacenar una clave de idempotencia asociada a cada registro de perrito de forma que no puedan crearse dos registros para la misma operación.

#### Scenario: Segunda inserción con la misma clave
- **WHEN** se intenta guardar dos perritos con la misma clave de idempotencia
- **THEN** el esquema impide duplicar el registro y permite recuperar el registro original

### Requirement: Respaldo y restauración de la base
El proyecto SHALL documentar y proporcionar el procedimiento para respaldar y restaurar la base de datos.

#### Scenario: Restaurar un respaldo
- **WHEN** una persona sigue el procedimiento de restauración con un respaldo generado
- **THEN** la base queda con los datos del respaldo en una base limpia
