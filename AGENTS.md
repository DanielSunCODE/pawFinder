# AGENTS.md — PawFinder

**Contexto obligatorio:** lee [`MASTER_PROMPT.md`](./MASTER_PROMPT.md) antes de
proponer o implementar cualquier cosa. Ahí están los lineamientos completos de la
consigna (Proyecto 1 — Registro de perritos de la calle) y las reglas que no se
negocian. Las specs en `openspec/` no sustituyen a ese documento: si hay
contradicción, gana `MASTER_PROMPT.md` (o se corrige la spec).

## Dónde está cada cosa

- Lineamientos completos de la consigna: `MASTER_PROMPT.md`.
- Specs y cambios (spec-driven): `openspec/`.
- Reglas del backend (Zod ↔ OpenAPI): `backend/AGENTS.md`.
- Esquema de base de datos: `docs/database-schema.md`.
- App web: `frontend/README.md`. API: `backend/README.md`.

## Reglas rápidas (resumen; el detalle está en el MASTER_PROMPT)

- **Sin Docker** en ningún punto (ni `Dockerfile` ni instrucciones que lo pidan).
- **Nunca** secretos, dependencias ni fotos pesadas en el repositorio; usar
  `.env.example`.
- Validación **en frontend y en backend**; el backend no confía en el cliente.
- **SQL declarativo**: filtrar/ordenar/agrupar en SQL, nunca trayendo todo y
  filtrando con un ciclo. Mantener al menos un JOIN y una agregación.
- Al menos **una transformación funcional** con `map`/`filter`/`reduce`, sin
  mutar y sin ciclos explícitos.
- **Idempotencia real**: el doble envío devuelve el mismo id y el mismo
  resultado; responder "duplicado" no cuenta.
- Imágenes **fuera del código**, con nombre generado por el backend y validación
  por contenido (magic bytes).
- Trabajo en **ramas + pull request** por rol, con commits claros y propios.
- **Documentación viva**: si un cambio afecta versiones, endpoints, variables,
  comandos, estructura, diagramas, paradigmas o despliegue, actualiza `README.md`
  y `docs/` en el mismo cambio. Doc desactualizada = defecto.

## Comandos útiles

```bash
npm install
npm run db:migrate      # aplicar migraciones
npm run db:seed         # catálogos + perritos de prueba (con foto)
npm run db:reset        # recrear base local desde cero
npm run dev:backend     # http://localhost:3000  (api docs en /api/docs)
npm run dev:frontend    # http://localhost:5173
npm run test:backend
```
