## Purpose

Define la documentación inicial del proyecto para que una persona sin conocimiento previo pueda instalar, ejecutar y entender el sistema siguiendo el README, y para que el equipo trabaje con un flujo de desarrollo acordado.

## ADDED Requirements

### Requirement: README en la raíz del repositorio
El proyecto SHALL incluir un `README.md` en la raíz del repositorio que describa el proyecto, sus integrantes con su rol, la arquitectura y las tecnologías con versiones exactas.

#### Scenario: Consulta inicial del README
- **WHEN** una persona ajena al equipo abre el repositorio
- **THEN** el README indica el nombre del proyecto, los integrantes con su rol, la arquitectura general y las tecnologías con versiones, aunque algunas secciones de dominio aún sean esqueletos

### Requirement: Instrucciones de instalación y ejecución
El README SHALL incluir requisitos previos, pasos de instalación en orden con comandos listos para copiar, creación de la base de datos, carga de catálogos y datos de prueba, variables de entorno, y cómo ejecutar frontend y backend indicando la URL de cada uno.

#### Scenario: Instalación siguiendo el README
- **WHEN** una persona sigue el README en una máquina limpia
- **THEN** puede instalar dependencias, crear la base, cargar datos de prueba y levantar backend y frontend con los comandos indicados

### Requirement: Probar desde un celular en la misma red
El README SHALL explicar cómo acceder a la aplicación desde un celular en la misma red, de forma que cámara y ubicación funcionen en un contexto seguro.

#### Scenario: Acceso desde el celular
- **WHEN** una persona sigue las instrucciones para abrir la aplicación desde su celular
- **THEN** logra abrirla en el dispositivo y la aplicación puede solicitar permiso de cámara y ubicación

### Requirement: Lista de endpoints de la API
El README SHALL documentar los endpoints del API indicando método, ruta, propósito y forma de los datos de entrada y salida.

#### Scenario: Consultar un endpoint
- **WHEN** una persona busca un endpoint en el README
- **THEN** encuentra su método, ruta y descripción de entrada y salida

### Requirement: Sección de paradigmas
El README SHALL incluir una sección que indique qué paradigma se usa en cada parte del sistema, dónde está ese código y cómo se resuelve la idempotencia del registro, con placeholders completables a medida que avancen los cambios de dominio.

#### Scenario: Revisión de la sección de paradigmas
- **WHEN** el profesor revisa la sección de paradigmas del README
- **THEN** la sección identifica las partes declarativa, imperativa, orientada a objetos y funcional, con la ubicación del código correspondiente

### Requirement: Sección de despliegue
El README SHALL incluir una sección de despliegue que explique dónde corre cada pieza, cómo se obtiene HTTPS, qué cambia entre local y producción variable por variable, qué puertos quedan abiertos y cómo se respaldan y restauran la base y las imágenes.

#### Scenario: Revisión de la sección de despliegue
- **WHEN** el profesor revisa la sección de despliegue del README
- **THEN** encuentra la explicación del despliegue y, si el sistema ya está publicado, la URL pública

### Requirement: Guía de desarrollo y flujo Git
El proyecto SHALL incluir en `docs/` una guía de desarrollo con la estructura de carpetas, el flujo de ramas y pull requests, la convención de mensajes de commit y las reglas para no versionar secretos.

#### Scenario: Consulta del flujo de trabajo
- **WHEN** un integrante necesita saber cómo contribuir
- **THEN** encuentra en `docs/` el flujo de ramas, pull requests y convención de commits, y las reglas sobre secretos, todo de acuerdo con las reglas del proyecto
