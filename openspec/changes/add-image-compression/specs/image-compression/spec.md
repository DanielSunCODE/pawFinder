## Purpose

Reduce el peso de las fotos de los perritos y limpia sus metadatos antes de almacenarlas, para ahorrar espacio, acelerar la subida desde el celular y mejorar la privacidad.

## ADDED Requirements

### Requirement: Compresión y reescalado al registrar
Al registrar un perrito, el sistema SHALL reescalar la foto para que su lado mayor no supere el máximo configurado y SHALL reencodearla con la calidad configurada antes de guardarla.

#### Scenario: Foto grande del celular
- **WHEN** se registra un perrito con una foto cuyo lado mayor supera `IMAGE_MAX_DIMENSION`
- **THEN** la imagen guardada tiene su lado mayor dentro del máximo y pesa menos que la original

### Requirement: Formato y calidad configurables
El formato de salida (`webp` o `jpeg`) y la calidad (1–100) SHALL definirse por configuración, con valores por defecto sensatos.

#### Scenario: Cambiar el formato de salida
- **WHEN** se configura `IMAGE_OUTPUT_FORMAT=jpeg`
- **THEN** la imagen guardada queda en JPEG y se sirve con su `Content-Type` correspondiente

### Requirement: No ampliar imágenes pequeñas
El sistema MUST NOT ampliar una imagen cuyo lado mayor ya es menor o igual al máximo.

#### Scenario: Imagen más chica que el máximo
- **WHEN** se registra una imagen de dimensiones menores al máximo
- **THEN** se conservan sus dimensiones originales

### Requirement: Limpieza de metadatos y orientación
El sistema SHALL corregir la orientación según el EXIF y SHALL descartar los metadatos de la imagen, incluida la ubicación GPS.

#### Scenario: Foto con orientación y GPS
- **WHEN** se sube una foto tomada con el celular que trae orientación y GPS en el EXIF
- **THEN** la imagen guardada se ve con la orientación correcta y no conserva el EXIF ni el GPS

### Requirement: Tolerancia a fallos de procesamiento
Si una imagen ya validada no se puede procesar, el sistema SHALL guardar la imagen original en lugar de rechazar el registro.

#### Scenario: Imagen validada que no se puede procesar
- **WHEN** el validador de contenido acepta la imagen pero el procesamiento falla
- **THEN** el registro se completa guardando la imagen original con su extensión

### Requirement: Documentación del procesamiento
El comportamiento de compresión SHALL documentarse en la especificación OpenAPI y en la configuración de ejemplo.

#### Scenario: Revisar el registro en Swagger UI
- **WHEN** se expande `POST /api/perritos` en `/api/docs`
- **THEN** la descripción indica que la foto se valida y se comprime antes de guardarse
