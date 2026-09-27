## Purpose

Define la base del API REST en Express sobre la que se construirán los endpoints del dominio: arranque del servidor, carga de configuración validada, CORS, contrato uniforme de respuestas y manejo de errores entendibles.

## ADDED Requirements

### Requirement: Arranque del servidor y endpoint de salud
El backend SHALL iniciar como un servicio HTTP y SHALL exponer un endpoint de salud que confirme que el servicio está operativo.

#### Scenario: Verificación de salud
- **WHEN** un cliente solicita el endpoint de salud del backend
- **THEN** recibe una respuesta exitosa con un cuerpo JSON que indica que el servicio está activo

### Requirement: Carga de configuración validada al arranque
El backend SHALL cargar su configuración desde variables de entorno al iniciar y SHALL fallar de forma inmediata y legible si falta una variable obligatoria, sin exponer secretos en el mensaje.

#### Scenario: Falta una variable obligatoria
- **WHEN** el backend arranca sin una variable de entorno obligatoria definida
- **THEN** el proceso no queda escuchando y registra un mensaje que nombra la variable faltante sin imprimir su valor

#### Scenario: Configuración completa
- **WHEN** todas las variables obligatorias están definidas
- **THEN** el backend arranca normalmente y el endpoint de salud responde

### Requirement: Contrato uniforme de respuestas
Todas las respuestas del API SHALL tener una forma JSON consistente y predecible, de modo que el frontend pueda interpretarlas sin lógica especial por endpoint.

#### Scenario: Respuesta exitosa
- **WHEN** un endpoint del API resuelve correctamente
- **THEN** la respuesta contiene el resultado esperado bajo una estructura consistente y el código HTTP corresponde al resultado

#### Scenario: Respuesta de error
- **WHEN** un endpoint del API falla por causa del cliente
- **THEN** la respuesta contiene un mensaje entendible para la persona usuaria y el código HTTP correspondiente, nunca un identificador de error crudo como único contenido

### Requirement: Manejo centralizado de errores
El backend SHALL centralizar el manejo de errores para que los fallos no controlados no revelen detalles internos y devuelvan un mensaje genérico con el código HTTP adecuado.

#### Scenario: Error no controlado
- **WHEN** ocurre una excepción no prevista durante el procesamiento de una solicitud
- **THEN** el backend responde con un código de error de servidor y un mensaje genérico, y registra el detalle internamente sin exponerlo al cliente

### Requirement: CORS configurable
El backend SHALL restringir los orígenes permitidos a los definidos por configuración, de modo que en producción solo el frontend publicado pueda consumir el API.

#### Scenario: Origen no permitido
- **WHEN** una página de un origen no autorizado intenta consumir el API desde el navegador
- **THEN** el backend no autoriza el acceso acorde a la configuración de orígenes permitidos

### Requirement: Validación de entrada en el servidor
El backend SHALL validar los datos de entrada de las solicitudes y SHALL rechazar los datos inválidos o incompletos con un mensaje entendible, sin depender de la validación del frontend.

#### Scenario: Cuerpo de solicitud inválido
- **WHEN** llega una solicitud con campos obligatorios ausentes o inválidos, aunque el frontend no la haya validado
- **THEN** el backend rechaza la solicitud con un mensaje que indica qué campos faltan o son inválidos
