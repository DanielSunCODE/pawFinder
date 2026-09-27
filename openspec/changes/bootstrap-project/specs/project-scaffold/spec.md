## Purpose

Establece la estructura del repositorio, el tooling compartido y las reglas de trabajo para que cualquier integrante pueda clonar, instalar y ejecutar el proyecto de forma consistente, sin Docker y con separación clara entre frontend, backend y base de datos.

## ADDED Requirements

### Requirement: Estructura monorepo del repositorio
El repositorio SHALL organizarse como un monorepo con tres paquetes independientes en la raíz: `frontend/`, `backend/` y `database/`, más una carpeta `docs/`, y SHALL tener el archivo `README.md` en la raíz del repositorio.

#### Scenario: Un integrante nuevo reconoce la estructura
- **WHEN** una persona abre la raíz del repositorio
- **THEN** encuentra `frontend/`, `backend/`, `database/`, `docs/` y `README.md`, y cada paquete tiene su propio `package.json` y su propio archivo de entorno de ejemplo

### Requirement: Instalación y ejecución sin Docker
El proyecto SHALL poder instalarse y ejecutarse sobre una máquina limpia sin Docker; el repositorio MUST NOT contener `Dockerfile`, `docker-compose.yml` ni instrucciones que exijan instalar Docker.

#### Scenario: Búsqueda de artefactos Docker
- **WHEN** se busca en el repositorio cualquier archivo `Dockerfile` o `docker-compose.yml`
- **THEN** no existe ninguno y el README no menciona Docker como requisito de instalación

### Requirement: Scripts de inicio en la raíz
El paquete raíz SHALL exponer scripts que instalen todas las dependencias y levanten frontend y backend por separado, de modo que la instalación y el arranque se ejecuten con comandos únicos y documentados.

#### Scenario: Levantar el backend desde la raíz
- **WHEN** una persona ejecuta el script documentado para el backend
- **THEN** el servidor del backend inicia y expone su endpoint de salud en la URL documentada

#### Scenario: Levantar el frontend desde la raíz
- **WHEN** una persona ejecuta el script documentado para el frontend
- **THEN** el servidor de desarrollo del frontend inicia y sirve la aplicación en la URL documentada

### Requirement: Configuración de ejemplo de entorno
Cada paquete que consume configuración SHALL incluir un archivo `.env.example` con todas las variables requeridas y un valor de ejemplo, y los archivos `.env` reales MUST quedar excluidos del control de versiones.

#### Scenario: Configuración inicial sin secretos
- **WHEN** una persona clona el repositorio
- **THEN** encuentra un `.env.example` por paquete, no encuentra ningún `.env` versionado y el README explica qué variable definir en cada caso

### Requirement: Ignorado de artefactos y secretos
El repositorio SHALL incluir un `.gitignore` que excluya dependencias, artefactos de compilación, archivos de entorno, llaves y las imágenes subidas durante las pruebas.

#### Scenario: Intento de subir dependencias
- **WHEN** se ejecuta `git status` después de instalar dependencias
- **THEN** las carpetas de dependencias y los archivos `.env` no aparecen como cambios a versionar

### Requirement: Flujo de trabajo con ramas y pull requests
El proyecto SHALL trabajarse en ramas con fusión mediante pull request revisado por otro integrante, y los mensajes de commit SHALL describir el cambio realizado.

#### Scenario: Propuesta de un cambio por rol
- **WHEN** un integrante termina una tarea de su rol
- **THEN** abre una rama con nombre descriptivo, hace commits con mensajes claros y abre un pull request solicitando revisión de otro integrante antes de fusionar
