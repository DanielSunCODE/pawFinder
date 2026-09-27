## Purpose

Define la base de la aplicación web para que sea utilizable desde un celular en la calle: arranque de la SPA, enrutado base, cliente HTTP centralizado y configuración de entorno, dejando listas las pantallas para el registro, el mapa y el detalle.

## ADDED Requirements

### Requirement: Aplicación web accesible y responsiva
El frontend SHALL servirse como una aplicación web y SHALL adaptarse a pantallas de celular, con una meta de viewport correcta y un diseño utilizable en dispositivos móviles.

#### Scenario: Apertura desde un celular
- **WHEN** una persona abre la aplicación en un navegador de celular
- **THEN** la interfaz se muestra adaptada al ancho de la pantalla sin desplazamiento horizontal forzado

### Requirement: Enrutado base de la aplicación
El frontend SHALL definir rutas para las vistas principales del proyecto (registro, listado, mapa y detalle), aunque en esta etapa sean vistas base.

#### Scenario: Navegación entre vistas
- **WHEN** una persona navega a cada ruta principal
- **THEN** la aplicación renderiza la vista correspondiente sin recargar toda la página

### Requirement: Cliente HTTP centralizado
El frontend SHALL consumir el API a través de un cliente HTTP centralizado cuya URL base provenga de la configuración de entorno.

#### Scenario: Consumir el API con URL configurada
- **WHEN** la aplicación realiza una solicitud al backend
- **THEN** usa la URL base definida por variable de entorno y no una URL codificada en el código fuente

### Requirement: Errores entendibles para la persona usuaria
El frontend SHALL traducir los fallos del API a mensajes entendibles en la interfaz y MUST NOT mostrar códigos de error crudos como mensaje principal.

#### Scenario: Falla una solicitud al API
- **WHEN** una solicitud al backend falla
- **THEN** la interfaz muestra un mensaje comprensible en lugar de un código HTTP o un identificador de error

### Requirement: Configuración de entorno del frontend
El frontend SHALL documentar sus variables de entorno en un `.env.example`, incluyendo la URL base del API, y SHALL permitir cambiar el API consumido entre desarrollo y producción sin cambios de código.

#### Scenario: Cambiar el API entre entornos
- **WHEN** se apunta el frontend a un backend local o al backend publicado
- **THEN** el cambio se realiza únicamente mediante variables de entorno

### Requirement: Uso de cámara y ubicación en contexto seguro
La aplicación SHALL documentar y soportar el uso de cámara y geolocalización únicamente sobre HTTPS o `localhost`, y SHALL permitir probar desde un celular en la misma red mediante una configuración segura.

#### Scenario: Prueba desde un celular en la misma red
- **WHEN** una persona accede desde un celular a la aplicación servida en la red local por una vía segura
- **THEN** el navegador permite solicitar permiso de cámara y ubicación y las funciones responden
