## Purpose

Define la forma en que el sistema almacena y sirve las fotos de los perritos, separando los archivos subidos del código de la aplicación y permitiendo usar disco local en desarrollo o S3 en producción mediante una misma abstracción.

## ADDED Requirements

### Requirement: Abstracción de almacenamiento con dos modos
El sistema SHALL almacenar las fotos a través de una abstracción que soporte al menos dos modos —disco local y S3— seleccionables por configuración, sin cambios de código en los endpoints que usan el almacenamiento.

#### Scenario: Cambiar de modo de almacenamiento
- **WHEN** se cambia la configuración de almacenamiento de local a S3 o viceversa
- **THEN** el sistema guarda y recupera las fotos en el modo configurado sin modificar la lógica de los endpoints

### Requirement: Ruta de imágenes fuera del proyecto
En el modo local, la ruta de almacenamiento SHALL definirse por configuración (por ejemplo `RUTA_IMAGENES`) y apuntar a un directorio fuera de cualquier carpeta de código o despliegue del proyecto; el README SHALL explicar cómo crearlo.

#### Scenario: Configurar el directorio de imágenes
- **WHEN** una persona sigue el README para definir el directorio de imágenes
- **THEN** las fotos se guardan fuera del repositorio y de la carpeta de despliegue del backend

### Requirement: Las imágenes se sirven a través del backend
Las fotos SHALL entregarse a través de un endpoint del backend y MUST NOT servirse exponiendo directamente una carpeta estática ni el bucket de forma pública.

#### Scenario: Obtener la foto de un perrito
- **WHEN** un cliente solicita la foto de un perrito a través del endpoint correspondiente
- **THEN** el backend entrega la imagen sin exponer directamente la ubicación física ni requerir acceso público al bucket

### Requirement: Nombre de archivo generado por el backend
El backend SHALL generar el nombre de cada archivo de imagen y MUST NOT usar el nombre enviado por la persona usuaria.

#### Scenario: Subida con nombre malicioso
- **WHEN** se sube una imagen con un nombre que intenta sobrescribir o ejecutar archivos
- **THEN** el archivo se guarda con un nombre generado por el backend y el nombre original se ignora

### Requirement: Validación de imagen real
El backend SHALL validar que el archivo recibido sea realmente una imagen y corresponda a los formatos permitidos JPG, PNG o WEBP, no solo por su extensión.

#### Scenario: Archivo que no es imagen
- **WHEN** se envía un archivo con extensión de imagen pero con contenido que no es una imagen válida
- **THEN** el backend rechaza la subida con un mensaje entendible y no almacena el archivo

#### Scenario: Formato no permitido
- **WHEN** se envía una imagen en un formato distinto de JPG, PNG o WEBP
- **THEN** el backend rechaza la subida con un mensaje que indica los formatos permitidos
