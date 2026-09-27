## Purpose

Define la verificación automática del repositorio: en cada push y pull request se instala, valida, prueba y compila el proyecto sin Docker, para dar señal temprana de que un cambio no rompe la entrega.

## ADDED Requirements

### Requirement: Verificación automática en cada push y pull request
El repositorio SHALL ejecutar un pipeline de integración continua en cada push y en cada pull request, y SHALL publicar su resultado (éxito o falla) sobre el cambio enviado.

#### Scenario: Push a una rama
- **WHEN** se hace push a una rama del repositorio
- **THEN** el pipeline se ejecuta y deja su estado disponible (verde si pasa, rojo si falla)

#### Scenario: Apertura o actualización de un pull request
- **WHEN** se abre o se actualiza un pull request
- **THEN** el pipeline se ejecuta sobre la rama del cambio antes de que se pueda fusionar

### Requirement: El pipeline valida instalación, estilo, tipos, pruebas y compilación
El pipeline SHALL instalar las dependencias a partir del lockfile y SHALL ejecutar, tanto para el backend como para el frontend: lint, verificación de tipos, pruebas y build; MUST NOT continuar como exitoso si cualquiera de esos pasos falla.

#### Scenario: Todo correcto
- **WHEN** el código instala, lintea, verifica tipos, pasa las pruebas y compila
- **THEN** el pipeline termina en verde

#### Scenario: Falla una prueba
- **WHEN** alguna prueba falla
- **THEN** el pipeline termina en rojo y el pull request muestra la falla

#### Scenario: Falla de tipos o de lint
- **WHEN** hay un error de tipos o una violación de lint
- **THEN** el pipeline termina en rojo

### Requirement: El pipeline corre sin Docker
El pipeline SHALL ejecutarse directamente sobre el runner con las herramientas del ecosistema Node.js, sin construir ni ejecutar contenedores.

#### Scenario: Revisión del pipeline
- **WHEN** se inspecciona la definición del pipeline
- **THEN** no contiene `Dockerfile`, `docker-compose` ni pasos que construyan o levanten imágenes

### Requirement: Versión de Node.js consistente
El pipeline SHALL usar una versión de Node.js que satisfaga el campo `engines` del proyecto, de modo que CI y desarrollo local coincidan.

#### Scenario: Versión del runner
- **WHEN** el pipeline instala Node.js
- **THEN** la versión elegida cumple el rango declarado en `engines`

### Requirement: Verificación reproducible en local
El repositorio SHALL ofrecer comandos documentados para ejecutar en local el mismo conjunto de chequeos que corre el pipeline.

#### Scenario: Verificar antes de subir
- **WHEN** una persona ejecuta el comando de verificación documentado
- **THEN** obtiene los mismos chequeos (lint, tipos, pruebas y build) que ejecuta el pipeline
